#!/bin/bash

# Update version in manifest.json with current datetime
# Format: 1.YYYY.MMDD.HHMM (Chrome requires each part to be 0-65536)
YEAR=$(date +"%Y")
MONTHDAY=$(date +"%-m%d")  # %-m removes leading zero from month
HOURMIN=$(date +"%H%M")
VERSION="1.$YEAR.$MONTHDAY.$HOURMIN"

# Update manifest.json
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" manifest.json
else
    # Linux
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" manifest.json
fi

echo "Updated version to $VERSION"
echo "Remember to reload the extension in chrome://extensions/"