#!/bin/bash
set -e

FLUTTER_HOME="$HOME/flutter"

# ── Install Flutter (cached between builds if Netlify caches $HOME) ──────────
if [ ! -d "$FLUTTER_HOME" ]; then
  echo "Cloning Flutter (${FLUTTER_CHANNEL:-stable})..."
  git clone https://github.com/flutter/flutter.git \
      -b "${FLUTTER_CHANNEL:-stable}" \
      --depth 1 \
      "$FLUTTER_HOME"
fi

export PATH="$FLUTTER_HOME/bin:$PATH"

# Accept Android licenses silently (not needed for web, but avoids warnings)
flutter config --no-analytics

# Pre-cache web artifacts
flutter precache --web

echo "Flutter version: $(flutter --version)"

# ── Install dependencies ─────────────────────────────────────────────────────
flutter pub get

# ── Build Flutter Web ────────────────────────────────────────────────────────
# --base-href /  → correctly resolves assets at the domain root
flutter build web --release --base-href /

echo "Build complete → build/web"
