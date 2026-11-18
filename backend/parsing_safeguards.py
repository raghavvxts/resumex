"""Conservative source comparisons: flag possible omissions for human review."""

import json
import re


def parsing_warnings(source, parsed):
    warnings = []
    sections = {
        "education": r"education|academic background",
        "experience": r"(?:work |professional )?experience|employment",
        "projects": r"(?:personal |selected )?projects",
        "skills": r"(?:technical )?skills",
    }
    for section, heading in sections.items():
        if re.search(
            r"^\s*(?:" + heading + r")\s*:?\s*$", source, re.I | re.M
        ) and not any(
            parsed.get(section, {}).values()
            if isinstance(parsed.get(section), dict)
            else parsed.get(section, [])
        ):
            warnings.append(
                f"The source contains a {section} heading, but no {section} were extracted."
            )
    text = json.dumps(
        {
            key: value
            for key, value in parsed.items()
            if key not in {"source_text", "parsing_warnings"}
        },
        ensure_ascii=False,
    )
    if re.search(
        r"^\s*(?:certifications?|awards?|publications?|volunteering|volunteer experience)\s*:?\s*$",
        source,
        re.I | re.M,
    ):
        warnings.append(
            "The source includes an additional section. Check that its facts are included in the editable draft; add missing facts before export."
        )
    emails = re.findall(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", source)
    if any(email.lower() not in text.lower() for email in emails):
        warnings.append("An email address in the source may be missing from the draft.")
    metrics = set(re.findall(r"\b\d+(?:[.,]\d+)?\s*%", source))
    missing = metrics - set(re.findall(r"\b\d+(?:[.,]\d+)?\s*%", text))
    if missing:
        warnings.append(
            "Some percentages may be missing: "
            + ", ".join(sorted(missing))
            + ". Compare with the source."
        )
    source_bullets = len(re.findall(r"^\s*[•●▪◦*-]\s+\S", source, re.M))
    parsed_bullets = sum(
        len(item.get("bullets", []))
        for section in ("experience", "projects", "education")
        for item in parsed.get(section, [])
    )
    if source_bullets > parsed_bullets:
        warnings.append(
            f"The source has {source_bullets} bullet lines; the draft has {parsed_bullets}. Check for omitted content."
        )
    return warnings
