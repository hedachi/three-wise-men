# コードスタイルと規約

## JavaScript規約
- **変数宣言**: const/let を使用（var不使用）
- **非同期処理**: async/await パターンを使用
- **イベントリスナー**: addEventListener を使用
- **DOM操作**: getElementById, querySelector を使用
- **コメント**: 日本語でのコメントあり
- **命名規則**: 
  - camelCase: 変数名、関数名
  - PascalCase: なし（クラス未使用）

## Chrome Extension固有の規約
- Manifest V3準拠
- Service Worker (background.js) でバックグラウンド処理
- Content Script (content.js) で各サイトとの連携
- chrome.runtime.sendMessage でメッセージング
- chrome.storage.local で永続データ保存
- localStorage でドラフト保存

## ファイル構成
```
/
├── manifest.json      # 拡張機能設定
├── background.js      # Service Worker
├── content.js         # Content Script
├── popup.html        # ポップアップUI
├── popup.js          # ポップアップロジック
├── styles.css        # スタイル定義
├── update_version.sh # バージョン更新スクリプト
└── README.md         # ドキュメント
```