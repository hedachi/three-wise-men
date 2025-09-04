// Get query parameter from URL
const urlParams = new URLSearchParams(window.location.search);
const question = urlParams.get('q');

// Display the question
const questionElement = document.getElementById('question');
const statusElement = document.getElementById('status');

if (question) {
    questionElement.textContent = decodeURIComponent(question);
    statusElement.textContent = 'Chrome拡張機能に接続中...';
    
    // Send message to background script
    setTimeout(() => {
        chrome.runtime.sendMessage({
            action: 'openTabsFromLauncher',
            text: decodeURIComponent(question)
        }, (response) => {
            if (chrome.runtime.lastError) {
                statusElement.textContent = 'エラー: ' + chrome.runtime.lastError.message;
            } else {
                statusElement.textContent = '送信完了！各AIタブを確認してください。';
                // Auto close after 3 seconds
                setTimeout(() => {
                    window.close();
                }, 3000);
            }
        });
    }, 500);
} else {
    questionElement.textContent = 'クエリパラメータが指定されていません';
    statusElement.textContent = 'URLに ?q=質問内容 を追加してください';
}