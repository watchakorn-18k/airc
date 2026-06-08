#!/bin/bash
# Usage: ./scripts/brew-update-sha256.sh <version>
# Update sha256 in both Formula/acr.rb and .homebrew-tap/acr.rb

set -e
VERSION="${1:?Usage: ./scripts/brew-update-sha256.sh <version>}"

SHA256=$(curl -sL "https://registry.npmjs.org/acr/-/acr-${VERSION}.tgz" | shasum -a 256 | awk '{print $1}')

echo "acr@${VERSION} sha256: ${SHA256}"

# Update Formula/acr.rb
sed -i '' "s/PLACEHOLDER_SHA256/${SHA256}/g" Formula/acr.rb

# Update .homebrew-tap/acr.rb
sed -i '' "s/PLACEHOLDER_SHA256/${SHA256}/g" .homebrew-tap/acr.rb

echo "Updated Formula/acr.rb and .homebrew-tap/acr.rb"
