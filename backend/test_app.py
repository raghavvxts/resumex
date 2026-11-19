import unittest

import app as resume_app


class ResumeAnalyzerTests(unittest.TestCase):
    def test_pdf_extraction_separates_pages(self):
        from unittest.mock import Mock, patch
        pages = [Mock(), Mock()]
        pages[0].extract_text.return_value = "Skills"
        pages[1].extract_text.return_value = "Experience"
        with patch.object(resume_app.PyPDF2, "PdfReader", return_value=Mock(pages=pages)):
            self.assertEqual(resume_app.extract_text(None), "Skills\nExperience")

    def test_pdf_page_limit_prevents_extraction(self):
        from unittest.mock import Mock, patch
        page = Mock()
        with patch.object(resume_app.PyPDF2, "PdfReader", return_value=Mock(pages=[page] * 51)):
            with self.assertRaisesRegex(ValueError, "50 pages"):
                resume_app.extract_text(None)
        page.extract_text.assert_not_called()

    def test_pdf_text_limit_stops_before_later_pages(self):
        from unittest.mock import Mock, patch
        first, later = Mock(), Mock()
        first.extract_text.return_value = "x" * (resume_app.MAX_RESUME_CHARACTERS + 1)
        with patch.object(resume_app.PyPDF2, "PdfReader", return_value=Mock(pages=[first, later])):
            with self.assertRaisesRegex(ValueError, "30,000 characters"):
                resume_app.extract_text(None)
        later.extract_text.assert_not_called()

    def test_normalize_token_synonyms(self):
        self.assertEqual(resume_app.normalize_token("JS"), "javascript")
        self.assertEqual(resume_app.normalize_token("ml"), "machine-learning")

    def test_extract_phrase_keywords(self):
        text = "Built full stack apps with machine learning and REST API design"
        phrases = resume_app.extract_phrase_keywords(text)
        self.assertIn("full-stack", phrases)
        self.assertIn("machine-learning", phrases)
        self.assertIn("rest-api", phrases)

    def test_section_scores_shape(self):
        resume_text = """
        Summary
        Python engineer with backend skills.
        Skills
        Python SQL Flask REST API
        Experience
        Built API services and optimized queries.
        Projects
        Resume matcher using machine learning.
        Education
        BTech Computer Science
        """
        job_tokens = resume_app.extract_keyword_tokens(
            "Python SQL REST API machine learning backend engineer"
        )
        section_scores = resume_app.calculate_section_scores(resume_text, job_tokens)

        expected_sections = {"summary", "skills", "experience", "projects", "education"}
        self.assertEqual(set(section_scores.keys()), expected_sections)
        for value in section_scores.values():
            self.assertGreaterEqual(value, 0)
            self.assertLessEqual(value, 100)

    def test_checklist_contract(self):
        checklist = resume_app.build_checklist(
            score=72,
            keyword_coverage=48,
            section_scores={"experience": 40},
            missing_keywords=["kubernetes", "docker"],
            resume_text="Summary\nImproved API latency by 20% in production.",
        )

        self.assertIn("completion_percent", checklist)
        self.assertIn("items", checklist)
        self.assertTrue(isinstance(checklist["items"], list))
        self.assertGreaterEqual(checklist["completion_percent"], 0)
        self.assertLessEqual(checklist["completion_percent"], 100)

    def test_validate_request_missing_file(self):
        with resume_app.app.test_request_context(
            "/analyze",
            method="POST",
            data={"job_description": "Python backend role with SQL APIs and testing"},
        ):
            file, job_desc, role_level, years_experience, error_response = (
                resume_app.validate_request()
            )
            self.assertIsNone(file)
            self.assertIsNone(job_desc)
            self.assertIsNotNone(error_response)

    def test_validate_request_optional_job_desc(self):
        from io import BytesIO
        from werkzeug.datastructures import FileStorage
        from reportlab.pdfgen import canvas

        file_data = BytesIO()
        pdf = canvas.Canvas(file_data)
        pdf.drawString(50, 750, "John Doe Summary Python engineer")
        pdf.save()
        file_data.seek(0)
        mock_file = FileStorage(
            stream=file_data, filename="resume.pdf", content_type="application/pdf"
        )

        with resume_app.app.test_request_context(
            "/analyze",
            method="POST",
            data={"resume": mock_file, "role_level": "mid", "years_experience": "4"},
        ):
            file, job_desc, role_level, years_experience, error_response = (
                resume_app.validate_request()
            )
            self.assertIsNotNone(file)
            self.assertEqual(job_desc, "")
            self.assertEqual(role_level, "mid")
            self.assertEqual(years_experience, 4)
            self.assertIsNone(error_response)


class WorkflowRegressionTests(unittest.TestCase):
    def setUp(self):
        self.client = resume_app.app.test_client()

    def test_pdf_export_round_trip_and_validation(self):
        from io import BytesIO

        response = self.client.post(
            "/generate-pdf",
            json={
                "personal_info": {"name": "Alex Example", "email": "alex@example.com"},
                "template_name": "simple_resume",
                "summary": "Built accessible apps & improved latency 30%.",
                "experience": [
                    {
                        "role": "Engineer",
                        "company": "Example Labs",
                        "bullets": ["Reduced latency by 30%."],
                    }
                ],
                "skills": {"tools": "Git, Docker"},
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, "application/pdf")
        reader = resume_app.PyPDF2.PdfReader(BytesIO(response.data))
        text = "".join(page.extract_text() for page in reader.pages)
        self.assertIn("Alex Example", text)
        self.assertIn("Reduced latency by 30%", text)
        self.assertNotIn("Backend Error", text)
        self.assertEqual(self.client.post("/generate-pdf", json=[]).status_code, 400)
        self.assertEqual(
            self.client.post(
                "/generate-pdf",
                json={"personal_info": {}, "template_name": "deedy_resume"},
            ).status_code,
            400,
        )

    def test_audit_recognizes_percentages_and_filters_filler(self):
        from unittest.mock import patch

        with patch.object(resume_app, "ai_client", None):
            response = self.client.post(
                "/analyze",
                data={
                    "resume_text": "Alex Example\nSummary\nEngineer\nSkills\nPython\nExperience\nReduced latency by 30%.\nProjects\nDashboard\nEducation\nBSc"
                },
            )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            next(
                item
                for item in response.json["checklist"]["items"]
                if item["id"] == "metrics"
            )["completed"]
        )
        words = resume_app.extract_keywords(
            "We are looking for candidates who must have Python, C++ and technologies."
        )
        self.assertTrue({"python", "c++"}.issubset(words))
        self.assertFalse(
            {"looking", "candidates", "must", "have", "technologies."} & words
        )

    def test_chat_context_and_cover_tone(self):
        from unittest.mock import Mock, patch

        ai = Mock()
        ai.models.generate_content.return_value.text = "Useful response"
        data = {
            "resume_text": "Alex Example\nEngineer with three years React experience",
            "role_level": "senior",
            "years_experience": "3",
            "message": "Improve summary",
            "history": '[{"role":"user","content":"Remember my project"}]',
        }
        with patch.object(resume_app, "ai_client", ai):
            self.assertEqual(self.client.post("/chat", data=data).status_code, 200)
            prompt = ai.models.generate_content.call_args.kwargs["contents"]
            self.assertIn("three years React", prompt)
            self.assertIn("Remember my project", prompt)
            self.assertIn("senior", prompt)
            self.assertEqual(
                self.client.post(
                    "/cover-letter", data={**data, "tone": "concise"}
                ).status_code,
                200,
            )
            self.assertIn(
                "at most 150 words",
                ai.models.generate_content.call_args.kwargs["contents"],
            )

    def test_ai_outages_are_not_fabricated_success(self):
        from unittest.mock import Mock, patch

        ai = Mock()
        ai.models.generate_content.side_effect = RuntimeError("quota")
        with patch.object(resume_app, "ai_client", ai), patch.object(
            resume_app, "ai_model_candidates", return_value=["test"]
        ):
            for route in ("/cover-letter", "/skills-analysis", "/parse-resume"):
                response = self.client.post(
                    route, data={"resume_text": "Alex Example React Engineer"}
                )
                self.assertEqual(response.status_code, 503, route)
                self.assertIn("error", response.json)

    def test_malformed_ai_responses_do_not_reach_ui(self):
        from unittest.mock import Mock, patch

        ai = Mock()
        ai.models.generate_content.return_value.text = '{"technical": {"score": "bad"}}'
        with patch.object(resume_app, "ai_client", ai), patch.object(
            resume_app, "ai_model_candidates", return_value=["test"]
        ):
            self.assertEqual(
                self.client.post(
                    "/skills-analysis", data={"resume_text": "Alex Example"}
                ).status_code,
                503,
            )
            self.assertEqual(
                self.client.post(
                    "/parse-resume", data={"resume_text": "Alex Example"}
                ).status_code,
                503,
            )

    def test_corrupt_pdf_is_rejected(self):
        from io import BytesIO

        response = self.client.post(
            "/analyze", data={"resume": (BytesIO(b"not a pdf"), "resume.pdf")}
        )
        self.assertEqual(response.status_code, 400)


class AdditionalRegressionTests(unittest.TestCase):
    def test_concise_letter_has_a_hard_word_limit(self):
        from unittest.mock import Mock, patch

        ai = Mock()
        ai.models.generate_content.return_value.text = " ".join(["word"] * 250)
        with patch.object(resume_app, "ai_client", ai):
            response = resume_app.app.test_client().post(
                "/cover-letter",
                data={"resume_text": "Alex Example Engineer", "tone": "concise"},
            )
        self.assertEqual(response.status_code, 200)
        self.assertLessEqual(len(response.json["cover_letter"].split()), 150)

    def test_parse_preserves_source_and_validates_sections(self):
        from unittest.mock import Mock, patch

        ai = Mock()
        ai.models.generate_content.return_value.text = (
            '{"personal_info":{"name":"Alex Example"},"summary":"Original summary"}'
        )
        with patch.object(resume_app, "ai_client", ai):
            response = resume_app.app.test_client().post(
                "/parse-resume", data={"resume_text": "Alex Example Original summary"}
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["source_text"], "Alex Example Original summary")
        self.assertEqual(response.json["summary"], "Original summary")
        self.assertEqual(response.json["experience"], [])


if __name__ == "__main__":
    unittest.main()
