#!/usr/bin/env bash
# Build a release APK of the native app (rn-taskito-foundation).
#
# Needs a JDK 17+ and the Android SDK (ANDROID_HOME), as `make android` does.
# Signs the APK when a keystore is given, and copies it to dist/.
#
#   scripts/build-apk.sh                  # debug APK (no signing)
#   scripts/build-apk.sh release          # release APK (needs a keystore)
#
# Release signing (the owner's key, never committed):
#   export ANDROID_KEYSTORE=/path/to/keystore.jks
#   export ANDROID_KEYSTORE_PASSWORD=…
#   export ANDROID_KEY_ALIAS=…
#   export ANDROID_KEY_PASSWORD=…
set -euo pipefail
cd "$(dirname "$0")/.."

MODE="${1:-debug}"

command -v java >/dev/null 2>&1 || { echo "scripts/build-apk.sh needs a JDK 17+ and the Android SDK (see mobile/README.md)"; exit 1; }
[ -n "${ANDROID_HOME:-}${ANDROID_SDK_ROOT:-}" ] || { echo "scripts/build-apk.sh needs ANDROID_HOME (or ANDROID_SDK_ROOT)"; exit 1; }

mkdir -p dist

if [ "$MODE" = release ]; then
  : "${ANDROID_KEYSTORE:?release needs ANDROID_KEYSTORE}"
  : "${ANDROID_KEYSTORE_PASSWORD:?release needs ANDROID_KEYSTORE_PASSWORD}"
  : "${ANDROID_KEY_ALIAS:?release needs ANDROID_KEY_ALIAS}"
  : "${ANDROID_KEY_PASSWORD:?release needs ANDROID_KEY_PASSWORD}"

  # The signing config the Gradle build reads (keystore.properties, git-ignored;
  # build.gradle.kts reads storeFile/storePassword/keyAlias/keyPassword).
  cat > mobile/android/keystore.properties <<EOF
storeFile=$ANDROID_KEYSTORE
storePassword=$ANDROID_KEYSTORE_PASSWORD
keyAlias=$ANDROID_KEY_ALIAS
keyPassword=$ANDROID_KEY_PASSWORD
EOF

  cd mobile/android
  ./gradlew --no-daemon :app:assembleRelease
  cd ../..
  cp mobile/android/app/build/outputs/apk/release/app-release.apk dist/opentodo-release.apk
  echo "  dist/opentodo-release.apk ($(wc -c < dist/opentodo-release.apk) bytes)"
else
  cd mobile/android
  ./gradlew --no-daemon :app:assembleDebug
  cd ../..
  cp mobile/android/app/build/outputs/apk/debug/app-debug.apk dist/opentodo-debug.apk
  echo "  dist/opentodo-debug.apk ($(wc -c < dist/opentodo-debug.apk) bytes)"
fi