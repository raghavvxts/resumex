import json
import unittest
from io import BytesIO
from unittest.mock import patch

import PyPDF2
from parsing_safeguards import parsing_warnings
from pdf_exports import escape_tex, render_template_pdf
from model_runtime import OllamaClient
from warm_templates import FIXTURE


class ExportTests(unittest.TestCase):
    def test_escape_does_not_interpret_input(self):
        self.assertEqual(
            escape_tex(r"\input{secret} 30% & $"),
            r"\textbackslash{}input\{secret\} 30\% \& \$",
        )

    def test_template_whitelist(self):
        with self.assertRaises(ValueError):
            render_template_pdf(FIXTURE, "../../secret")

    def test_source_loss_warnings(self):
        source = "Alex\nalex@example.com\nExperience\n• Reduced latency by 30%\nEducation\nUniversity"
        warnings = parsing_warnings(
            source,
            {
                "personal_info": {"name": "Alex"},
                "experience": [],
                "education": [],
                "projects": [],
                "skills": {},
            },
        )
        self.assertTrue(any("experience" in warning for warning in warnings))
        self.assertTrue(any("30%" in warning for warning in warnings))
        self.assertTrue(any("email" in warning for warning in warnings))
        self.assertEqual(parsing_warnings("Alex Engineer", FIXTURE), [])

    def test_local_provider_json_mode_and_loopback(self):
        from types import SimpleNamespace

        response = BytesIO(json.dumps({"message": {"content": '{"ok":true}'}}).encode())
        with patch("model_runtime.urlopen", return_value=response) as call:
            result = OllamaClient().generate_content(
                model="local",
                contents="fixture",
                config=SimpleNamespace(response_mime_type="application/json"),
            )
        self.assertEqual(json.loads(result.text), {"ok": True})
        self.assertEqual(json.loads(call.call_args.args[0].data)["format"], "json")
        with patch.dict("os.environ", {"OLLAMA_BASE_URL": "http://example.com"}):
            with self.assertRaises(ValueError):
                OllamaClient()

    def test_mlx_retries_only_unsupported_json_mode(self):
        from urllib.error import HTTPError
        from types import SimpleNamespace

        error = HTTPError(
            "http://127.0.0.1",
            501,
            "unsupported",
            {},
            BytesIO(b'{"error":"structured output is unavailable"}'),
        )
        response = BytesIO(b'{"message":{"content":"{}"}}')
        with patch("model_runtime.urlopen", side_effect=[error, response]) as call:
            self.assertEqual(
                OllamaClient()
                .generate_content(
                    model="local",
                    contents="JSON",
                    config=SimpleNamespace(response_mime_type="application/json"),
                )
                .text,
                "{}",
            )
        self.assertNotIn("format", json.loads(call.call_args.args[0].data))


# Run separately after build.sh: RUN_TEMPLATE_TESTS=1 python -m unittest test_exports -v
import os


@unittest.skipUnless(os.getenv("RUN_TEMPLATE_TESTS") == "1", "Requires warmed Tectonic")
class CompiledTemplateTests(unittest.TestCase):
    def test_real_templates_preserve_text(self):
        import copy

        for template in ("jakes_resume", "deedy_resume"):
            data = copy.deepcopy(FIXTURE)
            data["summary"] = (
                r"Built tools & improved latency 30%. Literal \input{secret} stays text. Symbols: $ # _ ~ ^."
            )
            pdf = render_template_pdf(data, template)
            reader = PyPDF2.PdfReader(BytesIO(pdf))
            text = "".join(page.extract_text() for page in reader.pages)
            self.assertEqual(len(reader.pages), 1)
            for value in (
                "Alex",
                "Example",
                "alex@example.com",
                "30%",
                "Python",
                "Example University",
            ):
                self.assertIn(
                    "".join(value.lower().split()),
                    "".join(text.lower().split()),
                    template,
                )

    def test_deedy_rejects_vertical_overflow(self):
        import copy

        data = copy.deepcopy(FIXTURE)
        data["experience"][0]["bullets"] = [
            "Built and maintained accessible software for teams."
        ] * 100
        with self.assertRaisesRegex(ValueError, "layout"):
            render_template_pdf(data, "deedy_resume")


if __name__ == "__main__":
    unittest.main()
