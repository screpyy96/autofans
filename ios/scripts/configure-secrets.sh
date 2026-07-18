#!/bin/sh
# Generates the ignored local Xcode configuration from the web development config.
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
ENV_FILE="$ROOT_DIR/.env.local"
OUTPUT_FILE="$ROOT_DIR/ios/Config/Secrets.xcconfig"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE. Create it with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY." >&2
  exit 1
fi

read_env() {
  sed -n "s/^$1=//p" "$ENV_FILE" | tail -n 1 | sed 's/^"//; s/"$//'
}

# XCConfig treats // as a comment. The empty build-setting reference keeps
# URL values intact after Xcode expands the configuration.
escape_xcconfig() {
  printf '%s' "$1" | sed 's#//#/$()/#g'
}

SUPABASE_URL=$(read_env VITE_SUPABASE_URL)
SUPABASE_ANON_KEY=$(read_env VITE_SUPABASE_ANON_KEY)
APP_URL=$(read_env APP_URL)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "Missing required Supabase values in $ENV_FILE." >&2
  exit 1
fi

if [ -z "$APP_URL" ]; then
  APP_URL="https://www.autofans.ro"
fi

umask 077
{
  printf '%s\n' '// Generated locally by ios/scripts/configure-secrets.sh. Do not commit.'
  printf 'SUPABASE_URL = %s\n' "$(escape_xcconfig "$SUPABASE_URL")"
  printf 'SUPABASE_ANON_KEY = %s\n' "$SUPABASE_ANON_KEY"
  printf 'APP_URL = %s\n' "$(escape_xcconfig "$APP_URL")"
} > "$OUTPUT_FILE"

echo "Configured $OUTPUT_FILE"
