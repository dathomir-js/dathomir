# AGENTS.md

## プロジェクト概要

このプロジェクトは、**Web Components** と **Signals**(tc39 signals、alien-signals)を主要技術として使用し、モダンで効率的な Web アプリケーションを構築するためのフレームワークライブラリを開発しています。

## セッションガイドライン

### セッション開始時

1. この `AGENTS.md` と関連するパッケージの `AGENTS.md` と `SPEC.typ` および `implementation.test.ts` を読む
2. コードベースの現状を確認する(git status、最近のコミット)
3. 変更を加える前に、依頼されたタスクのスコープを理解する

### セッション終了時

1. すべての変更が**クリーンな状態**であることを確認する（半端な実装を残さない）
2. コードは main ブランチにマージ可能な状態にする：重大なバグなし、適切にドキュメント化
3. タスクを完了できない場合は、現状と残作業を文書化する

## AI エージェントへの重要な注意事項

### タスク実行ルール

- 人間がタスクを依頼する際、どの項目を作業するか具体的に指定する
- 人間がどのタスクを実行するか指定しない場合は、確認を求めること
- sub agent にタスクを依頼する際は、タスクのスコープと期待される成果物を明確に伝えること
- 人間に質問しなくても解決する問題は、できるだけ sub agent にタスクを依頼して解決すること

### 変更を加える前に

- implementation.ts の修正を行う場合は、まず、その機能と同じディレクトリに存在する SPEC.typ と implementation.test.ts を implementation.ts に加えようとしている変更内容の仕様、設計、テストケースを作成してから行うこと
- コードを修正する前に十分なコンテキストを収集すること（関連するコード、ドキュメント、依存関係など）
- 依存パッケージの最新仕様を理解すること(Context7 等を活用)
- SPEC.typ と implementation.test.ts を必ず読むこと
- 大きな変更の場合は、先に人間にアプローチを確認すること
- 変更後はテストを実行して正しさを検証すること

### 禁止事項

- SPEC.typ と implementation.test.ts に変更を加えずに implementation.ts を修正しないこと
- 明示的な許可なしにテストを削除・変更しないこと
- 依頼されたスコープ外の変更を行わないこと
- 適切な検証なしにタスクを「完了」と宣言しないこと

## パッケージ開発ガイドライン

### コーディングスタイル

#### 全般

- リンターエラーは必ず修正すること（デバッグ用の `console.log` 等は一時的に許可、最終的には削除）
- コーディングスタイルは可能な限り `oxlint` で検出できる形で定義し、文章ルールだけに依存しないこと
- 命名はできるだけ具体的な機能名にする
- 早期リターンを優先し、ネストを削減する
- 純粋関数を優先し、副作用は明示的に分離する

#### TypeScript

- 関数の `export` はファイルの最終行でのみ行う
- `as` キャストより型ガードを優先する
- TypeScript の型安全性を損なう記法は禁止

#### JavaScript

- 公開 API には JSDoc を必ず記載する (JSDoc must be present on public APIs)
- 重要な処理にはコメントをつけるが、不要な冗長コメントは避ける (Keep comments minimal and purposeful)
- すべてのコードコメント（JSDoc / inline）は英語で記述する (All code comments MUST be in English)
- 高パフォーマンスを意識して処理を組み立てる（ただし可読性を著しく下げない範囲で） (Optimize without sacrificing clarity)

### テスト

- テストフレームワークには **vitest** を使用する
- 可能な限り **100% のテストカバレッジ** を目指す

### ドキュメント

- コード内に **JSDoc コメント**で説明を追加する（英語で記述）
- 過度なコメントは避け、関数の説明やパラメータの説明など最小限に留める

### ファイル構成ルール

新しい API (公開、内部どちらも) や機能を実装する際は、以下のディレクトリ構成に従うこと：

```
packages/{package-name}/src/{api-name}/
├── AGENTS.md               # AI エージェント向けの実装ガイド（必須参照: SPEC.typ, implementation.test.ts）
├── SPEC.typ               # 仕様と設計決定（日本語）
├── implementation.ts      # 実装コード
└── implementation.test.ts # テストコード
```

**各ファイルの役割：**
- **SPEC.typ**: 仕様と設計決定を記述。実装の「何を」「なぜ」を定義
- **implementation.test.ts**: 実装の正しさを検証するテストケース
- **implementation.ts**: SPEC.typ に基づいた実装コード
- **AGENTS.md**: AI エージェントに対し、まず SPEC.typ と implementation.test.ts を読むよう指示 (ほとんど変更しない)

**実装前の必須手順：**
1. SPEC.typ を読み、仕様と設計を理解する
2. implementation.test.ts を読み、期待される振る舞いを確認する
3. implementation.ts を実装し、すべてのテストが通ることを確認する

## ディレクトリ構成
このプロジェクトを理解する補完情報として読んでください

```
<project-root>/
├── config/              # パッケージ共通の設定ファイル
├── packages/
│   ├── components/      # Web Components 実装
│   ├── core/            # 他パッケージを集約するコアフレームワーク
│   ├── plugin/          # ビルドツール向けプラグイン（Vite、webpack など）
│   ├── reactivity/      # Signals 実装（alien-signals ベース）
│   ├── runtime/         # ランタイム
│   ├── transformer/     # コンパイラ/トランスフォーマー
│   └── shared/          # 共有ユーティリティ
├── playgrounds/
│   └── *                # 各パッケージの動作確認用プレイグラウンド
├── .github/             # GitHub 関連の設定ファイル
├── dathomir.code-workspace  # VSCode ワークスペース設定
```
