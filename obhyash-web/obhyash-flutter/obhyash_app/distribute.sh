#!/bin/bash
# ============================================
# Obhyash App — Firebase App Distribution
# Usage: ./distribute.sh "Release note here"
# ============================================

FIREBASE_APP_ID="1:39442338897:android:a553e9825d0f3a16cf1470"
TESTERS_GROUP="beta-testers"
RELEASE_NOTES="${1:-নতুন আপডেট। Bug পেলে জানাও।}"

echo "🔨 Building release APK..."
flutter build apk --release --flavor production

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "📦 Copying APK to LimonSSD..."
cp build/app/outputs/flutter-apk/app-release.apk /Volumes/LimonSSD/obhyash-app-release.apk

echo "🚀 Uploading to Firebase App Distribution..."
firebase appdistribution:distribute \
  build/app/outputs/flutter-apk/app-release.apk \
  --app "$FIREBASE_APP_ID" \
  --groups "$TESTERS_GROUP" \
  --release-notes "$RELEASE_NOTES"

if [ $? -eq 0 ]; then
  echo "✅ Done! Testers will receive an email shortly."
else
  echo "❌ Distribution failed. Check Firebase CLI login: firebase login"
fi
