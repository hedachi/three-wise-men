# 東方の三賢者 (Three Wise Men) プロジェクト概要

## プロジェクトの目的
ChatGPT、Claude、Grokの3つのAIに同時に質問を送信するChrome拡張機能。
一つの質問を複数のAIで比較検討できるツール。

## 技術スタック
- **言語**: JavaScript (ES6+)
- **プラットフォーム**: Chrome Extension (Manifest V3)
- **ストレージ**: Chrome Storage API
- **UI**: HTML/CSS (Vanilla)
- **ビルドツール**: なし（純粋なJavaScript）

## 主要機能
1. ポップアップUIから質問を入力
2. 3つのAIサイトを新しいタブで同時に開く
3. 各サイトに自動的にテキストを入力
4. 質問履歴の保存と管理
5. 会話URLの自動保存
6. 履歴のCSVエクスポート機能

## バージョン管理
- 自動バージョン更新スクリプト: `update_version.sh`
- バージョン形式: `1.YYYY.MMDD.HHMM`