Backend Setup

Requirements
- Python 3.10+
- Virtual environment (recommended)

Install dependencies

```bash
python -m pip install -r requirements.txt
```

Environment variables
- Copy `.env.example` to `.env`
- Required: `GEMINI_API_KEY`
- Optional: `GEMINI_MODEL`, `FRONTEND_ORIGINS`, `FLASK_DEBUG`, `FLASK_HOST`, `FLASK_PORT`

Run in development

```bash
python app.py
```

Run in production (WSGI)

```bash
gunicorn -w 1 --threads 4 --timeout 100 -b 0.0.0.0:5000 wsgi:app
```

Run backend tests

```bash
python -m unittest -v test_app.py
```

PDF export offers Jake and Deedy via Tectonic and Simple via ReportLab. Run `./build.sh` before serving to install the pinned compiler and cache TeX packages. Requests compile in temporary directories with escaped input, untrusted mode, a 45-second deadline and no package downloads. Overflow returns an explicit error; Simple wraps and paginates long content.

AI defaults to Gemini. For local inference: install Ollama, run `ollama serve`, `ollama pull qwen3.5:4b`, then set `AI_PROVIDER=ollama` (no Gemini key needed). The default endpoint is loopback. A public deployment requires its own reachable, secured inference host; a laptop is not production hosting. See `.env.example`.
