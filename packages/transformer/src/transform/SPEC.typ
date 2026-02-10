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

=== コンポーネント要素 vs HTML 要素の判別

JSX 要素のタグ名が *大文字で始まる* 場合はコンポーネント（関数コンポーネント）として扱い、
*小文字で始まる* 場合は HTML 要素として扱う（JSX の標準慣例、React/SolidJS と同じ）。

- `<Counter />` → コンポーネント（関数呼び出し `Counter({})` を生成）
- `<div />` → HTML 要素（構造化配列 `["div", null]` を生成）
- `<Foo.Bar />` → コンポーネント（JSXMemberExpression は常にコンポーネント）

コンポーネント要素は `fromTree()` / `renderToString()` のツリーノードに含めず、
*関数呼び出し式* として出力する。属性は props オブジェクトとして渡す。

==== 変換例

```
// 入力
<div><Counter initialCount={5} /></div>

// CSR 出力（概念）
fromTree([["div", null, ["{insert}", null]]], 0)
// 動的部分: insert → Counter({ initialCount: 5 })

// SSR 出力（概念）
renderToString([["div", null, ["{insert}", null]]], {}, new Map([[1, Counter({ initialCount: 5 })]]))
```

ルート要素がコンポーネントの場合は、ツリー生成を行わず直接関数呼び出しを返す:
```
// 入力
return <Counter initialCount={5} />

// CSR/SSR 出力
return Counter({ initialCount: 5 })
```

=== CSR モード（デフォルト）

- JSX 式を `fromTree()` 呼び出しに変換する
- 静的な属性は構造化配列に含める
- 動的な属性（式を含む）は `templateEffect` でラップする
- イベントハンドラは `event()` 呼び出しに変換する
- テキスト内の式は `setText()` で更新する
- コンポーネント要素は関数呼び出しに変換し、`insert()` で挿入する
- `@dathomir/runtime` からのインポート文を自動生成する

=== SSR モード

- `renderToString()` を使用した HTML 文字列生成コードを出力する
- SSR マーカーを挿入する
- Signal の初期値をシリアライズするコードを生成する
- コンポーネント要素は関数呼び出しに変換し、動的値として渡す

=== 変換の流れ

1. Babel でソースコードをパースして AST を生成
2. AST を走査し、JSX 要素を検出
3. *コンポーネント判別*: タグ名の先頭文字（大文字 → 関数呼び出し、小文字 → ツリーノード）
4. HTML 要素を構造化配列表現に変換
5. DOM ナビゲーション（firstChild, nextSibling）コードを生成
6. 動的バインディング用の templateEffect コードを生成
7. 必要なランタイムインポートを追加
8. Babel generator でコードを再生成

== エッジケース

- 空の JSX 要素
- Fragment の処理
- ネストされた JSX 要素
- スプレッド属性
- 条件付きレンダリング
- リストレンダリング
- *コンポーネント要素（大文字タグ）*: 関数呼び出しに変換
- *JSXMemberExpression*（`<Foo.Bar />`）: コンポーネントとして扱う
- *コンポーネントの children*: テキスト/式/JSX を `children` prop として渡す

== 設計決定

=== ADR: コンポーネント判別基準

*決定:* タグ名の先頭文字が大文字の場合をコンポーネントとして扱う。

*理由:*
1. JSX の標準慣例（React, SolidJS, Preact 等と同じ）
2. JSXMemberExpression（`<Foo.Bar />`）は常にコンポーネント参照
3. ランタイム情報なしで静的に判別可能（コンパイル時に決定）

=== ADR: コンポーネントの props 渡し方

*決定:* JSX 属性をそのまま props オブジェクトとして渡す。`computed()` ラッピングは行わない。

*理由:*
1. 関数コンポーネントは一度だけ実行される（SolidJS スタイル）
2. props は初期値として使われ、コンポーネント内部で signal に変換される
3. リアクティブな props が必要な場合はコンポーネント側で対応

== テストケース

- 単純な JSX 要素を変換する
- 属性付き要素を変換する
- 動的テキストを変換する
- イベントハンドラを変換する
- ネストされた要素を変換する
- SSR モードで renderToString を使用する
- *コンポーネント要素を関数呼び出しに変換する（CSR）*
- *コンポーネント要素を関数呼び出しに変換する（SSR）*
- *ネストされたコンポーネント要素を insert として扱う*
