# Raycast Integration for 東方の三賢者 (Three Wise Men)

## セットアップ方法

### 1. Chrome拡張機能の更新
1. Chromeで `chrome://extensions/` を開く
2. 「東方の三賢者」拡張機能を見つけて「再読み込み」をクリック
3. Developer modeを有効にして、拡張機能のIDをメモする（例：`abcdefghijklmnopqrstuvwxyz123456`）

### 2. Raycast Script Commandsの設定

#### 方法1: Python版（推奨）
1. Raycastを開く
2. `Create Script Command` を選択
3. `three-wise-men.py` をインポート
   - または、Raycastのスクリプトディレクトリにコピー：
   ```bash
   cp three-wise-men.py ~/Documents/Raycast\ Scripts/
   ```

#### 方法2: シェルスクリプト版
1. `three-wise-men.sh` を編集して、`EXTENSION_ID` を実際のIDに置き換える
2. Raycastにインポート

#### 方法3: AppleScript版（ショートカット使用）
1. `three-wise-men-shortcut.applescript` をRaycastにインポート
2. Chrome拡張機能のショートカット（Command+Shift+Y）を使用

## 使い方

### Raycastから
1. Raycastを開く（デフォルト: `Command + Space`）
2. "Ask Three Wise Men" と入力
3. Enterを押す
4. 質問を入力してEnter

### Chrome拡張機能のショートカット
- `Command + Shift + Y`: ポップアップを開く（Chrome内で使用）

### URLから直接アクセス
```
chrome-extension://[EXTENSION_ID]/launcher.html?q=YOUR_QUESTION_HERE
```

## トラブルシューティング

### 拡張機能IDの確認方法
1. Chromeで `chrome://extensions/` を開く
2. 「Developer mode」をONにする
3. 「東方の三賢者」の下に表示されるIDをコピー

### スクリプトが動作しない場合
1. 実行権限を確認：
   ```bash
   chmod +x three-wise-men.py
   chmod +x three-wise-men.sh
   ```

2. Chrome拡張機能が有効になっているか確認

3. Raycastのスクリプトディレクトリを確認：
   ```bash
   ls ~/Documents/Raycast\ Scripts/
   ```

### Python版で自動検出が失敗する場合
スクリプト内の以下の行を手動で更新：
```python
extension_id = "YOUR_ACTUAL_EXTENSION_ID_HERE"
```

## 機能

- **3つのAIに同時送信**: ChatGPT、Claude、Grok に同じ質問を一度に送信
- **自動タブ開き**: 各AIサービスのタブを自動で開く
- **テキスト自動入力**: 質問テキストを自動で入力
- **履歴保存**: 質問と回答URLを自動保存

## 注意事項

- 初回実行時は各AIサービスにログインしている必要があります
- 各サービスのページが完全に読み込まれるまで待ってから質問が入力されます
- 質問送信後、自動的に会話URLが履歴に保存されます