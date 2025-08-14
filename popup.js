document.addEventListener('DOMContentLoaded', async () => {
  const questionInput = document.getElementById('questionInput');
  const sendButton = document.getElementById('sendButton');
  const historyList = document.getElementById('historyList');

  // Display version
  const manifest = chrome.runtime.getManifest();
  document.getElementById('version').textContent = `v${manifest.version}`;

  // Load and display history
  await loadHistory();
  
  // Listen for storage changes to update history when URLs are added
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.history) {
      console.log('History changed, reloading...');
      loadHistory();
    }
  });

  // Send button click handler
  sendButton.addEventListener('click', async () => {
    const question = questionInput.value.trim();
    if (!question) {
      alert('質問を入力してください');
      return;
    }
    
    // Send message to background script (history is now saved there)
    chrome.runtime.sendMessage({
      action: 'openAndFill',
      text: question
    }, (response) => {
      console.log('Message sent to background');
    });

    // Clear input
    questionInput.value = '';
    
    // Close popup after a moment
    setTimeout(() => {
      window.close();
    }, 500);
  });

  // History item click handler
  historyList.addEventListener('click', (e) => {
    if (e.target.classList.contains('history-item')) {
      questionInput.value = e.target.dataset.text;
    }
  });

  // Load history from storage
  async function loadHistory() {
    const result = await chrome.storage.local.get(['history']);
    const history = result.history || [];
    
    console.log('Loading history, items:', history.length);
    if (history.length > 0) {
      console.log('First history item:', history[0]);
    }
    
    if (history.length === 0) {
      historyList.innerHTML = '<div class="empty-history">履歴はありません</div>';
      return;
    }

    historyList.innerHTML = history
      .slice(0, 10)
      .map(item => {
        const date = new Date(item.timestamp);
        const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        const truncatedText = item.text.length > 50 
          ? item.text.substring(0, 50) + '...' 
          : item.text;
        
        // Debug log for URLs
        console.log(`History item for "${truncatedText}":`, item.urls);
        
        // Create AI link buttons if URLs exist
        let aiButtons = '';
        if (item.urls) {
          console.log('Creating buttons for URLs:', item.urls);
          aiButtons = '<div class="ai-buttons">';
          if (item.urls.chatgpt) {
            aiButtons += `<button class="ai-link-btn chatgpt-btn" data-url="${item.urls.chatgpt}" title="ChatGPTの回答を見る">ChatGPT</button>`;
          }
          if (item.urls.claude) {
            aiButtons += `<button class="ai-link-btn claude-btn" data-url="${item.urls.claude}" title="Claudeの回答を見る">Claude</button>`;
          }
          if (item.urls.grok) {
            aiButtons += `<button class="ai-link-btn grok-btn" data-url="${item.urls.grok}" title="Grokの回答を見る">Grok</button>`;
          }
          aiButtons += '</div>';
        } else {
          console.log('No URLs found for this history item');
        }
        
        return `
          <div class="history-item-container">
            <div class="history-item" data-text="${item.text.replace(/"/g, '&quot;')}">
              <div class="history-time">${timeStr}</div>
              ${truncatedText}
            </div>
            ${aiButtons}
          </div>
        `;
      })
      .join('');
      
    // Add click handlers for AI link buttons
    document.querySelectorAll('.ai-link-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = e.target.dataset.url;
        if (url) {
          chrome.tabs.create({ url: url });
        }
      });
    });
  }

  // Enable Enter key to send
  questionInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      sendButton.click();
    }
  });
});