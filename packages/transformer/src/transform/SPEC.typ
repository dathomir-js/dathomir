= transform 関数

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

JSX が変換された JavaScript コードを解析し、構造化配列方式（fromTree）への変換を行う。
`oxc-parser` で ESTree 互換 AST を生成し、`zimmerframe` で走査・変換、`esrap` でコードを再生成する。
純粋な ESTree ノードのみを使用し、高速かつ軽量なパイプラインを実現する。

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
- コンポーネント要素は関数呼び出しに変換し、`insert()` で挿入する（`templateEffect` でラップしない）
- 式挿入（conditional, map など）は `templateEffect` でラップして `insert()` を呼ぶ
- `@dathomir/runtime` からのインポート文を自動生成する

=== SSR モード

- `renderToString()` を使用した HTML 文字列生成コードを出力する
- SSR マーカーを挿入する
- Signal の初期値をシリアライズするコードを生成する
- コンポーネント要素は関数呼び出しに変換し、動的値として渡す

=== 変換の流れ

1. `oxc-parser` でソースコードをパースして純粋な ESTree 互換 AST を生成
2. `zimmerframe` で AST を走査し、JSX 要素を検出（根要素のみ処理、ネストは無視）
3. *コンポーネント判別*: タグ名の先頭文字（大文字 → 関数呼び出し、小文字 → ツリーノード）
4. HTML 要素を構造化配列表現に変換（純粋な ESTree ノードオブジェクトとして組み立て）
5. DOM ナビゲーション（firstChild, nextSibling）コードを生成
6. 動的バインディング用の templateEffect コードを生成
7. 必要なランタイムインポートを追加
8. `esrap` でコードを再生成

*なぜ zimmerframe か:*
- ESTree/任意 AST に対応した軽量 walker
- `walk(node, state, visitors)` で visitor パターンによる AST 走査が可能
- 走査不要なサブツリーは visitor 内で `next()` を呼ばないことで自然にスキップできる
- Svelte コンパイラで実際に使用されており、esrap（同作者・同エコシステム）と親和性が高い
- ノード置換は visitor の戻り値として新ノードを返すだけ（immutable 変換）

=== ADR: oxc-parser + zimmerframe の採用

*決定:* `oxc-parser` + `zimmerframe` + 素の ESTree ノードオブジェクト組み立てを使用する。

*理由:*
1. `oxc-parser` は Rust 実装で高速（10–100x 程度）かつ純粋な ESTree 互換 AST を出力するため、アダプタ層が不要
2. 外部 AST ライブラリへの依存をゼロにすることでバンドルサイズが削減される
3. `zimmerframe` は ESTree 任意 AST に対応した軽量 walker で、visitor パターンで AST を走査できる

*ESTree ノードの組み立て方針:*
内部ヘルパー関数群（`nLit()`, `nId()`, `nCall()` 等）でプレーンな ESTree ノードを生成し、
可読性と型安全性を確保する。

*zimmerframe での根要素のみ変換:*
zimmerframe は state で親文脈を引き渡す。visitor で `inJSX: false` の状態でのみ変換し、その際 `next()` を呼ばないことで
子 JSX への再帰的変換を防止する。

== エッジケース

- 空の JSX 要素
- Fragment の処理（動的コンテンツを含む Fragment も正しく変換される）
- ネストされた JSX 要素
- スプレッド属性
- 条件付きレンダリング
- リストレンダリング
- *コンポーネント要素（大文字タグ）*: 関数呼び出しに変換
- *JSXMemberExpression*（`<Foo.Bar />`）: コンポーネントとして扱う
- *コンポーネントの children*: テキスト/式/JSX を `children` prop として渡す
- *ハイフン付き属性名*（`data-foo`, `aria-label` 等）: 有効な JS 識別子でない場合は文字列リテラルキーを使用
- *静的式属性*（`.value` アクセスを含まない式）: `templateEffect` でラップせず静的属性として扱う
- *式コンテナ内の関数呼び出し*（`{fn()}`）: `.map()` 以外の CallExpression は `{insert}` プレースホルダー + `templateEffect` でラップして `insert()` する
- *logical expression*（`{cond && <A/>}`, `{a || <B/>}`）: `{insert}` プレースホルダー + `templateEffect` で `insert()` する
- *式内 JSX の汎用フォールバック*（Array/Object/Binary など）: 式ツリー内に JSX が含まれる場合は mode-aware に JSX を先に変換し、`insert()` 経由で挿入する
- *JSXSpreadChild*（`{...expr}`）: `insert()` 経由の動的挿入として扱う
- *namespaced 属性*（`xlink:href` など）: 属性キーを `"xlink:href"` 形式の文字列キーとして保持する

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

=== ADR: コンポーネント insert を templateEffect でラップしない

*決定:* コンポーネント（大文字タグ）を `insert()` で挿入する際、`templateEffect` でラップしない。
直接 `insert(parent, Component({ props }), anchor)` として出力する。

*理由:*
1. コンポーネントは一度だけ実行される（SolidJS スタイル）。templateEffect でラップすると props 変化のたびにコンポーネントが再生成されてしまう
2. コンポーネントの内部状態（signal）が毎回リセットされる問題を防ぐ
3. コンポーネントに渡す props はスナップショット値（初期値）であり、リアクティブバインディングではない
4. リアクティブな props 伝達はコンポーネント側の責務（Signal をそのまま渡すなどの手段で対応）

*影響:*
- 条件式（`{condition ? <A/> : <B/>}`）や map（`{items.map(...)}`）は引き続き templateEffect でラップする（これらは式全体の再評価が意図されているため）
- コンポーネントへの `signal.value` 渡しは初期値のみ伝達され、signal 変化には追従しない

=== ADR: 静的式属性（reactive access なし）の扱い

*決定:* `.value` アクセスを含まない式属性（例: `<div class={getClass()}>`）は `templateEffect` でラップせず、静的属性オブジェクトに含める。

*理由:*
1. リアクティブな追跡は `.value` アクセスが検出された場合のみ必要
2. `getClass()` のような非 reactive な式は一度だけ評価すれば十分
3. 静的扱いにすることで不要なエフェクトの生成を防ぐ

=== ADR: ハイフン付き属性名の扱い

*決定:* `data-foo` や `aria-label` のような有効な JavaScript 識別子でない属性名は、`t.identifier()` ではなく `t.stringLiteral()` をキーとして使用した ObjectProperty を生成する。

*理由:*
1. `t.identifier("data-foo")` は構文的に無効な識別子を生成し、esrap が `{ data-foo: "bar" }` という構文エラーのある JS を出力する
2. `{ "data-foo": "bar" }` が正しい表現

*判定基準:* 属性名が `/^[a-zA-Z_$][a-zA-Z0-9_$]*$/` に一致しない場合は文字列リテラルキーを使用する。

=== ADR: 型安全性 — `as` アサーションの除去

*決定:* `as` 型キャストを可能な限り除去し、TypeScript の型推論・型ガードで対応する。
`as unknown as X` は禁止。やむを得ない場合に限り直接 `as X`（サブタイプ関係がある場合）のみ許可。

*理由:*
1. `as` キャストは TypeScript の型チェックを迂回するため、実装バグを見逃しやすい
2. 型ガード (`node is X`) を使うことで、後続コードが自動絞り込みの恩恵を受けられる
3. JSX ノード型が `ESTNode` を extend することで、zimmerframe の visitor パラメータとの型整合性が取れる

*実装方針:*

**1. JSX ノードを `ESTNode` に extend させる**
JSX インターフェース (`JSXElement`, `JSXFragment`, `JSXText`, `JSXExpressionContainer`,
`JSXEmptyExpression`, `JSXSpreadChild`, `JSXSpreadAttribute`, `JSXAttribute`) はすべて
`extends ESTNode` とする。これにより zimmerframe visitor の `node: ESTNode` パラメータから
型ガード経由で型を絞り込める。

**2. `JSXOpeningElement` を名前付きインターフェースに抽出する**
`JSXElement.openingElement` のインライン型を `JSXOpeningElement` インターフェースとして定義し、
`JSXElement` から参照する。

**3. `JSXChild` から `ESTNode` を除去し `JSXSpreadChild` を追加する**
```typescript
type JSXChild =
  | JSXElement
  | JSXFragment
  | JSXText
  | JSXExpressionContainer
  | JSXSpreadChild;
```
これにより `processChildren` 内の `const child = rawChild as ESTNode` が不要になる。
各 JSX 型が `ESTNode` を extend しているため、`child.type` での絞り込みが自動で機能する。

**4. `MemberExpression` / `VariableDeclarator` インターフェースを追加する**
```typescript
interface MemberExpression extends ESTNode {
  type: "MemberExpression";
  object: ESTNode;
  property: ESTNode;
  computed: boolean;
  optional: boolean;
}
interface VariableDeclarator extends ESTNode {
  type: "VariableDeclarator";
  id: Identifier;
  init: ESTNode | null;
}
```
`VariableDeclaration.declarations` の型を `ESTNode[]` → `VariableDeclarator[]` に変更する。
`nConst` の `id` パラメータを `Identifier` に強化する。

**5. 型ガード関数を追加する**
```typescript
function isMemberExpression(node: ESTNode): node is MemberExpression
function isIdentifier(node: ESTNode): node is Identifier
function isCallExpression(node: ESTNode): node is CallExpression
function isVariableDeclaration(node: ESTNode): node is VariableDeclaration
function isJSXElement(node: ESTNode): node is JSXElement
function isJSXFragment(node: ESTNode): node is JSXFragment
function isJSXExpressionContainer(node: ESTNode): node is JSXExpressionContainer
```

**6. zimmerframe visitor の `as unknown as X` を `as X` に簡略化する**
JSX 型が `ESTNode` を extend するため、`node as unknown as JSXElement` は
`node as JSXElement` に簡略化できる。戻り値も `ESTNode` のサブタイプなので
`as unknown as ESTNode` ではなく型推論のみで OK。

=== ADR: Fragment の dynamicParts の正しい収集

*決定:* `jsxToTree` の Fragment パスでは、`processChildren` が参照渡しで push する `dynamicParts` ローカル変数をそのまま戻り値に含める。`children.flatMap((c) => c.dynamicParts)` は使用しない。

*理由:*
`processChildren` は `dynamicParts` パラメータに直接 `.push()` する設計のため、各 `TreeResult.dynamicParts` フィールドは常に空配列。Fragment 内の動的コンテンツ（テキスト・属性・コンポーネント insert 等）が消失するバグを防ぐ。

JSXElement パス（非 Fragment）では `dynamicParts` ローカル変数をそのまま返しているが、Fragment パスも同様の扱いとする。

- 単純な JSX 要素を変換する
- 属性付き要素を変換する
- 動的テキストを変換する
- イベントハンドラを変換する
- ネストされた要素を変換する
- SSR モードで renderToString を使用する
- *コンポーネント要素を関数呼び出しに変換する（CSR）*
- *コンポーネント要素を関数呼び出しに変換する（SSR）*
- *ネストされたコンポーネント要素を insert として扱う*
- スプレッド属性（HTML 要素）を `spread()` + `templateEffect` に変換する
- 条件付きレンダリング（ternary 式）を `insert()` + `templateEffect` に変換する
- リストレンダリング（`.map()` 式）を `insert()` + `templateEffect` に変換する
- 既存 import 文がある場合、ランタイムインポートをその直後に挿入する
- ネストされた Fragment（CSR）を処理する（親 Fragment 内の子は個別に処理しない）
- *Fragment 内の動的テキスト*: `templateEffect` + `setText` が正しく生成される
- *Fragment 内のコンポーネント*: `insert()` が正しく生成される
- *ハイフン付き属性名*（`data-foo` 等）: 文字列リテラルキーで ObjectProperty を生成する
- *静的式属性*（reactive access なし）: `templateEffect` を生成しない
- *SSR モードの条件付きレンダリング*: ternary 式の各 JSX 分岐が `renderToString()` に変換される（CSR の `fromTree` にならない）
- *SSR モードの logical expression*: JSX 分岐が `renderToString()` に変換される（CSR の `fromTree` にならない）

=== ADR: logical expression を insert として扱う

*決定:* `JSXExpressionContainer` 内の `LogicalExpression` は `{insert}` dynamic part として扱い、
CSR では `templateEffect + insert()`、SSR では `renderToString()` 変換結果を動的値に格納する。

*理由:*
1. `{cond && <A/>}` / `{a || <B/>}` は JSX 実装で頻出の条件レンダリング構文
2. text dynamic part では JSX ノードを安全に扱えない

=== ADR: 式内 JSX の汎用フォールバック

*決定:* `.map()` / ternary / call 以外でも、式サブツリーに `JSXElement` または `JSXFragment` が含まれる場合は
`transformNestedJSX` を適用して `insert` dynamic part として扱う。

*理由:*
1. ArrayExpression / ObjectExpression / SequenceExpression 等に JSX が埋め込まれると既存の分岐だけでは取りこぼす
2. 「JSX を含む式」は text 更新ではなくノード挿入の責務に寄せる方が安全

=== ADR: namespaced 属性名を文字列キーとして保持

*決定:* `JSXNamespacedName` 属性（例: `xlink:href`）は `"xlink:href"` をキーとして出力する。

*理由:*
1. `:` を含む名前は JavaScript 識別子として不正
2. SVG 属性の実運用で必須になるケースがある

=== ADR: JSXSpreadChild の変換

*決定:* `JSXSpreadChild` は `insert` dynamic part として扱い、式は `transformNestedJSX` で mode-aware に先行変換する。

*理由:*
1. 無視すると子要素が静かに欠落する
2. `insert` 経由なら既存の動的挿入フローに統合できる

=== ADR: SSR モードにおける `transformNestedJSX` の mode 伝播

*問題:* `transformNestedJSX`（条件式 `cond ? <A/> : <B/>` や `.map()` コールバック内の JSX を変換する関数）が `state.mode` を無視して常に CSR の `transformJSXNode` を呼んでいた。その結果、SSR モードでも条件分岐内の JSX が `fromTree`（DOM 依存）として変換され、サーバー側で `document is not defined` エラーが発生した。

*決定:* `transformNestedJSX` 内の visitor を mode-aware にする。
- `state.mode === "ssr"` の場合: `transformJSXForSSRNode` を使用（`renderToString()` を生成）
- `state.mode === "csr"` の場合: `transformJSXNode` を使用（既存動作）

*影響:*
- SSR モードの条件式 `{cond ? <A/> : <B/>}` の各 JSX 分岐が `renderToString([...], {}, new Map(...))` に変換される
- SSR モードの `.map()` コールバック内の JSX も同様に SSR 変換される
- CSR の動作は変わらない（`state.mode !== "ssr"` のパスは既存のまま）
