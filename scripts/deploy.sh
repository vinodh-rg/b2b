#!/bin/bash

# Configuration
VERSION_TYPE=${1:-patch} # major, minor, or patch

echo "🚀 Starting CrossDrop Deployment Pipeline..."

# 1. Run Tests
echo "🧪 Running Tests..."
npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Aborting deployment."
  exit 1
fi
echo "✅ Tests passed."

# 2. Package Extension
echo "📦 Packaging Extension..."
node scripts/pack_extension.js
if [ $? -ne 0 ]; then
  echo "❌ Packaging failed."
  exit 1
fi
echo "✅ Extension packaged."

# 3. Create Deployment Report
echo "📝 Generating Deployment Report..."
echo "Deployment Report - $(date)" > docs/DEPLOYMENT_REPORT.md
echo "------------------------------" >> docs/DEPLOYMENT_REPORT.md
echo "Version Type: $VERSION_TYPE" >> docs/DEPLOYMENT_REPORT.md
echo "Status: Success" >> docs/DEPLOYMENT_REPORT.md
echo "Packaged Size: $(ls -lh crossdrop-extension.zip | awk '{print $5}')" >> docs/DEPLOYMENT_REPORT.md

echo "✅ Deployment Pipeline Complete (Artifacts Ready)."
echo "👉 Next Steps:"
echo "   1. git add ."
echo "   2. git commit -m 'Release output'"
echo "   3. git tag vX.X.X"
echo "   4. git push origin main --tags"
