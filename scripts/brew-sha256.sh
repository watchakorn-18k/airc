#!/bin/bash
# Usage: ./scripts/brew-sha256.sh <version>
# Compute npm package sha256 for Homebrew formula

set -e
VERSION="${1:?Usage: ./scripts/brew-sha256.sh <version>}"

echo "Fetching acr@${VERSION} from npm..."
curl -sL "https://registry.npmjs.org/acr/-/acr-${VERSION}.tgz" | shasum -a 256 | awk '{print $1}'
