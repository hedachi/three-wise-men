# 東方の三賢者 (Three Wise Men) - Chrome Extension

## インストール方法

1. Chrome で `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」をON
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このフォルダを選択

## 使い方

### 通常の使用方法
1. 拡張機能のアイコンをクリック
2. 質問を入力
3. 「3つのAIに送信」ボタンをクリック（または Ctrl+Enter）
4. ChatGPT、Claude、Grok が新しいタブで開く
5. 各サイトにテキストが自動入力される

### キーボードショートカット
- `Command + Shift + Y` (Mac) / `Ctrl + Shift + Y` (Windows): ポップアップを開く

### Raycast統合 (Mac限定)
Raycastから直接質問を送信できます：

1. **セットアップ**
   - `raycast-scripts/` フォルダ内のスクリプトをRaycastにインポート
   - 詳細は `raycast-scripts/README.md` を参照

2. **使い方**
   - Raycastを開く（`Command + Space`）
   - "Ask Three Wise Men" と入力
   - 質問を入力してEnter

### URL経由でのアクセス
```
chrome-extension://[EXTENSION_ID]/launcher.html?q=質問内容
```

## デバッグ方法

### エラーが発生した場合

1. **拡張機能のエラー確認**
   - `chrome://extensions/` で「東方の三賢者」を探す
   - 「エラー」ボタンがあればクリック

2. **Service Worker のログ確認**
   - `chrome://extensions/` で「Service Worker」の「検証」をクリック
   - Console タブでログを確認

3. **各サイトでのログ確認**
   - AIサイトを開いて F12
   - Console タブで以下を確認：
     - "Three Wise Men content script loaded" メッセージ
     - "Received message" メッセージ
     - エラーメッセージ

## トラブルシューティング

- **タブが1つしか開かない場合**: 拡張機能を再読み込み
- **テキストが入力されない場合**: 各サイトのConsoleログを確認
- **何も動作しない場合**: Service Workerのログを確認

## ファイル構成

- `manifest.json` - 拡張機能の設定
- `background.js` - バックグラウンド処理（タブ操作）
- `popup.html/js` - ポップアップUI
- `content.js` - 各サイトでのテキスト入力
- `styles.css` - ポップアップのスタイル