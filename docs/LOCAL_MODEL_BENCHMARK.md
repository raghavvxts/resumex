# Local inference check — November 18, 2026

Ollama 0.40.15, Qwen3.5 4B (`7f3251fa6878`, approximately 4 GB), Apple M5 with 16 GB RAM. Local loopback only. Synthetic resume, no user files. Temperature 0.1, context 8192, thinking disabled. One sequential smoke run through the actual Flask endpoints:

| Workflow | HTTP | Seconds |
|---|---:|---:|
| Parsing | 200 | 12.95 |
| Analysis | 200, AI status ok | 12.95 |
| Skills | 200 | 7.35 |
| Concise cover letter | 200, 121 words | 5.53 |
| Chat | 200 | 3.51 |

Parsing preserved the exact name, email and 30% achievement and returned education, experience and projects. Source comparisons reported no omissions for this fixture. Each endpoint applied its normal schema checks. This single synthetic case is a functionality check, not a quality benchmark or proof of equivalence to Gemini across real resumes.

Ollama's MLX runner rejected constrained JSON with HTTP 501. The adapter retries that specific unsupported-format response without constrained decoding; prompts still request JSON and backend validation still rejects malformed output. Other errors are not silently retried this way.

Reproduce: `AI_PROVIDER=ollama python benchmark_local.py` in backend with Ollama running and the model installed. Results go to `/tmp/resumaxer-model-results.json`. AI_PROVIDER defaults to Gemini. Public production remains on Gemini: Vercel/Render cannot reach a laptop's loopback, and no paid inference host was provisioned.
