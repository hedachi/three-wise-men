console.log('AI Multi-Sender content script loaded on:', window.location.hostname);

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  if (request.action === 'fillText') {
    const result = fillTextIntoInput(request.text);
    sendResponse({ success: result });
  }
  return true;
});

function fillTextIntoInput(text) {
  const hostname = window.location.hostname;
  console.log('Attempting to fill text on:', hostname);
  
  // Wait for page to be ready
  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => fillTextIntoInput(text));
    return false;
  }
  
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
  // ChatGPT specific filling
  const selectors = [
    '#prompt-textarea',
    'textarea[placeholder*="Message"]',
    'textarea[data-id="prompt-textarea"]',
    'textarea[id="prompt-textarea"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      element.focus();
      element.value = text;
      
      // Trigger React events
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      nativeInputValueSetter.call(element, text);
      
      const event = new Event('input', { bubbles: true });
      element.dispatchEvent(event);
      
      console.log('ChatGPT: Text filled successfully');
      return true;
    }
  }
  
  console.log('ChatGPT: Could not find input element');
  return false;
}

function fillClaude(text) {
  // Claude specific filling
  const selectors = [
    'div.ProseMirror',
    'div[contenteditable="true"]',
    'div[role="textbox"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
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
      
      console.log('Claude: Text filled successfully');
      return true;
    }
  }
  
  console.log('Claude: Could not find input element');
  return false;
}

function fillGrok(text) {
  // Grok specific filling
  const selectors = [
    'textarea',
    'input[type="text"]',
    'div[contenteditable="true"]',
    'div[role="textbox"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
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
      
      console.log('Grok: Text filled successfully');
      return true;
    }
  }
  
  console.log('Grok: Could not find input element');
  return false;
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
    }, 2000); // Wait 2 seconds for page to fully load
  }
});