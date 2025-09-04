# 開発用コマンド一覧

## Chrome拡張機能の開発
- **拡張機能の読み込み**: 
  1. Chrome で `chrome://extensions/` を開く
  2. デベロッパーモードをON
  3. 「パッケージ化されていない拡張機能を読み込む」でフォルダ選択

- **拡張機能の再読み込み**: 
  - `chrome://extensions/` で更新ボタンをクリック
  - または Cmd+R (Mac) / Ctrl+R (Windows)

## バージョン管理
```bash
# バージョン自動更新
sh update_version.sh

# Git操作
git status
git diff
git add .
git commit -m "commit message"
git push
```

## デバッグ
- **Service Worker**: `chrome://extensions/` → Service Worker「検証」
- **Content Script**: 各サイトでF12 → Consoleタブ
- **ポップアップ**: 拡張機能アイコン右クリック → 「ポップアップを検証」

## ファイル操作（macOS）
```bash
ls -la          # ファイル一覧
open .          # Finderで開く
code .          # VS Codeで開く（インストール済みの場合）
```

## 注意事項
- ビルドツール不使用（npm/webpack等なし）
- テストフレームワーク未導入
- リンター/フォーマッター未設定
- 直接JavaScriptファイルを編集