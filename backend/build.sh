#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Download and install Tectonic (LaTeX engine) for PDF generation
# Tectonic is a self-contained TeX engine that downloads packages on the fly
echo "Installing Tectonic..."
curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh

# Move it to a bin directory in the project root
mkdir -p .bin
mv tectonic .bin/

echo "Build complete."
