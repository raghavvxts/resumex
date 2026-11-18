"""Escaped, isolated exports using the upstream Jake and Deedy layouts."""

import os
import re
import shutil
import subprocess
import tempfile
import threading
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

ROOT = Path(__file__).resolve().parent
SLOTS = threading.BoundedSemaphore(2)
ESCAPES = {
    "\\": r"\textbackslash{}",
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
}


def escape_tex(value):
    if isinstance(value, str):
        return "".join(
            ESCAPES.get(char, char)
            for char in value.replace("\r", " ").replace("\n", " ")
        )
    if isinstance(value, list):
        return [escape_tex(item) for item in value]
    if isinstance(value, dict):
        return {key: escape_tex(item) for key, item in value.items()}
    return value


def render_template_pdf(data, template, *, warm=False):
    if not isinstance(template, str) or template not in {
        "jakes_resume",
        "deedy_resume",
    }:
        raise ValueError("Unsupported resume template.")
    binary = (
        os.getenv("TECTONIC_BIN")
        or shutil.which("tectonic")
        or str(ROOT / ".bin/tectonic")
    )
    if not Path(binary).is_file():
        raise RuntimeError(
            "Template compiler is unavailable. Choose Simple or try again later."
        )
    if not SLOTS.acquire(blocking=False):
        raise RuntimeError("PDF exports are busy. Please retry shortly.")
    try:
        env = Environment(
            loader=FileSystemLoader(ROOT / "templates"),
            block_start_string="<%",
            block_end_string="%>",
            variable_start_string="<<",
            variable_end_string=">>",
            comment_start_string="<#",
            comment_end_string="#>",
            autoescape=False,
        )
        context = escape_tex(data)
        info = context["personal_info"]
        context["contacts"] = [
            info[key]
            for key in ("email", "phone", "linkedin", "github", "portfolio")
            if info.get(key)
        ]
        names = info.get("name", "").split(" ", 1)
        context.update(
            first_name=names[0], last_name=names[1] if len(names) > 1 else ""
        )
        context["skills"] = {
            escape_tex(key.title()): (
                ", ".join(value) if isinstance(value, list) else value
            )
            for key, value in context.get("skills", {}).items()
        }
        with tempfile.TemporaryDirectory(prefix="resume-export-") as folder:
            work = Path(folder)
            if template == "deedy_resume":
                shutil.copytree(ROOT / "templates/deedy", work, dirs_exist_ok=True)
            (work / "resume.tex").write_text(
                env.get_template(template + ".tex").render(**context), encoding="utf-8"
            )
            command = [
                binary,
                "--untrusted",
                "--keep-logs",
                "--bundle",
                "https://relay.fullyjustified.net/default_bundle_v33.tar",
            ]
            if not warm:
                command.append("--only-cached")
            command.append("resume.tex")
            process_env = {**os.environ, "XDG_CACHE_HOME": str(ROOT / ".cache")}
            result = subprocess.run(
                command,
                cwd=work,
                env=process_env,
                capture_output=True,
                text=True,
                timeout=900 if warm else 45,
            )
            log = (
                (work / "resume.log").read_text(errors="replace")
                if (work / "resume.log").exists()
                else ""
            )
            if result.returncode or not (work / "resume.pdf").exists():
                if warm:
                    print(result.stdout, result.stderr, log[-6000:])
                raise RuntimeError(
                    "Template could not compile. Choose Simple or shorten long fields and retry."
                )
            if "Missing character:" in log + result.stderr:
                raise ValueError(
                    "This template’s fonts cannot display some characters. Check names and symbols before exporting."
                )
            if re.search(r"Overfull \\[hv]box", log + result.stderr):
                raise ValueError(
                    "Content exceeds this template’s layout. Shorten long fields or choose Simple for automatic wrapping and pagination."
                )
            return (work / "resume.pdf").read_bytes()
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(
            "Template export timed out. Choose Simple or retry."
        ) from exc
    finally:
        SLOTS.release()
