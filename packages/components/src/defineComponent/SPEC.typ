#import "../../../../SPEC/settings.typ": *
#show: apply-settings

= defineComponent

== 目的

Web Components を宣言的に定義するための高レベル API。Shadow DOM のセットアップ、`createRoot` ライフサイクル管理、Declarative Shadow DOM（DSD）のハイドレーション検出、`adoptedStyleSheets`、属性のリアクティブシグナル反映を自動化する。

== API

=== defineComponent

```typescript
function defineComponent(
  tagName: string,
  setup: SetupFunction,
  options?: ComponentOptions,
): typeof HTMLElement & ComponentClass
```

カスタム要素を定義し、`customElements.define()` で登録する。

*パラメータ:*
- `tagName`: カスタム要素のタグ名（ハイフン必須）
- `setup`: コンポーネントの DOM コンテンツを生成する関数
- `options`: スタイル、属性、ハイドレーションの設定

*返り値:*
- CSR: 登録された `HTMLElement` クラス（`__tagName__` プロパティ付き）
- SSR: プレースホルダークラス（`__tagName__` のみ保持）

*CSR の振る舞い:*
1. `HTMLElement` を継承したクラスを作成
2. コンストラクタで Shadow DOM を生成（DSD フォールバック対応）
3. `adoptedStyleSheets` にスタイルを適用
4. 属性名ごとにリアクティブシグナルを作成
5. `connectedCallback` で `createRoot` スコープ内から `setup` を呼び出す
6. DSD が存在する場合は `hydrate` 関数を優先使用
7. `disconnectedCallback` で `dispose` を呼び出し、cleanup を実行
8. `attributeChangedCallback` で属性シグナルを更新

*SSR の振る舞い:*
1. CSS テキストを `getCssText()` で抽出
2. `registerComponent()` でレジストリに登録
3. `ensureComponentRenderer()` で SSR レンダラーをセットアップ
4. `__tagName__` 付きプレースホルダークラスを返す

== 型定義

=== SetupFunction

```typescript
type SetupFunction = (
  host: HTMLElement,
  ctx: ComponentContext,
) => Node | DocumentFragment | string;
```

コンポーネントの DOM コンテンツを生成する関数。CSR では `Node | DocumentFragment` を返し、SSR では HTML 文字列を返す。

=== ComponentContext

```typescript
interface ComponentContext {
  readonly attrs: Readonly<Record<string, Signal<string | null>>>;
}
```

setup / hydrate 関数に渡されるコンテキスト。監視対象の属性がリアクティブシグナルとして提供される。

=== ComponentOptions

```typescript
interface ComponentOptions {
  styles?: readonly (CSSStyleSheet | string)[];
  attrs?: readonly string[];
  hydrate?: HydrateSetupFunction;
}
```

*フィールド:*
- `styles`: `adoptedStyleSheets` に適用する CSS（`css` タグまたは文字列）
- `attrs`: 監視する属性名の配列（`observedAttributes`）
- `hydrate`: DSD ハイドレーション用のセットアップ関数

=== ComponentClass

```typescript
interface ComponentClass extends Function {
  readonly __tagName__: string;
}
```

`defineComponent` が返すクラスに付与されるメタデータ。`renderDSD` や `renderDSDContent` で使用される。

=== HydrateSetupFunction

```typescript
type HydrateSetupFunction = (
  host: HTMLElement,
  ctx: ComponentContext,
) => void;
```

DSD ハイドレーション用のセットアップ関数。既存の DOM にイベントやリアクティビティを接続する。

== 設計決定

=== ADR-001: createRoot による cleanup スコープ

*決定:* `connectedCallback` 内で `createRoot` を使い、`disconnectedCallback` で `dispose` する。

*理由:*
1. effect の自動クリーンアップが保証される
2. メモリリークを防止
3. reactivity パッケージの Owner/Root パターンと一貫性がある

=== ADR-002: DSD ハイドレーション検出

*決定:* `shadowRoot.childNodes.length > 0` で DSD の存在を判定する。

*理由:*
1. ブラウザが `<template shadowrootmode>` をパースすると、ShadowRoot にコンテンツが存在する
2. DSD 未対応ブラウザでは `<template>` がコンストラクタで手動展開される
3. `hydrate` オプションが提供されている場合のみハイドレーションモードで動作

=== ADR-003: SSR 環境の判定

*決定:* `typeof window === "undefined"` で SSR を判定する。

*理由:*
1. Node.js / Edge ランタイムでは `window` が存在しない
2. SSR では DOM 操作を行わず、レジストリへの登録のみ必要
3. 返すクラスはプレースホルダーで十分（SSR では `new` しない）

=== ADR-004: adoptedStyleSheets パターン

*決定:* CSS をコンストラクタ内で `adoptedStyleSheets` に適用する。

*理由:*
1. `<style>` タグよりメモリ効率が良い
2. 複数インスタンスで同じ `CSSStyleSheet` を共有可能
3. DSD ハイドレーション時は SSR の `<style>` タグを削除し、`adoptedStyleSheets` に置き換える

=== ADR-005: 属性シグナルの遅延初期化

*決定:* コンストラクタで全監視属性のシグナルを作成し、`attributeChangedCallback` で更新する。

*理由:*
1. `connectedCallback` 前に属性が設定される可能性がある
2. シグナルを先に作成することで、setup 関数内から即座にアクセス可能
3. 初期値は `getAttribute()` で取得

== テストケース

1. カスタム要素を正しく定義する
2. Shadow DOM が生成される
3. `setup` 関数が呼ばれる
4. `adoptedStyleSheets` にスタイルが適用される
5. 属性シグナルが正しく初期化される
6. 属性変更がシグナルに反映される
7. `disconnectedCallback` で cleanup が実行される
8. DSD が存在する場合にハイドレーションモードで動作する
9. DSD 非対応ブラウザで `<template>` がフォールバック展開される
10. SSR 環境でレジストリに登録される
11. `__tagName__` プロパティが返されるクラスに付与される
12. Component Class を `renderDSD` の引数として使用できる
