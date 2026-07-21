#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Download and install Tectonic (LaTeX engine) for PDF generation
# Tectonic is a self-contained TeX engine that downloads packages on the fly
echo "Installing Tectonic..."
curl -sL https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.14.1/tectonic-0.14.1-x86_64-unknown-linux-gnu.tar.gz | tar -xz

# Move it to a bin directory in the project root
mkdir -p .bin
mv tectonic .bin/

echo "Build complete."
