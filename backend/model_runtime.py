"""Optional local inference using Ollama's loopback HTTP API."""

import json
import os
from types import SimpleNamespace
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


class OllamaClient:
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip(
            "/"
        )
        parsed = urlparse(self.base_url)
        if parsed.scheme != "https" and not (
            parsed.scheme == "http"
            and parsed.hostname in {"localhost", "127.0.0.1", "::1"}
        ):
            raise ValueError("Ollama requires HTTPS unless it runs on loopback.")
        self.models = self

    def generate_content(self, *, model, contents, config=None):
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": contents}],
            "stream": False,
            "think": False,
            "options": {"temperature": 0.1, "num_ctx": 8192, "num_predict": 4096},
        }
        if getattr(config, "response_mime_type", None) == "application/json":
            payload["format"] = "json"
        timeout = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "75"))

        def send():
            request = Request(
                self.base_url + "/api/chat",
                data=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )
            with urlopen(request, timeout=timeout) as response:
                return json.load(response)

        try:
            data = send()
        except HTTPError as exc:
            # Ollama's MLX runner lacks constrained JSON; callers still validate the schema.
            if (
                exc.code != 501
                or "format" not in payload
                or b"structured output is unavailable" not in exc.read(1024)
            ):
                raise
            del payload["format"]
            data = send()
        if not isinstance(data.get("message", {}).get("content"), str):
            raise ValueError("Local model returned an invalid response.")
        return SimpleNamespace(text=data["message"]["content"])
