// Wrap in IIFE to prevent duplicate initialization
(function() {
  // Prevent duplicate initialization
  if (typeof window.threeWiseMenInitialized !== 'undefined') {
    console.log('Three Wise Men content script already initialized, skipping...');
    return;
  }
  
  window.threeWiseMenInitialized = true;
  console.log('Three Wise Men content script loaded on:', window.location.hostname);

  // Track the question text and monitor URL changes
  let currentQuestion = null;
  let urlCheckInterval = null;

  // Listen for messages
  chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    console.log('Received message:', request);
    if (request.action === 'fillText') {
      currentQuestion = request.text;
      setTimeout(() => {
        const result = fillTextIntoInput(request.text);
        sendResponse({ success: result });
        // Start monitoring URL changes after sending
        startUrlMonitoring();
      }, 1000); // Wait 1 second for page elements to load
    }
    return true;
  });

  // Monitor URL changes to capture conversation permalinks
  function startUrlMonitoring() {
    const hostname = window.location.hostname;
    let lastUrl = window.location.href;
    let attemptCount = 0;
    const maxAttempts = 60; // Monitor for up to 30 seconds
    
    console.log(`Starting URL monitoring on ${hostname}, initial URL: ${lastUrl}`);
    
    urlCheckInterval = setInterval(() => {
      attemptCount++;
      const currentUrl = window.location.href;
      
      // Log every 10 attempts
      if (attemptCount % 10 === 0) {
        console.log(`URL check #${attemptCount}: ${currentUrl}`);
      }
      
      // Check if URL has changed to include conversation ID
      if (currentUrl !== lastUrl) {
        console.log(`URL changed from: ${lastUrl}`);
        console.log(`URL changed to: ${currentUrl}`);
        lastUrl = currentUrl;
        
        let conversationUrl = null;
        let service = null;
        
        if (hostname.includes('chatgpt.com') && currentUrl.includes('/c/')) {
          conversationUrl = currentUrl;
          service = 'chatgpt';
        } else if (hostname.includes('claude.ai') && currentUrl.includes('/chat/')) {
          conversationUrl = currentUrl;
          service = 'claude';
        } else if (hostname.includes('grok.com')) {
          // Grok might have different URL patterns
          if (currentUrl !== 'https://grok.com/' && currentUrl.length > 'https://grok.com/'.length) {
            conversationUrl = currentUrl;
            service = 'grok';
          }
        }
        
        if (conversationUrl && currentQuestion) {
          console.log(`✅ Captured ${service} conversation URL:`, conversationUrl);
          console.log(`For question:`, currentQuestion);
          
          // Send the URL to background script
          chrome.runtime.sendMessage({
            action: 'saveConversationUrl',
            service: service,
            url: conversationUrl,
            question: currentQuestion
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error sending message:', chrome.runtime.lastError);
            } else {
              console.log('URL sent to background script successfully');
            }
          });
          
          clearInterval(urlCheckInterval);
        } else {
          console.log('URL changed but not a conversation URL or question missing');
          console.log('conversationUrl:', conversationUrl, 'currentQuestion:', currentQuestion);
        }
      }
      
      // Stop monitoring after max attempts
      if (attemptCount >= maxAttempts) {
        console.log('⏱️ Stopped monitoring URL changes after 30 seconds');
        clearInterval(urlCheckInterval);
      }
    }, 500);
  }

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
    
    let attempts = 0;
    const maxAttempts = 10;
    
    const tryFill = setInterval(() => {
      attempts++;
      console.log(`Claude attempt ${attempts}`);
      
      try {
        // Improved selectors for Claude
        const selectors = [
          'div.ProseMirror',
          'div[contenteditable="true"]',
          'div[role="textbox"]',
          'div[data-placeholder]'
        ];
        
        for (let i = 0; i < selectors.length; i++) {
          const selector = selectors[i];
          const element = document.querySelector(selector);
          if (element && element.isContentEditable) {
            console.log(`Found Claude input with selector: ${selector}`);
            clearInterval(tryFill);
            
            // Focus and click
            element.focus();
            element.click();
            
            // Clear existing content
            element.innerHTML = '';
            
            // Set text content
            element.textContent = text;
            
            // Dispatch input event for contenteditable
            element.dispatchEvent(new InputEvent('input', {
              bubbles: true,
              cancelable: true,
              inputType: 'insertText',
              data: text
            }));
            
            // Auto-send after a short delay
            setTimeout(() => {
              clickSendButton('claude');
            }, 500);
            
            console.log('Claude: Text filled successfully');
            return true;
          }
        }
      } catch (error) {
        console.error('Error in Claude fill attempt:', error);
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(tryFill);
        console.log('Claude: Could not find input element after', maxAttempts, 'attempts');
        return false;
      }
    }, 500);
    
    return true;
  }

  function fillGrok(text) {
    console.log('Trying to fill Grok...');
    
    let attempts = 0;
    const maxAttempts = 10;
    
    const tryFill = setInterval(() => {
      attempts++;
      console.log(`Grok attempt ${attempts}`);
      
      try {
        // Selectors for Grok
        const selectors = [
          'textarea:not([aria-label*="Search"])',
          'div[contenteditable="true"]:not([aria-label*="Search"])',
          'textarea[placeholder*="message" i]',
          'textarea[placeholder*="ask" i]',
          'div[role="textbox"]:not([aria-label*="Search"])'
        ];
        
        for (let i = 0; i < selectors.length; i++) {
          const selector = selectors[i];
          const element = document.querySelector(selector);
          if (element) {
            console.log(`Found Grok input with selector: ${selector}`);
            clearInterval(tryFill);
            
            // Focus and click
            element.focus();
            element.click();
            
            if (element.tagName === 'TEXTAREA') {
              // Set value for textarea
              element.value = text;
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
              // Set text for contenteditable
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
              clickSendButton('grok');
            }, 500);
            
            console.log('Grok: Text filled successfully');
            return true;
          }
        }
      } catch (error) {
        console.error('Error in Grok fill attempt:', error);
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(tryFill);
        console.log('Grok: Could not find input element after', maxAttempts, 'attempts');
        return false;
      }
    }, 500);
    
    return true;
  }

  function clickSendButton(service) {
    console.log(`Clicking send button for ${service}...`);
    
    const selectors = {
      chatgpt: [
        'button[data-testid="send-button"]',
        'button[aria-label*="Send" i]',
        'button svg.icon-2xl',
        'button:has(svg)',
        'button.absolute.p-1'
      ],
      claude: [
        'button[aria-label*="Send" i]',
        'button[type="submit"]',
        'button:has(svg)',
        'button.bg-black',
        'button.absolute'
      ],
      grok: [
        'button[aria-label*="Send" i]',
        'button[type="submit"]',
        'button svg',
        'button:has(svg)',
        'button.absolute'
      ]
    };
    
    const serviceSelectors = selectors[service] || [];
    
    for (let i = 0; i < serviceSelectors.length; i++) {
      const selector = serviceSelectors[i];
      try {
        const button = document.querySelector(selector);
        if (button && !button.disabled) {
          console.log(`Found ${service} send button with selector: ${selector}`);
          button.click();
          
          // Try to clear the input field after sending (for ChatGPT specifically)
          if (service === 'chatgpt') {
            setTimeout(() => {
              const inputSelectors = [
                'textarea#prompt-textarea',
                'textarea[placeholder*="Message"]',
                'textarea.m-0'
              ];
              
              for (let j = 0; j < inputSelectors.length; j++) {
                const inputSelector = inputSelectors[j];
                const input = document.querySelector(inputSelector);
                if (input) {
                  input.value = '';
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                  console.log('Cleared ChatGPT input field');
                  break;
                }
              }
            }, 100);
          }
          
          return true;
        }
      } catch (error) {
        console.error(`Error finding button with selector ${selector}:`, error);
      }
    }
    
    // Fallback: Press Enter key
    console.log(`Could not find send button for ${service}, trying Enter key...`);
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

})(); // End of IIFE