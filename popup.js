document.addEventListener('DOMContentLoaded', async () => {
  const questionInput = document.getElementById('questionInput');
  const sendButton = document.getElementById('sendButton');
  const historyList = document.getElementById('historyList');
  const downloadCsvButton = document.getElementById('downloadCsvButton');

  // Display version
  const manifest = chrome.runtime.getManifest();
  document.getElementById('version').textContent = `v${manifest.version}`;

  // Restore saved draft text
  const savedDraft = localStorage.getItem('questionDraft');
  if (savedDraft) {
    questionInput.value = savedDraft;
  }

  // Auto-save draft text on input
  questionInput.addEventListener('input', () => {
    localStorage.setItem('questionDraft', questionInput.value);
  });

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

    // Clear input and draft
    questionInput.value = '';
    localStorage.removeItem('questionDraft');
    
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

  // CSV download handler
  downloadCsvButton.addEventListener('click', async () => {
    const result = await chrome.storage.local.get(['history']);
    const history = result.history || [];
    
    if (history.length === 0) {
      alert('ダウンロードする履歴がありません');
      return;
    }

    const csvData = generateCsv(history);
    downloadCsv(csvData);
  });

  // Generate CSV data
  function generateCsv(history) {
    const headers = ['日時', '質問', 'ChatGPT URL', 'Claude URL', 'Grok URL'];
    const csvRows = [headers.join(',')];

    history.forEach(item => {
      const date = new Date(item.timestamp);
      const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      
      const row = [
        `"${dateStr}"`,
        `"${item.text.replace(/"/g, '""')}"`,
        `"${item.urls?.chatgpt || ''}"`,
        `"${item.urls?.claude || ''}"`,
        `"${item.urls?.grok || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // Download CSV file
  function downloadCsv(csvData) {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `three_wise_men_history_${dateStr}_${timeStr}.csv`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

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