#!/bin/bash

set -e

set -x

cd "$(Rhythmoji_V2 "$0")"

echo "Installing Node.js dependencies..."
npm install

echo "Installing Python dependencies..."
pip install -r requirements.txt
