#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
pip install -r requirements.txt
mkdir -p .bin
if ! command -v tectonic >/dev/null 2>&1 && [ ! -x .bin/tectonic ]; then
  archive="$(mktemp)"
  trap 'rm -f "$archive"' EXIT
  curl --fail --location --retry 3 'https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.17.0/tectonic-0.17.0-x86_64-unknown-linux-musl.tar.gz' -o "$archive"
  echo "8533d07f9ccbd7a65824b9e0459041bca34af1eb33daba48f59215593753a3b7  $archive" | sha256sum --check
  tar -xzf "$archive" -C .bin tectonic
fi
python warm_templates.py
