#!/usr/bin/env python3

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Ask Three Wise Men (Python)
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🔮
# @raycast.argument1 { "type": "text", "placeholder": "Your question", "percentEncoded": true }
# @raycast.packageName Three Wise Men
# @raycast.description Send a question to ChatGPT, Claude, and Grok simultaneously

# Documentation:
# @raycast.description Ask all three AI assistants at once using Python
# @raycast.author hedachi
# @raycast.authorURL https://github.com/hedachi

import sys
import subprocess
import urllib.parse
import json
import os

def get_extension_id():
    """
    Try to find the extension ID automatically by looking for the manifest in Chrome's extensions directory
    """
    extensions_path = os.path.expanduser("~/Library/Application Support/Google/Chrome/Default/Extensions")
    
    if not os.path.exists(extensions_path):
        return None
    
    # Look for our extension by checking manifest.json files
    for ext_id in os.listdir(extensions_path):
        ext_path = os.path.join(extensions_path, ext_id)
        if os.path.isdir(ext_path):
            # Check latest version directory
            versions = os.listdir(ext_path)
            if versions:
                latest_version = sorted(versions)[-1]
                manifest_path = os.path.join(ext_path, latest_version, "manifest.json")
                if os.path.exists(manifest_path):
                    try:
                        with open(manifest_path, 'r', encoding='utf-8') as f:
                            manifest = json.load(f)
                            if manifest.get('name') == '東方の三賢者':
                                return ext_id
                    except:
                        continue
    return None

def main():
    if len(sys.argv) < 2:
        print("Please provide a question")
        sys.exit(1)
    
    question = sys.argv[1]
    
    # Try to get extension ID automatically
    extension_id = get_extension_id()
    
    if not extension_id:
        # If auto-detection fails, use a placeholder that user needs to update
        extension_id = "YOUR_EXTENSION_ID_HERE"
        print("⚠️  Extension ID not found. Please update the script with your extension ID.")
        print("You can find it at chrome://extensions/ with Developer mode enabled.")
        sys.exit(1)
    
    # URL encode the question (it's already percent encoded from Raycast)
    launcher_url = f"chrome-extension://{extension_id}/launcher.html?q={question}"
    
    # Open Chrome with the launcher page using AppleScript
    applescript = f'''
    tell application "Google Chrome"
        activate
        open location "{launcher_url}"
    end tell
    '''
    
    subprocess.run(['osascript', '-e', applescript])
    print(f"✅ Question sent to Three Wise Men!")

if __name__ == "__main__":
    main()