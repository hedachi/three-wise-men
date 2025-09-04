#!/usr/bin/osascript

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Ask Three Wise Men (Shortcut)
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🔮
# @raycast.argument1 { "type": "text", "placeholder": "Your question" }
# @raycast.packageName Three Wise Men
# @raycast.description Send a question to ChatGPT, Claude, and Grok using keyboard shortcut

# Documentation:
# @raycast.description Ask all three AI assistants using the keyboard shortcut method
# @raycast.author hedachi
# @raycast.authorURL https://github.com/hedachi

on run argv
    set theQuestion to item 1 of argv
    
    tell application "Google Chrome"
        activate
        
        -- Create a new tab or window to ensure we're in a Chrome context
        tell window 1
            set newTab to make new tab with properties {URL:"chrome://newtab/"}
        end tell
        
        -- Wait a moment for the tab to load
        delay 0.5
        
        -- Trigger the extension keyboard shortcut (Command+Shift+Y)
        tell application "System Events"
            tell process "Google Chrome"
                keystroke "y" using {command down, shift down}
            end tell
        end tell
        
        -- Wait for popup to appear
        delay 0.5
        
        -- Type the question
        tell application "System Events"
            keystroke theQuestion
            delay 0.1
            -- Press Enter to submit
            keystroke return
        end tell
    end tell
    
    return "Question sent to Three Wise Men!"
end run