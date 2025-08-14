# 東方の三賢者 (Three Wise Men) Chrome Extension - Development Notes

## 重要な開発ルール

### ⚠️ 必須：manifest.jsonのバージョン更新
**Chrome拡張機能のコードを変更した場合は、必ず`./update_version.sh`を実行してバージョンを更新すること。**
- これを忘れるとChromeが変更を認識せず、古いコードが実行される
- ポップアップが表示されない等の問題の原因になる
- コマンド: `./update_version.sh`

## 概要
このChrome拡張機能は、ChatGPT、Claude、Grokの3つのAIサービスに同じ質問を同時に送信するツールです。

## アーキテクチャ

### ファイル構成
- `manifest.json` - Chrome拡張機能の設定ファイル
- `background.js` - Service Worker（タブの制御）
- `popup.html/js` - ポップアップUI（質問入力と履歴管理）
- `content.js` - 各AIサイトでのDOM操作（テキスト入力と送信）
- `styles.css` - ポップアップのスタイル

### 動作フロー
1. ユーザーがポップアップに質問を入力
2. popup.js → background.js にメッセージ送信
3. background.jsが3つのタブを開く
4. 各タブでcontent.jsが動作し、テキストを入力して送信ボタンをクリック

## 重要な実装詳細

### 1. for...ofループの使用禁止
**問題**: Chrome拡張機能のcontent script内で`for...of`ループを使うと「Illegal invocation」エラーが発生
**解決策**: 通常の`for`ループを使用する

```javascript
// ❌ NG
for (const selector of selectors) { }

// ✅ OK
for (let i = 0; i < selectors.length; i++) {
  const selector = selectors[i];
}
```

### 2. 各AIサービスの入力欄セレクタ
各サービスは頻繁にUIを更新するため、複数のセレクタを用意している：

**ChatGPT**:
- `textarea#prompt-textarea`
- `textarea[placeholder*="Message"]`
- `textarea.m-0`

**Claude**:
- `div.ProseMirror`
- `div[contenteditable="true"]`
- `div[role="textbox"]`

**Grok**:
- `textarea`
- `div[contenteditable="true"]`
- `:not([aria-label*="Search"])` で検索ボタンを除外

### 3. React互換性
ChatGPTはReactを使用しているため、値の変更時に特別な処理が必要：
```javascript
const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLTextAreaElement.prototype, "value"
).set;
nativeInputValueSetter.call(element, text);
```

### 4. タイミング制御
- タブ読み込み後: 1秒待機
- テキスト入力後: 500ms待機してから送信
- 送信ボタンクリック後: 100ms待機してから入力欄クリア

## 既知の問題と対処法

### 問題1: ポップアップが閉じると処理が止まる
**対処**: background.js (Service Worker) で主要な処理を実行

### 問題2: 送信ボタンが見つからない場合
**対処**: Enterキー押下をフォールバックとして実装

### 問題3: DOM要素の検索に時間がかかる
**対処**: setIntervalで最大10回リトライ（500ms間隔）

## テスト方法

### デバッグ
1. **拡張機能のエラー**: `chrome://extensions/` で確認
2. **Service Worker**: 「検証」でConsoleログ確認
3. **各AIサイト**: F12でcontent.jsのログ確認

### 主要なログメッセージ
- `"Three Wise Men content script loaded"` - content.js読み込み完了
- `"Found [service] input with selector:"` - 入力欄発見
- `"Clicking send button for [service]"` - 送信ボタンクリック
- `"Cleared ChatGPT input field"` - 入力欄クリア完了

## 今後の機能追加時の注意点

### 新しいAIサービスを追加する場合
1. manifest.jsonの`host_permissions`と`content_scripts`に追加
2. content.jsに新しいfill関数を追加
3. 送信ボタンのセレクタを調査して追加
4. background.jsのURLリストに追加

### セレクタ更新時
1. 必ず複数のセレクタを用意（フォールバック）
2. コンソールログで動作確認
3. 各サービスの開発者ツールで要素を確認

### パフォーマンス考慮
- DOM操作は最小限に
- リトライ回数に上限を設定
- メモリリークに注意（イベントリスナーの削除）

## 開発環境

### 必要なツール
- Chrome/Chromium ブラウザ
- テキストエディタ
- Git

### 拡張機能の再読み込み
1. `chrome://extensions/` を開く
2. 「更新」ボタンをクリック
3. または Cmd+R (Mac) / Ctrl+R (Windows)

## リポジトリ
https://github.com/hedachi/three-wise-men

## ライセンス
未設定（必要に応じて追加してください）

## 連絡先
GitHubのIssuesで報告してください