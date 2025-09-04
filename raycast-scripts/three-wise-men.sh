#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Ask Three Wise Men
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🔮
# @raycast.argument1 { "type": "text", "placeholder": "Your question", "percentEncoded": true }
# @raycast.packageName Three Wise Men
# @raycast.description Send a question to ChatGPT, Claude, and Grok simultaneously

# Documentation:
# @raycast.description Ask all three AI assistants at once
# @raycast.author hedachi
# @raycast.authorURL https://github.com/hedachi

# Get the extension ID (You need to update this with your actual extension ID)
# You can find this in Chrome at chrome://extensions/ when Developer mode is enabled
EXTENSION_ID="YOUR_EXTENSION_ID_HERE"

# URL encode the question
QUESTION="$1"

# Open Chrome with the launcher page
# Using a special URL that the extension can intercept
osascript -e "
tell application \"Google Chrome\"
    activate
    open location \"chrome-extension://${EXTENSION_ID}/launcher.html?q=${QUESTION}\"
end tell
"

echo "Question sent to Three Wise Men!"