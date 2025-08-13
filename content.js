console.log('AI Multi-Sender content script loaded on:', window.location.hostname);

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  if (request.action === 'fillText') {
    setTimeout(() => {
      const result = fillTextIntoInput(request.text);
      sendResponse({ success: result });
    }, 1000); // Wait 1 second for page elements to load
  }
  return true;
});

function fillTextIntoInput(text) {
  const hostname = window.location.hostname;
  console.log('Attempting to fill text on:', hostname);
  
  let success = false;
  
  if (hostname.includes('chatgpt.com')) {
    success = fillChatGPT(text);
  } else if (hostname.includes('claude.ai')) {
    success = fillClaude(text);
  } else if (hostname.includes('grok.com')) {
    success = fillGrok(text);
  }
  
  return success;
}

function fillChatGPT(text) {
  console.log('Trying to fill ChatGPT...');
  
  // Wait and retry approach for ChatGPT
  let attempts = 0;
  const maxAttempts = 10;
  
  const tryFill = setInterval(() => {
    attempts++;
    console.log(`ChatGPT attempt ${attempts}`);
    
    try {
      // Updated selectors for ChatGPT
      const selectors = [
        'textarea#prompt-textarea',
        'textarea[placeholder*="Message"]',
        'textarea[data-id="prompt-textarea"]',
        'div[id="prompt-textarea"]',
        'textarea.m-0',
        'textarea[rows]'
      ];
      
      for (let i = 0; i < selectors.length; i++) {
        const selector = selectors[i];
        const element = document.querySelector(selector);
        if (element) {
          console.log(`Found ChatGPT input with selector: ${selector}`);
          clearInterval(tryFill);
          
          // Focus and click
          element.focus();
          element.click();
          
          // For textarea elements
          if (element.tagName === 'TEXTAREA') {
            // Set value directly
            element.value = text;
            
            // Trigger React's onChange - wrapped in try-catch
            try {
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
              if (nativeInputValueSetter) {
                nativeInputValueSetter.call(element, text);
              }
            } catch (e) {
              console.log('Could not use native setter, using fallback');
            }
            
            // Dispatch events
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            // For contenteditable divs
            element.textContent = text;
            element.dispatchEvent(new InputEvent('input', {
              bubbles: true,
              cancelable: true,
              inputType: 'insertText',
              data: text
            }));
          }
          
          // Auto-send after a short delay
          setTimeout(() => {
            clickSendButton('chatgpt');
          }, 500);
          
          console.log('ChatGPT: Text filled successfully');
          return true;
        }
      }
    } catch (error) {
      console.error('Error in ChatGPT fill attempt:', error);
    }
    
    if (attempts >= maxAttempts) {
      clearInterval(tryFill);
      console.log('ChatGPT: Could not find input element after', maxAttempts, 'attempts');
      return false;
    }
  }, 500);
  
  return true; // Return true since we're handling async
}

function fillClaude(text) {
  console.log('Trying to fill Claude...');
  
  // Claude specific filling
  const selectors = [
    'div.ProseMirror',
    'div[contenteditable="true"]',
    'div[role="textbox"]'
  ];
  
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i];
    const element = document.querySelector(selector);
    if (element) {
      console.log(`Found Claude input with selector: ${selector}`);
      
      element.focus();
      element.click();
      
      // Clear existing content
      element.innerHTML = '';
      
      // Create paragraph with text
      const p = document.createElement('p');
      p.textContent = text;
      element.appendChild(p);
      
      // Trigger input event
      const event = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text
      });
      element.dispatchEvent(event);
      
      // Auto-send after a short delay
      setTimeout(() => {
        clickSendButton('claude');
      }, 500);
      
      console.log('Claude: Text filled successfully');
      return true;
    }
  }
  
  console.log('Claude: Could not find input element');
  return false;
}

function fillGrok(text) {
  console.log('Trying to fill Grok...');
  
  // Grok specific filling
  const selectors = [
    'textarea',
    'input[type="text"]',
    'div[contenteditable="true"]',
    'div[role="textbox"]'
  ];
  
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i];
    const element = document.querySelector(selector);
    if (element) {
      console.log(`Found Grok input with selector: ${selector}`);
      
      element.focus();
      
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        element.value = text;
        const event = new Event('input', { bubbles: true });
        element.dispatchEvent(event);
      } else {
        element.textContent = text;
        const event = new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: text
        });
        element.dispatchEvent(event);
      }
      
      // Auto-send after a short delay
      setTimeout(() => {
        clickSendButton('grok');
      }, 500);
      
      console.log('Grok: Text filled successfully');
      return true;
    }
  }
  
  console.log('Grok: Could not find input element');
  return false;
}

function clickSendButton(service) {
  console.log(`Trying to click send button for ${service}...`);
  
  let sendButton = null;
  
  if (service === 'chatgpt') {
    // ChatGPT send button selectors
    const selectors = [
      'button[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button svg[width="32"][height="32"]', // The send icon button
      'button.rounded-xl.bg-black',
      'button[disabled]:has(svg)',
      'button:has(svg[width="32"])'
    ];
    
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      sendButton = document.querySelector(selector);
      if (sendButton && !sendButton.disabled) {
        console.log(`Found ChatGPT send button with selector: ${selector}`);
        break;
      }
    }
  } else if (service === 'claude') {
    // Claude send button selectors
    const selectors = [
      'button[aria-label*="Send"]',
      'button[aria-label*="send"]',
      'button:has(svg):last-of-type',
      'button[type="submit"]',
      'button.bg-black'
    ];
    
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      sendButton = document.querySelector(selector);
      if (sendButton) {
        console.log(`Found Claude send button with selector: ${selector}`);
        break;
      }
    }
  } else if (service === 'grok') {
    // Grok send button selectors
    const selectors = [
      'button[aria-label*="Send"]',
      'button[aria-label*="send"]',
      'button:has(svg)',
      'button[type="submit"]',
      'button.send-button'
    ];
    
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      sendButton = document.querySelector(selector);
      if (sendButton) {
        console.log(`Found Grok send button with selector: ${selector}`);
        break;
      }
    }
  }
  
  if (sendButton) {
    console.log(`Clicking send button for ${service}`);
    sendButton.click();
    return true;
  } else {
    console.log(`Could not find send button for ${service}`);
    // Try pressing Enter as fallback
    const activeElement = document.activeElement;
    if (activeElement) {
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      });
      activeElement.dispatchEvent(enterEvent);
      console.log(`Tried pressing Enter for ${service}`);
    }
    return false;
  }
}

// Check for pending text on page load
window.addEventListener('load', async () => {
  const result = await chrome.storage.local.get(['pendingText']);
  if (result.pendingText) {
    console.log('Found pending text, attempting to fill');
    setTimeout(() => {
      fillTextIntoInput(result.pendingText);
      // Clear pending text
      chrome.storage.local.remove(['pendingText']);
    }, 3000); // Wait 3 seconds for page to fully load
  }
});