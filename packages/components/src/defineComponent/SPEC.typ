#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

= defineComponent

== インターフェース仕様

#interface_spec(
  name: "defineComponent API",
  summary: [
    Web Components を宣言的に定義するための高レベル API。Shadow DOM のセットアップ、`createRoot` ライフサイクル管理、Declarative Shadow DOM（DSD）のハイドレーション検出、`adoptedStyleSheets`、属性のリアクティブシグナル反映を自動化する。
  ],
  format: [
    *公開関数*:
    ```typescript
    function defineComponent<const S extends PropsSchema = {}>(
      tagName: string,
      component: FunctionComponent<S>,
      options?: ComponentOptions<S>,
    ): DefinedComponent<S>
    ```

    *主要型*:
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

    type InferPropType<D extends PropDefinition> =
      D extends { type: StringConstructor } ? string :
      D extends { type: NumberConstructor } ? number :
      D extends { type: BooleanConstructor } ? boolean :
      D extends { type: (v: string | null) => infer R } ? R :
      unknown;

    type InferProps<S extends PropsSchema> = {
      readonly [K in keyof S]: Signal<InferPropType<S[K]>>;
    };

    type FunctionComponent<S extends PropsSchema = PropsSchema> = (
      ctx: ComponentContext<S>,
    ) => Node | DocumentFragment | string;

    interface ComponentContext<S extends PropsSchema = PropsSchema> {
      readonly host: HTMLElement;
      readonly props: Readonly<InferProps<S>>;
      readonly store: AtomStore;
    }

    interface ComponentOptions<S extends PropsSchema = PropsSchema> {
      styles?: readonly (CSSStyleSheet | string)[];
      props?: S;
      hydrate?: HydrateSetupFunction<S>;
    }

    type ComponentConstructor<S extends PropsSchema = PropsSchema> = {
      new(): HTMLElement & { [K in keyof S]: InferPropType<S[K]> };
      readonly prototype: HTMLElement;
    } & ComponentClass<S>;

    interface ComponentMetadata<S extends PropsSchema = PropsSchema> {
      readonly __tagName__: string;
      readonly __propsSchema__?: S;
    }

    interface ComponentClass<S extends PropsSchema = PropsSchema> extends Function, ComponentMetadata<S> {}

    type JSXPropValue<T> = T | { readonly value: T };

    type JSXComponentProps<S extends PropsSchema = PropsSchema> = {
      readonly [K in keyof S]?: JSXPropValue<InferPropType<S[K]>>;
    } & {
      readonly children?: unknown;
    };

    type JSXComponent<S extends PropsSchema = PropsSchema> = (
      props: JSXComponentProps<S> | null,
    ) => Node;

    interface DefinedComponent<S extends PropsSchema = PropsSchema>
      extends ComponentMetadata<S> {
      (props: JSXComponentProps<S> | null): Node;
      readonly webComponent: ComponentConstructor<S>;
      readonly jsx: JSXComponent<S>;
    }

    type ComponentElement<C> =
      C extends ComponentMetadata<infer S>
        ? JSXComponentProps<S>
        : Record<string, unknown>;

    type HydrateSetupFunction<S extends PropsSchema = PropsSchema> = (
      ctx: ComponentContext<S>,
    ) => void;
    ```
  ],
  constraints: [
    - `tagName` は custom element 規約に従いハイフンを含む
    - `component` は `host` / `props` / `store` を持つ単一 context object を受け取る関数コンポーネントである
    - 返り値は callable な `DefinedComponent` であり、`<Counter />` のように JSX 関数コンポーネントとして使える
    - `DefinedComponent.webComponent` は CSR では登録済み `HTMLElement` クラス、SSR では `__tagName__` / `__propsSchema__` を持つプレースホルダークラスを返す
    - コンストラクタで props シグナルを型変換付きで初期化し、各 prop に JS property getter / setter を定義する
    - CSR の custom element constructor では current store boundary を host に捕捉する
    - JSX runtime が生成した subtree 内の custom element に対しても current store boundary が伝播する
    - `attribute: false` の prop は属性監視せず、property setter 経由でのみ更新する
    - `connectedCallback` では host に bind 済みの store を解決し、`createRoot` スコープ内で関数コンポーネントを実行する
    - DSD が存在し `hydrate` がある場合は hydrate パス、`hydrate` がない場合は shadowRoot をクリアして再実行する
    - `disconnectedCallback` では `dispose` により cleanup を実行する
    - SSR では `getCssText()`、`registerComponent()`、`ensureComponentRenderer()` を用いて SSR 情報を登録する
    - 属性から Signal への型変換は `String` / `Number` / `Boolean` / カスタム関数の規則に従い、`Number` では `null` を `Number(null)` にせずデフォルト値へフォールバックする
  ],
)

== 設計判断

#adr(
  header("createRoot による cleanup スコープ", Status.Accepted, "2026-03-09"),
  [
    Web Component のライフサイクルに effect cleanup を統合し、メモリリークを防ぐ必要がある。
  ],
  [
    `connectedCallback` 内で `createRoot` を使い、`disconnectedCallback` で `dispose` する。
  ],
  [
    - effect の自動クリーンアップが保証される
    - reactivity パッケージの Owner/Root パターンと一貫する
  ],
)

#adr(
  header("DSD ハイドレーション検出", Status.Accepted, "2026-03-09"),
  [
    SSR で生成済みの Declarative Shadow DOM を検出し、hydrate パスへ分岐する必要がある。
  ],
  [
    `shadowRoot.childNodes.length > 0` で DSD の存在を判定する。
  ],
  [
    - DSD 対応ブラウザでは ShadowRoot に既存コンテンツが入る
    - `hydrate` オプションがある場合のみハイドレーションモードになる
  ],
)

#adr(
  header("SSR 環境の判定", Status.Accepted, "2026-03-09"),
  [
    SSR では DOM 操作を避け、registry 登録のみ行う必要がある。
  ],
  [
    `typeof window === "undefined"` で SSR を判定する。
  ],
  [
    - Node.js / Edge ランタイムで機能する
    - SSR ではプレースホルダークラス返却で十分になる
  ],
)

#adr(
  header("adoptedStyleSheets パターン", Status.Accepted, "2026-03-09"),
  [
    Shadow DOM へのスタイル適用をメモリ効率よく行い、DSD の `<style>` とも整合させる必要がある。
  ],
  [
    CSS はコンストラクタ内で `adoptedStyleSheets` に適用する。
  ],
  [
    - `<style>` タグより共有効率が良い
    - DSD ハイドレーション時は SSR の `<style>` を置き換えられる
  ],
)

#adr(
  header("Props シグナルの即時初期化と型変換", Status.Accepted, "2026-03-09"),
  [
    `connectedCallback` 前に属性が設定される可能性があり、props へのアクセスを早期に可能にする必要がある。
  ],
  [
    コンストラクタで全 props のシグナルを型変換付きで作成し、`attributeChangedCallback` で型変換後に更新する。
  ],
  [
    - setup から即座に props へアクセスできる
    - property setter と attributeChangedCallback の更新経路を一元化できる
  ],
)

#adr(
  header("attrs から props への移行", Status.Accepted, "2026-03-09"),
  [
    文字列配列の `attrs` だけでは型情報が失われ、TypeScript との統合が弱い。
  ],
  [
    `ComponentOptions.attrs` を廃止し、`ComponentOptions.props: PropsSchema` に置き換える。
  ],
  [
    - ランタイム変換と型推論を同時に扱える
    - JS property と HTML attribute の両方を統一的に扱える
  ],
)

#adr(
  header("属性→プロパティの一方向同期", Status.Accepted, "2026-03-09"),
  [
    属性とシグナルを双方向同期すると、DOM 更新コストと無限ループのリスクが増える。
  ],
  [
    HTML 属性の変更は自動的にシグナル値を更新するが、シグナル値の変更を HTML 属性へは反映しない。
  ],
  [
    - 属性変更は直感的に props へ反映される
    - 属性へ戻す必要がある場合だけ利用者が明示的に `setAttribute` する
  ],
)

#adr(
  header("ComponentElement 型ヘルパーと module augmentation", Status.Accepted, "2026-03-09"),
  [
    TSX で custom element の型補完を提供するには、拡張可能な JSX 型定義が必要である。
  ],
  [
    `ComponentElement<C>` と `JSX.IntrinsicElements` の `interface` を使い、module augmentation で型補完を追加できるようにする。
  ],
  [
    - declaration merging による拡張が可能になる
    - 利用者がコンポーネント定義ファイル内で直接型を拡張できる
  ],
)

#adr(
  header("defineComponent は callable definition object を返す", Status.Accepted, "2026-03-11"),
  [
    custom element class だけを返すと `<my-counter>` 用の module augmentation が別途必要になり、TSX で `Counter` をそのまま書けないため DX が落ちる。
  ],
  [
    `defineComponent` は `webComponent` と `jsx` を持つ callable な `DefinedComponent` を返し、返り値自体を JSX 関数コンポーネントとして使えるようにする。
  ],
  [
    - `const Counter = defineComponent(...)` のまま `<Counter initial={1} />` が書ける
    - SSR では同じ返り値を `renderDSD(Counter, ...)` に渡せる
    - custom element class が必要な場面では `Counter.webComponent` から明示的に参照できる
  ],
)

#adr(
  header("関数コンポーネントのリアクティブ props サポート", Status.Accepted, "2026-03-09"),
  [
    既存の関数コンポーネントを Web Component 化しつつ、props の継続的な変化にも反応できる必要がある。
  ],
  [
    `defineComponent` の第 2 引数として関数コンポーネント `(props) => Node` を受け取り、props をリアクティブなシグナルとして渡す。
  ],
  [
    - 関数は初回レンダリング時に 1 回だけ実行される
    - `.value` と `effect` を通じて props の変化を自動追跡できる
    - 初期段階では `props` だけを使うコンポーネントも、`({ props }) => ...` として簡潔に書ける
  ],
)

#adr(
  header("関数コンポーネントは単一 context object を受け取る", Status.Accepted, "2026-03-10"),
  [
    `props` とは別に `store` や `host` などのコンポーネント実行文脈を追加していくと、多引数 API は拡張時に不安定になりやすい。
  ],
  [
    関数コンポーネントと hydrate 関数は、`host` / `props` / `store` をまとめた単一の `ComponentContext` object を受け取る。
  ],
  [
    - API の将来拡張がしやすくなる
    - `ctx.store` を中心に state access を統一できる
    - props だけを使う場合も object destructuring で簡潔に書ける
  ],
)

#adr(
  header("store binding は components 内部実装で扱う", Status.Accepted, "2026-03-10"),
  [
    `withStore()` の boundary を custom element instance まで運ぶ仕組みは必要だが、利用者に public API として公開すると mental model が複雑になる。
  ],
  [
    current store の捕捉と host への binding は `@dathomir/components` 内部実装に閉じ込め、公開 API には含めない。
  ],
  [
    - 利用者は `withStore()` と `ctx.store` だけを理解すればよい
    - host-to-store binding の実装を将来変更しやすい
    - `@dathomir/store` は atom/store/boundary の public API に集中できる
  ],
)

#adr(
  header("subtree store binding は custom element name 規約で判定する", Status.Accepted, "2026-03-10"),
  [
    JSX runtime が生成した subtree へ store を伝播する際、custom element host を軽量に検出する必要がある。
  ],
  [
    初期バージョンでは tag name にハイフンを含む要素を custom element host とみなし、store binding の対象にする。
  ],
  [
    - HTML Custom Elements の命名規約と一致する
    - `customElements.get()` への依存を避けて軽量に走査できる
    - 将来より厳密な host 判定が必要になった場合の差し替え余地を残せる
  ],
)

#adr(
  header("connectedCallback / attributeChangedCallback のエラーハンドリング", Status.Accepted, "2026-03-09"),
  [
    setup や属性更新処理が例外を投げても、コンポーネントのライフサイクル全体を壊さない必要がある。
  ],
  [
    `connectedCallback` 内の `createRoot` 呼び出しと `attributeChangedCallback` 内のシグナル更新を try-catch で保護する。
  ],
  [
    - 例外時でも `disconnectedCallback` は安全に動作できる
    - 属性更新エラーをログ化しつつ他の処理継続が可能になる
  ],
)

#adr(
  header("attribute: false による属性非監視プロパティ", Status.Accepted, "2026-03-09"),
  [
    SSR から属性として渡せない値や、JS property だけで更新したい props を扱う必要がある。
  ],
  [
    `PropDefinition.attribute: false` の prop は `observedAttributes` に含めず、`getDefaultValue(def)` で初期化する。
  ],
  [
    - `attributeChangedCallback` では更新されない
    - property setter 経由でのみシグナルを更新する
  ],
)

#adr(
  header("DSD 存在時に hydrate なしの場合の再レンダリング", Status.Accepted, "2026-03-09"),
  [
    SSR で生成した DSD をそのまま再利用できず、hydrate 実装も提供されないケースがある。
  ],
  [
    DSD が存在し、かつ `hydrate` オプションが未指定の場合は `shadowRoot.innerHTML = ""` 後に `resolvedSetup` を再実行する。
  ],
  [
    - hydrate なしコンポーネントは毎回クリーンなセットアップを期待できる
    - SSR で描画された DSD コンテンツは CSR 初期化時に意図的に破棄される
  ],
)

== 機能仕様

#feature_spec(
  name: "defineComponent test coverage",
  summary: [
    defineComponent の主な責務である custom element 定義、Props 型変換、DSD ハイドレーション、SSR 連携、cleanup を検証する。
  ],
  test_cases: [
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
    15. `defineComponent()` の返り値が `webComponent` と `jsx` を持つ callable object になる
    16. `__tagName__` と `__propsSchema__` が返り値に付与される
    17. `DefinedComponent.webComponent` を `renderDSD` の引数として使用できる
    18. `ComponentElement<typeof MyComp>` で JSX props 型が推論される
    19. 返り値自体を JSX 関数コンポーネントとして使うと host props / children が custom element に渡る
    20. Number 型の prop: `null` 属性値はデフォルト値を使用する（`Number(null)` = 0 を使わない）
    21. `setup` 関数がエラーを投げても `#dispose` が安全に扱われる（再接続時も動作）
    22. `withStore()` 内で生成された custom element が `ctx.store` から同じ store instance を受け取る
    23. nested `withStore()` で生成された custom element は内側の store instance を受け取る
    24. `withStore()` 内の JSX subtree に含まれる nested custom element も store instance を受け取る
  ],
)
