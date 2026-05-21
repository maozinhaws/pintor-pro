#!/usr/bin/env bash
# sync-app.sh — espelha dist/index.html para todos os locais Android
# Uso: ./sync-app.sh

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/dist/index.html"

if [ ! -f "$SRC" ]; then
  echo "✗ ERRO: $SRC não existe"
  exit 1
fi

# Locais espelho
TARGETS=(
  "$ROOT/android/app/src/main/assets/public/index.html"
  "$ROOT/android/app/build/intermediates/assets/debug/mergeDebugAssets/public/index.html"
)

for t in "${TARGETS[@]}"; do
  if [ -d "$(dirname "$t")" ]; then
    cp "$SRC" "$t"
    echo "✓ $t"
  else
    echo "⊘ skip (dir não existe): $(dirname "$t")"
  fi
done

# Verifica
SRC_HASH=$(md5sum "$SRC" | cut -d' ' -f1)
echo ""
echo "=== Verificação MD5 ==="
for t in "${TARGETS[@]}" "$SRC"; do
  if [ -f "$t" ]; then
    H=$(md5sum "$t" | cut -d' ' -f1)
    [ "$H" = "$SRC_HASH" ] && echo "✓ $H  $t" || echo "✗ $H  $t  (diferente!)"
  fi
done
