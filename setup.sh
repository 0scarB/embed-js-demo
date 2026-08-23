#!/bin/sh

set -e

echo "== Downloading QuickJS..."
set -x
rm -rf third_party/quickjs
cd third_party
wget https://bellard.org/quickjs/quickjs-2026-06-04.tar.xz
tar xf quickjs-2026-06-04.tar.xz
rm quickjs-2026-06-04.tar.xz
mv quickjs-2026-06-04 quickjs
cd ..
set +x
echo "== QuickJS download complete."

