// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openAndFill') {
    openTabsAndFillText(request.text);
    sendResponse({ success: true });
  }
  return true;
});

async function openTabsAndFillText(text) {
  console.log('Opening tabs with text:', text);
  
  const urls = [
    'https://chatgpt.com/',
    'https://claude.ai/new',
    'https://grok.com/'
  ];
  
  // Store the text to be filled
  await chrome.storage.local.set({ pendingText: text });
  
  // Open all tabs
  for (let i = 0; i < urls.length; i++) {
    const tab = await chrome.tabs.create({
      url: urls[i],
      active: i === 0 // Only first tab is active
    });
    
    console.log('Created tab:', tab.id, urls[i]);
    
    // Wait for tab to complete loading
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        
        // Inject content script and send message
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }, () => {
          // Wait a bit for content script to load
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, {
              action: 'fillText',
              text: text
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.log('Error:', chrome.runtime.lastError.message);
              } else {
                console.log('Text sent to tab:', tab.id);
              }
            });
          }, 1000);
        });
      }
    });
  }
}