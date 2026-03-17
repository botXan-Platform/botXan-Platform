#!/bin/bash
set -euo pipefail

ZIP="repo-clean.zip"
MANIFEST="REPO_MANIFEST.txt"
TREE="REPO_TREE.txt"

echo "➡️ Köhnə export faylları silinir..."
rm -f "$ZIP" "$MANIFEST" "$TREE"

echo "➡️ Kiçik ZIP yaradılır..."
zip -r "$ZIP" . \
  -x "*/node_modules/*" \
  -x "*/.next/*" \
  -x "*/dist/*" \
  -x "*/build/*" \
  -x "*/coverage/*" \
  -x "*/.git/*" \
  -x "*/.turbo/*" \
  -x "*/.cache/*" \
  -x "*/__MACOSX/*" \
  -x "*/uploads/*" \
  -x "*/.wa-mock/*" \
  -x ".env" \
  -x ".env.*" \
  -x "*/.env" \
  -x "*/.env.*" \
  -x "*.pem" \
  -x "*.key" \
  -x "*.p12" \
  -x "*.pfx" \
  -x "*.crt" \
  -x "*.cer" \
  -x "*.der" \
  -x "*.jks" \
  -x "*.keystore" \
  -x "*/.aws/*" \
  -x "*/.gcp/*" \
  -x "*/.ssh/*" \
  -x "*/.npmrc" \
  -x "*/.netrc" \
  -x "*service-account*.json" \
  -x "*service_account*.json" \
  -x "*firebase*adminsdk*.json" \
  -x "*private_key*.json" \
  -x "*GoogleService-Info.plist" \
  -x "*google-services.json" \
  -x "*.bak" \
  -x "*.tmp" \
  -x "*.log" \
  -x "*.DS_Store" \
  -x "$ZIP" \
  -x "$MANIFEST" \
  -x "$TREE" \
  -x "export.sh"

echo "➡️ Fayl siyahısı (manifest) yaradılır..."
find . \
  \( -path "*/node_modules/*" \
  -o -path "*/.next/*" \
  -o -path "*/dist/*" \
  -o -path "*/build/*" \
  -o -path "*/coverage/*" \
  -o -path "*/.git/*" \
  -o -path "*/.turbo/*" \
  -o -path "*/.cache/*" \
  -o -path "*/__MACOSX/*" \
  -o -path "*/uploads/*" \
  -o -path "*/.wa-mock/*" \
  -o -path "*/.aws/*" \
  -o -path "*/.gcp/*" \
  -o -path "*/.ssh/*" \) -prune \
  -o -type f \
  ! -name ".env" \
  ! -name ".env.*" \
  ! -name "*.pem" \
  ! -name "*.key" \
  ! -name "*.p12" \
  ! -name "*.pfx" \
  ! -name "*.crt" \
  ! -name "*.cer" \
  ! -name "*.der" \
  ! -name "*.jks" \
  ! -name "*.keystore" \
  ! -name ".npmrc" \
  ! -name ".netrc" \
  ! -name "*service-account*.json" \
  ! -name "*service_account*.json" \
  ! -name "*firebase*adminsdk*.json" \
  ! -name "*private_key*.json" \
  ! -name "*GoogleService-Info.plist" \
  ! -name "*google-services.json" \
  ! -name "*.bak" \
  ! -name "*.tmp" \
  ! -name "*.log" \
  ! -name ".DS_Store" \
  ! -name "$ZIP" \
  ! -name "$MANIFEST" \
  ! -name "$TREE" \
  ! -name "export.sh" \
  -print | sed 's|^\./||' > "$MANIFEST"

echo "➡️ Repo struktur ağacı (tree) yaradılır..."
find . \
  \( -path "*/node_modules/*" \
  -o -path "*/.next/*" \
  -o -path "*/dist/*" \
  -o -path "*/build/*" \
  -o -path "*/coverage/*" \
  -o -path "*/.git/*" \
  -o -path "*/.turbo/*" \
  -o -path "*/.cache/*" \
  -o -path "*/__MACOSX/*" \
  -o -path "*/uploads/*" \
  -o -path "*/.wa-mock/*" \
  -o -path "*/.aws/*" \
  -o -path "*/.gcp/*" \
  -o -path "*/.ssh/*" \) -prune \
  -o \
  ! -name ".env" \
  ! -name ".env.*" \
  ! -name "*.pem" \
  ! -name "*.key" \
  ! -name "*.p12" \
  ! -name "*.pfx" \
  ! -name "*.crt" \
  ! -name "*.cer" \
  ! -name "*.der" \
  ! -name "*.jks" \
  ! -name "*.keystore" \
  ! -name ".npmrc" \
  ! -name ".netrc" \
  ! -name "*service-account*.json" \
  ! -name "*service_account*.json" \
  ! -name "*firebase*adminsdk*.json" \
  ! -name "*private_key*.json" \
  ! -name "*GoogleService-Info.plist" \
  ! -name "*google-services.json" \
  ! -name "*.bak" \
  ! -name "*.tmp" \
  ! -name "*.log" \
  ! -name ".DS_Store" \
  ! -name "$ZIP" \
  ! -name "$MANIFEST" \
  ! -name "$TREE" \
  ! -name "export.sh" \
  -print | sed 's|^\./||' > "$TREE"

echo "✅ Bitdi!"
echo "📦 ZIP: $ZIP"
echo "📄 Manifest: $MANIFEST"
echo "🌳 Tree: $TREE"
echo "📍 Qovluq: $(pwd)"