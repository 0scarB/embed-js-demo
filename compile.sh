#!/bin/sh

set -e

if [ ! -f third_party/quickjs/libquickjs.a ]; then
    echo "== Compiling QuickJs..."
    set -x
    cd third_party/quickjs
    make
    cd ../..
    set +x
    echo "== QuickJs compiled successfully."
fi

echo "== Compiling main.c..."
set -x
cc main.c -o main -L./third_party/quickjs -lquickjs -lm
set +x
echo "== main.c compiled successfully."

echo "== Compiling TypeScript to JavaScript..."
set -x
./third_party/typescript/lib/tsc game.ts
set +x
echo "== TypeScript successfully compiled to JavaScript."

