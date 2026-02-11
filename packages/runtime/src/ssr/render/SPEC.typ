= render API

#import "../../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

構造化配列（Tree）を SSR 用の HTML 文字列にレンダリングする。

== 関数

=== `renderTree`

```typescript
function renderTree(tree: Tree[], options?: RenderOptions): string
```

構造化配列を HTML 文字列にレンダリングする。マーカーを自動挿入し、Hydration に対応した出力を生成する。

=== `renderToString`

```typescript
function renderToString(
  tree: Tree[],
  state?: StateObject,
  dynamicValues?: Map<number, unknown>,
  componentRenderer?: ComponentRenderer
): string
```

状態付きの完全な HTML 文字列を生成する便利メソッド。`renderTree` + 状態スクリプトの挿入を行う。

=== `setComponentRenderer`

```typescript
function setComponentRenderer(renderer: ComponentRenderer | undefined): void
```

グローバルな ComponentRenderer を設定する。SSR 時に Web Components の Declarative Shadow DOM を生成するために使用する。

=== `createContext`

```typescript
function createContext(options?: RenderOptions): RenderContext
```

レンダリングコンテキストを生成する。マーカー ID のカウンターや状態を管理する。

== 型定義

```typescript
interface RenderContext {
  markerId: number;
  state: StateObject;
  dynamicValues: Map<number, unknown>;
  namespace: Namespace;
  componentRenderer?: ComponentRenderer;
}

interface RenderOptions {
  state?: StateObject;
  dynamicValues?: Map<number, unknown>;
  includeState?: boolean;
  componentRenderer?: ComponentRenderer;
}

type ComponentRenderer = (
  tagName: string,
  attrs: Record<string, unknown>
) => string | null;
```

`ComponentRenderer` は Web Components の Declarative Shadow DOM (DSD) 内容を生成する関数。

- 引数: `tagName` (カスタム要素名), `attrs` (属性オブジェクト)
- 戻り値: DSD の HTML 文字列、または `null`（登録されていない場合）

== 内部処理

- `escapeHtml`: XSS 防止のための HTML エスケープ
- `escapeAttr`: 属性値のエスケープ
- `camelToKebab`: CSS プロパティ名を camelCase → kebab-case に変換
- `serializeStyleObject`: style オブジェクトを CSS 文字列に変換
- `renderAttrs`: 属性のレンダリング（boolean 属性、style オブジェクト対応）
- Void 要素（`<br>`、`<img>` 等）の閉じタグ省略
- Boolean 属性（`disabled`, `checked` 等）の判定
- SVG/MathML 名前空間の自動切り替え
- Declarative Shadow DOM の生成（カスタム要素向け）

== 設計判断

#adr[
  *ADR: Declarative Shadow DOM 対応*

  *背景*: Web Components の SSR には Declarative Shadow DOM (DSD) が必要。

  *決定*: `ComponentRenderer` を使用して DSD を生成。
  - カスタム要素（タグ名に `-` を含む）を検出
  - `ComponentRenderer` が登録されていれば、DSD 形式で出力:
    ```html
    <my-component>
      <template shadowrootmode="open">
        {Shadow DOM content}
      </template>
    </my-component>
    ```
  - `ComponentRenderer` が `null` を返せば通常の要素として扱う
]

#adr[
  *ADR: グローバル ComponentRenderer*

  *背景*: すべてのレンダリング関数で同じ ComponentRenderer を共有したい。

  *決定*: `setComponentRenderer()` でグローバルに設定可能。
  - 個別の `RenderOptions` でもオーバーライド可能
]

#adr[
  *ADR: state と dynamicValues の null 非許容*

  *背景*: 空オブジェクト/Map で統一したほうがコードが簡潔。

  *決定*: `RenderContext` では `state` と `dynamicValues` を null 非許容で定義。
  - `createContext` で `options.state ?? {}` のように初期化
]

#adr[
  *ADR: style オブジェクトのサポート*

  *背景*: JSX で `style={{ padding: "20px" }}` のように書きたい。

  *決定*: `renderAttrs` 内で style オブジェクトを CSS 文字列に変換。
  - `camelCase` → `kebab-case` への変換
  - null/空文字の値を除外
]

- Web 標準 API のみ使用（Node.js 依存ゼロ）
- HTML エスケープは最小限の置換で実装（バンドルサイズ考慮）
- プレースホルダーはマーカーに変換し、動的値があれば埋め込む
