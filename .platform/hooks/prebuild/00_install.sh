#!/bin/bash
set -e

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
  echo "Yarn not found, installing..."

  sudo npm install -g yarn
else
  echo "Yarn is already installed."
fi

# Install dependencies
yarn install --production
