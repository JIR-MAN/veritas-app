#!/usr/bin/env bash
# Copies the source tree (no node_modules or generated files) to the shared project folder.
set -euo pipefail
cd "$(dirname "$0")/.."
dest=/mnt/project-files/veritas-app/
mkdir -p "$dest"
git ls-files --cached --others --exclude-standard -z | tar --null -T - -czf /tmp/veritas-src.tgz
cp /tmp/veritas-src.tgz "${dest}veritas-app-src.tgz"
ls -la "$dest"
