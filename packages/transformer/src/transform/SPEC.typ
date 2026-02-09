= transform 関数

#import "../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

JSX が変換された JavaScript コードを解析し、構造化配列方式（fromTree）への変換を行う。
Babel の parser/traverse/generator を使用して AST を操作する。

== シグネチャ

```typescript
function transform(code: string, options?: TransformOptions): TransformResult
```

== 動作

=== CSR モード（デフォルト）

- JSX 式を `fromTree()` 呼び出しに変換する
- 静的な属性は構造化配列に含める
- 動的な属性（式を含む）は `templateEffect` でラップする
- イベントハンドラは `event()` 呼び出しに変換する
- テキスト内の式は `setText()` で更新する
- `@dathomir/runtime` からのインポート文を自動生成する

=== SSR モード

- `renderToString()` を使用した HTML 文字列生成コードを出力する
- SSR マーカーを挿入する
- Signal の初期値をシリアライズするコードを生成する

=== 変換の流れ

1. Babel でソースコードをパースして AST を生成
2. AST を走査し、JSX 要素を検出
3. JSX 要素を構造化配列表現に変換
4. DOM ナビゲーション（firstChild, nextSibling）コードを生成
5. 動的バインディング用の templateEffect コードを生成
6. 必要なランタイムインポートを追加
7. Babel generator でコードを再生成

== エッジケース

- 空の JSX 要素
- Fragment の処理
- ネストされた JSX 要素
- スプレッド属性
- 条件付きレンダリング
- リストレンダリング

== テストケース

- 単純な JSX 要素を変換する
- 属性付き要素を変換する
- 動的テキストを変換する
- イベントハンドラを変換する
- ネストされた要素を変換する
- SSR モードで renderToString を使用する
