# Slack連携セットアップガイド

Three Wise MenにSlackから質問を送信できるようにする設定手順です。

## セットアップ手順

### 1. Chrome拡張機能のインストール

1. Chromeで `chrome://extensions/` を開く
2. 「開発者モード」をONにする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `three-wise-men`フォルダを選択
5. 拡張機能のIDをコピー（後で使用）

### 2. 依存関係のインストール

```bash
cd slack-host
npm install
```

### 3. Native Messagingホストのインストール

Chrome拡張機能のIDを使って以下のコマンドを実行：

```bash
npm run install-host -- YOUR_EXTENSION_ID
```

例：
```bash
npm run install-host -- abcdefghijklmnopqrstuvwxyz123456
```

### 4. Slackホストアプリの起動

```bash
npm start
```

正常に起動すると以下のメッセージが表示されます：
```
⚡️ Three Wise Men Slack host is running!
```

### 5. Chrome拡張機能の再読み込み

1. `chrome://extensions/` を開く
2. Three Wise Men拡張機能の「更新」ボタンをクリック
3. 拡張機能のポップアップを開いて「Slack: 接続済み」と表示されることを確認

### 6. Slackでの使い方

以下の3つの方法で質問を送信できます：

#### 方法1: スラッシュコマンド
```
/threewise AIと機械学習の違いは何ですか？
```

#### 方法2: メッセージプレフィックス
```
threewise: プログラミング言語の選び方を教えて
```

#### 方法3: アプリメンション
```
@three-wise-men 量子コンピュータについて説明して
```

## トラブルシューティング

### Slack: 未接続と表示される場合

1. ホストアプリが起動しているか確認
2. Chrome拡張機能を再読み込み
3. `chrome://extensions/` でエラーがないか確認

### Native Messaging Host not foundエラー

1. インストールコマンドを正しいExtension IDで再実行
2. 以下のファイルが存在するか確認：
   - Mac: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.threewisemen.slack.json`

### Slackコマンドが動作しない

1. Slack botトークンが正しく設定されているか確認
2. `/Users/hedachi/claude-code-slack-bot/.env`ファイルを確認
3. Slack Appの権限設定を確認

## アンインストール

```bash
npm run install-host -- YOUR_EXTENSION_ID uninstall
```

## 開発者向け情報

### ログの確認

- Chrome拡張機能: `chrome://extensions/` → Service Worker → コンソール
- ホストアプリ: ターミナル出力
- Content Script: 各AIサイトのF12開発者ツール

### デバッグモード

環境変数でデバッグモードを有効化：
```bash
DEBUG=true npm start
```