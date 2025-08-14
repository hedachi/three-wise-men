// Store conversation URLs temporarily
const conversationUrls = new Map();

// Native Messaging connection
let nativePort = null;

// Connect to Native Messaging host
function connectToNativeHost() {
  try {
    // Check if chrome.runtime.lastError exists before connecting
    if (chrome.runtime.lastError) {
      console.log('Previous error cleared:', chrome.runtime.lastError.message);
    }
    
    nativePort = chrome.runtime.connectNative('com.threewisemen.slack');
    
    nativePort.onMessage.addListener((message) => {
      console.log('Received from native host:', message);
      
      if (message.type === 'question') {
        // Handle question from Slack
        handleSlackQuestion(message);
      } else if (message.type === 'connected') {
        console.log('Slack host connected:', message.message);
      } else if (message.type === 'error') {
        console.error('Slack host error:', message.message);
      }
    });
    
    nativePort.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        console.log('Native host not found or disconnected:', chrome.runtime.lastError.message);
      } else {
        console.log('Native host disconnected');
      }
      nativePort = null;
      // Don't automatically reconnect - it will spam the console
      // User needs to install the native host first
    });
    
    // Send initial ping
    nativePort.postMessage({ type: 'ready' });
    
  } catch (error) {
    console.log('Native messaging host not installed. Slack integration disabled.');
    console.log('To enable Slack integration, follow the setup instructions in slack-host/README.md');
    nativePort = null;
  }
}

// Handle question from Slack
async function handleSlackQuestion(message) {
  const { text, user, channel, timestamp } = message;
  console.log(`Slack question from ${user}: ${text}`);
  
  // Save to history
  const result = await chrome.storage.local.get(['history']);
  let history = result.history || [];
  
  const historyEntry = {
    text: text,
    timestamp: Date.parse(timestamp),
    source: 'slack',
    user: user,
    channel: channel,
    urls: {}
  };
  
  history.unshift(historyEntry);
  history = history.slice(0, 50);
  await chrome.storage.local.set({ history });
  
  // Clear conversation URLs and set new question
  conversationUrls.clear();
  conversationUrls.set('question', text);
  conversationUrls.set('timestamp', Date.parse(timestamp));
  
  // Open tabs and fill text
  await openTabsAndFillText(text);
  
  // Send confirmation back to Slack
  if (nativePort) {
    nativePort.postMessage({
      type: 'response',
      message: 'Question sent to AI services'
    });
  }
}

// Initialize Native Messaging connection on startup
connectToNativeHost();

// Reconnect on extension startup/update
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started, reconnecting to native host...');
  connectToNativeHost();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated, connecting to native host...');
  connectToNativeHost();
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === 'checkSlackStatus') {
    // Return Slack connection status
    sendResponse({ connected: nativePort !== null });
    return true;
  } else if (request.action === 'reconnectSlack') {
    // Manual reconnect request from popup
    console.log('Manual reconnect requested');
    connectToNativeHost();
    setTimeout(() => {
      sendResponse({ connected: nativePort !== null });
    }, 500);
    return true;
  } else if (request.action === 'openAndFill') {
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
  
  history = history.slice(0, 50);
  
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
        // Just send the message
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
      }
    });
  }
}