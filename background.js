// Store conversation URLs temporarily
const conversationUrls = new Map();

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === 'openAndFill' || request.action === 'openTabsFromLauncher') {
    // Clear previous conversation URLs for new question
    conversationUrls.clear();
    conversationUrls.set('question', request.text);
    const timestamp = Date.now();
    conversationUrls.set('timestamp', timestamp);
    
    // Save the initial history entry here instead of in popup.js
    saveInitialHistory(request.text, timestamp).then(() => {
      openTabsAndFillText(request.text);
      sendResponse({ success: true });
    });
    return true; // Keep the message channel open for async response
  } else if (request.action === 'saveConversationUrl') {
    // Save conversation URL from content script
    handleConversationUrl(request);
    sendResponse({ success: true });
  }
  return true;
});

async function saveInitialHistory(text, timestamp) {
  const result = await chrome.storage.local.get(['history']);
  let history = result.history || [];
  
  history.unshift({
    text: text,
    timestamp: timestamp,
    urls: {} // Initialize with empty URLs object
  });
  
  history = history.slice(0, 500);
  
  await chrome.storage.local.set({ history });
  console.log('Saved initial history entry with timestamp:', timestamp);
}

async function handleConversationUrl(data) {
  const { service, url, question } = data;
  console.log(`Received ${service} URL:`, url);
  console.log(`For question:`, question);
  
  // Store the URL for this service
  conversationUrls.set(service, url);
  
  // Update history immediately for each URL received
  await updateHistoryWithUrl(service, url, question);
}

async function updateHistoryWithUrl(service, url, question) {
  const result = await chrome.storage.local.get(['history']);
  let history = result.history || [];
  
  console.log('Updating history with URL...');
  console.log('Looking for question:', question);
  console.log('Service:', service, 'URL:', url);
  
  // Find the most recent entry with matching question (should be the first one)
  const timestamp = conversationUrls.get('timestamp');
  
  // First try exact timestamp match (most reliable)
  let historyIndex = history.findIndex(item => item.timestamp === timestamp);
  
  // If not found, try matching by question text within time window
  if (historyIndex === -1) {
    historyIndex = history.findIndex(item => {
      const matches = item.text === question && 
        Math.abs(item.timestamp - timestamp) < 60000; // Within 60 seconds
      if (item.text === question) {
        console.log(`Question match found, timestamp diff: ${Math.abs(item.timestamp - timestamp)}ms`);
      }
      return matches;
    });
  }
  
  console.log(`History index found: ${historyIndex}`);
  
  if (historyIndex !== -1) {
    // Initialize urls object if it doesn't exist
    if (!history[historyIndex].urls) {
      history[historyIndex].urls = {};
    }
    
    // Update URL for this specific service
    history[historyIndex].urls[service] = url;
    
    console.log(`✅ Updated history item with ${service} URL:`, history[historyIndex]);
    
    await chrome.storage.local.set({ history });
    console.log('Saved updated history to storage');
  } else {
    console.log('❌ Could not find matching history entry');
    console.log('Stored timestamp:', timestamp);
    console.log('History timestamps:', history.slice(0, 3).map(h => h.timestamp));
  }
}

async function openTabsAndFillText(text) {
  console.log('Opening tabs with text:', text);
  
  const urls = [
    'https://chatgpt.com/',
    'https://claude.ai/new',
    'https://grok.com/'
  ];
  
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
        
        // Content script is already injected via manifest.json
        // Just send the message after a short delay
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
        }, 2000); // Wait 2 seconds for content script to be ready
      }
    });
  }
}