document.addEventListener('DOMContentLoaded', async () => {
  const questionInput = document.getElementById('questionInput');
  const sendButton = document.getElementById('sendButton');
  const historyList = document.getElementById('historyList');

  // Load and display history
  await loadHistory();

  // Send button click handler
  sendButton.addEventListener('click', async () => {
    const question = questionInput.value.trim();
    if (!question) {
      alert('質問を入力してください');
      return;
    }

    // Save to history
    await saveToHistory(question);
    
    // Send message to background script
    chrome.runtime.sendMessage({
      action: 'openAndFill',
      text: question
    }, (response) => {
      console.log('Message sent to background');
    });

    // Clear input
    questionInput.value = '';
    
    // Reload history
    await loadHistory();
    
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
        
        return `
          <div class="history-item" data-text="${item.text.replace(/"/g, '&quot;')}">
            <div class="history-time">${timeStr}</div>
            ${truncatedText}
          </div>
        `;
      })
      .join('');
  }

  // Save to history
  async function saveToHistory(text) {
    const result = await chrome.storage.local.get(['history']);
    let history = result.history || [];
    
    history.unshift({
      text: text,
      timestamp: Date.now()
    });
    
    history = history.slice(0, 50);
    
    await chrome.storage.local.set({ history });
  }

  // Enable Enter key to send
  questionInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      sendButton.click();
    }
  });
});