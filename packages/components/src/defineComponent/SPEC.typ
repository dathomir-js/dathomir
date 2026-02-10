#import "../../../../SPEC/settings.typ": *
#show: apply-settings

= defineComponent

== 目的

Web Components を宣言的に定義するための高レベル API。Shadow DOM のセットアップ、`createRoot` ライフサイクル管理、Declarative Shadow DOM（DSD）のハイドレーション検出、`adoptedStyleSheets`、属性のリアクティブシグナル反映を自動化する。

== API

=== defineComponent

```typescript
function defineComponent<const S extends PropsSchema = {}>(
  tagName: string,
  setup: SetupFunction<S>,
  options?: ComponentOptions<S>,
): ComponentConstructor<S>
```

カスタム要素を定義し、`customElements.define()` で登録する。

*パラメータ:*
- `tagName`: カスタム要素のタグ名（ハイフン必須）
- `setup`: コンポーネントの DOM コンテンツを生成する関数
- `options`: スタイル、props、ハイドレーションの設定

*返り値:*
- CSR: 登録された `HTMLElement` クラス（`__tagName__` / `__propsSchema__` プロパティ付き）
- SSR: プレースホルダークラス（`__tagName__` / `__propsSchema__` のみ保持）

*CSR の振る舞い:*
1. `HTMLElement` を継承したクラスを作成
2. コンストラクタで Shadow DOM を生成（DSD フォールバック対応）
3. `adoptedStyleSheets` にスタイルを適用
4. props 定義に基づいてリアクティブシグナルを作成（型変換付き）
5. 各 prop に対して JS property のゲッター/セッターを定義
6. `connectedCallback` で `createRoot` スコープ内から `setup` を呼び出す
7. DSD が存在する場合は `hydrate` 関数を優先使用
8. `disconnectedCallback` で `dispose` を呼び出し、cleanup を実行
9. `attributeChangedCallback` で型変換後にシグナルを更新

*SSR の振る舞い:*
1. CSS テキストを `getCssText()` で抽出
2. `registerComponent()` でレジストリに登録
3. `ensureComponentRenderer()` で SSR レンダラーをセットアップ
4. `__tagName__` / `__propsSchema__` 付きプレースホルダークラスを返す

== 型定義

=== PropType / PropDefinition / PropsSchema

```typescript
type PropType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ((value: string | null) => unknown);

interface PropDefinition {
  type: PropType;
  default?: unknown;
  attribute?: string | false;
}

type PropsSchema = Record<string, PropDefinition>;
```

*PropDefinition フィールド:*
- `type`: 型変換に使用。ランタイムの型変換と TypeScript の型推論の二重目的
- `default`: 属性未設定時の初期値。未指定の場合は型に応じたデフォルト値（String: `""`, Number: `0`, Boolean: `false`）
- `attribute`: `false` でプロパティ専用（属性として反映しない）、文字列で属性名のカスタマイズ。未指定時は prop 名をそのまま属性名として使用

=== 型推論ユーティリティ

```typescript
type InferPropType<D extends PropDefinition> =
  D extends { type: StringConstructor } ? string :
  D extends { type: NumberConstructor } ? number :
  D extends { type: BooleanConstructor } ? boolean :
  D extends { type: (v: string | null) => infer R } ? R :
  unknown;

type InferProps<S extends PropsSchema> = {
  readonly [K in keyof S]: Signal<InferPropType<S[K]>>;
};
```

=== SetupFunction

```typescript
type SetupFunction<S extends PropsSchema = PropsSchema> = (
  host: HTMLElement,
  ctx: ComponentContext<S>,
) => Node | DocumentFragment | string;
```

コンポーネントの DOM コンテンツを生成する関数。

=== ComponentContext

```typescript
interface ComponentContext<S extends PropsSchema = PropsSchema> {
  readonly props: Readonly<InferProps<S>>;
}
```

setup / hydrate 関数に渡されるコンテキスト。props がリアクティブシグナルとして提供される。

=== ComponentOptions

```typescript
interface ComponentOptions<S extends PropsSchema = PropsSchema> {
  styles?: readonly (CSSStyleSheet | string)[];
  props?: S;
  hydrate?: HydrateSetupFunction<S>;
}
```

*フィールド:*
- `styles`: `adoptedStyleSheets` に適用する CSS（`css` タグまたは文字列）
- `props`: Props スキーマ定義
- `hydrate`: DSD ハイドレーション用のセットアップ関数

=== ComponentConstructor / ComponentClass

```typescript
type ComponentConstructor<S extends PropsSchema = PropsSchema> = {
  new(): HTMLElement & { [K in keyof S]: InferPropType<S[K]> };
  readonly prototype: HTMLElement;
} & ComponentClass<S>;

interface ComponentClass<S extends PropsSchema = PropsSchema> extends Function {
  readonly __tagName__: string;
  readonly __propsSchema__?: S;
}
```

=== ComponentElement 型ヘルパー

```typescript
type ComponentElement<C> =
  C extends ComponentClass<infer S>
    ? { [K in keyof S]?: InferPropType<S[K]> } & { children?: unknown }
    : Record<string, unknown>;
```

TSX で defineComponent が返すクラスのタグ名に型補完を提供するためのヘルパー。module augmentation で `JSX.IntrinsicElements` を拡張する際に使用する。

=== HydrateSetupFunction

```typescript
type HydrateSetupFunction<S extends PropsSchema = PropsSchema> = (
  host: HTMLElement,
  ctx: ComponentContext<S>,
) => void;
```

=== Props 属性→Signal 型変換規則

| PropType | 属性値 → Signal 値 |
|----------|-------------------|
| `String` | そのまま。`null` → デフォルト値 |
| `Number` | `Number(attrValue)`。`null` → デフォルト値 |
| `Boolean` | 属性存在 → `true`、属性不在(`null`) → `false` |
| カスタム関数 | `fn(attrValue)`。`null` もそのまま渡す |

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

=== ADR-005: Props シグナルの即時初期化と型変換

*決定:* コンストラクタで全 props のシグナルを型変換付きで作成し、`attributeChangedCallback` で型変換後に更新する。

*理由:*
1. `connectedCallback` 前に属性が設定される可能性がある
2. シグナルを先に作成することで、setup 関数内から即座にアクセス可能
3. 初期値は `getAttribute()` + 型変換で取得
4. JS property setter も同じシグナルを更新するため、一元管理が必要

=== ADR-006: attrs から props への移行

*決定:* `ComponentOptions.attrs: string[]` を廃止し、`ComponentOptions.props: PropsSchema` に置き換える。`ComponentContext.attrs` を `ComponentContext.props` に変更。

*理由:*
1. `attrs` は文字列配列で型情報が失われるため、TypeScript との統合が弱い
2. `PropsSchema` で型変換を宣言的に記述でき、ランタイムとコンパイル時の両方で型安全性が得られる
3. `InferPropType` により、setup 関数内で `props.count.value` が `number` 型として推論される
4. JS property と HTML attribute の両方からの値設定を統一的に扱える
5. SolidJS の createStore スキーマや Lit の `@property` デコレータと類似のアプローチ

=== ADR-007: 属性→プロパティの一方向同期

*決定:* HTML 属性の変更は自動的にシグナル値を更新するが、シグナル値の変更を HTML 属性に反映することはしない（一方向同期）。

*理由:*
1. 属性→プロパティの自動反映は直感的でフレームワーク利用者の期待に合致
2. プロパティ→属性の反映は `setAttribute` による DOM 変更を引き起こし、パフォーマンスに影響
3. 双方向同期は無限ループのリスクがある
4. 必要に応じて `effect` 内で手動で `setAttribute` できる

=== ADR-008: ComponentElement 型ヘルパーと module augmentation

*決定:* `ComponentElement<C>` ヘルパー型と `JSX.IntrinsicElements` の `interface`（`type` ではなく）を使い、ユーザーが module augmentation で型補完を追加できるようにする。

*理由:*
1. `type` はマージ不可だが、`interface` は declaration merging で拡張可能
2. ユーザーはコンポーネント定義ファイル内で直接型を拡張できる
3. 使用例:
  ```typescript
  const MyCounter = defineComponent("my-counter", setup, { props: schema });
  declare module "@dathomir/core/jsx-runtime" {
    interface IntrinsicElements {
      "my-counter": ComponentElement<typeof MyCounter>;
    }
  }
  ```

=== ADR-009: 関数コンポーネントサポート

*決定:* `defineComponent` の第2引数に Setup 関数 `(host, ctx) => Node` だけでなく、関数コンポーネント `(props) => Node` も渡せるようにする。`setup.length < 2` かつ `options.props` が定義されている場合に関数コンポーネントと判定し、内部でアダプターにラップする。

*理由:*
1. 既存の関数コンポーネント（例: `Counter({ initialCount }) => JSX`）をそのまま Web Component 化できる
2. `(host, ctx) => { ctx.props.foo.value }` パターンは冗長で、特に初期値としてのみ使用する場合に不必要な複雑さがある
3. SolidJS スタイルで関数コンポーネントは1回だけ実行されるため、props は初期値として渡すだけで十分
4. 既存の `SetupFunction` パターンとの互換性を維持（`setup.length >= 2` は従来通り）
5. `options.props` 未指定時は `(host) => ...` のような1引数 setup 関数として扱い、誤検出を防ぐ

*アダプター処理:*
1. `options.props` スキーマのキーを列挙
2. 各 prop について `ctx.props[key].value` を読み取り、プレーンなオブジェクトに変換
3. 変換後のオブジェクトを関数コンポーネントに渡す

*型定義:*
```typescript
type FunctionComponent<S extends PropsSchema = PropsSchema> = (
  props: { [K in keyof S]?: InferPropType<S[K]> },
) => Node | DocumentFragment | string;
```

*使用例:*
```typescript
import { Counter } from "./Counter";
defineComponent("my-counter", Counter, {
  props: { initialCount: { type: Number, default: 0, attribute: "initial" } },
  styles: [counterStyles],
});
```

== テストケース

1. カスタム要素を正しく定義する
2. Shadow DOM が生成される
3. `setup` 関数が呼ばれる
4. `adoptedStyleSheets` にスタイルが適用される
5. props スキーマから observedAttributes が自動生成される
6. props シグナルが正しい型変換で初期化される（String, Number, Boolean）
7. 属性変更が型変換後にシグナルに反映される
8. JS property setter で直接値をシグナルに設定できる
9. Boolean 型は属性の存在/不在で true/false になる
10. default 値が未設定の属性に適用される
11. `disconnectedCallback` で cleanup が実行される
12. DSD が存在する場合にハイドレーションモードで動作する
13. DSD 非対応ブラウザで `<template>` がフォールバック展開される
14. SSR 環境でレジストリに登録される
15. `__tagName__` と `__propsSchema__` が返されるクラスに付与される
16. Component Class を `renderDSD` の引数として使用できる
17. `ComponentElement<typeof MyComp>` でカスタム要素の props 型が推論される
