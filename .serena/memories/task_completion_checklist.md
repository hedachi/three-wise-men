# タスク完了時のチェックリスト

## コード変更後の確認事項

### 1. 構文チェック
- JavaScriptの構文エラーがないか確認
- console.log等のデバッグコードを削除

### 2. Chrome拡張機能の動作確認
- [ ] manifest.jsonの検証
- [ ] 拡張機能の再読み込み
- [ ] ポップアップUIの動作確認
- [ ] 3つのAIサイトへの同時送信確認

### 3. Content Scriptの動作確認
- [ ] ChatGPT.comでの動作
- [ ] Claude.aiでの動作  
- [ ] Grok.comでの動作
- [ ] 各サイトのConsoleでエラー確認

### 4. Service Workerの確認
- [ ] background.jsのエラー確認
- [ ] chrome://extensions/ でエラー表示確認

### 5. バージョン更新（必要時）
```bash
sh update_version.sh
```

### 6. Git操作（必要時）
```bash
git add .
git commit -m "変更内容の説明"
```

## 注意点
- 自動テストなし → 手動テスト必須
- リンター未設定 → 目視での構文確認
- TypeScript未使用 → 型エラーに注意