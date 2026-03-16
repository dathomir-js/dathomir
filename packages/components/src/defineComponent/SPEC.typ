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
      readonly client: ComponentClientContext;
      readonly store: AtomStore;
    }

    interface ComponentClientContext {
      readonly strategy: "load" | "visible" | "idle" | "interaction" | "media" | null;
      readonly value: string | null;
      readonly hydrated: boolean;
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
      readonly "client:load"?: true | "";
      readonly "client:visible"?: true | "";
      readonly "client:idle"?: true | "";
      readonly "client:interaction"?: true | "" | string;
      readonly "client:media"?: string;
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
    - `component` は `host` / `props` / `client` / `store` を持つ単一 context object を受け取る関数コンポーネントである
    - 返り値は callable な `DefinedComponent` であり、`<Counter />` のように JSX 関数コンポーネントとして使える
    - `DefinedComponent.webComponent` は CSR では登録済み `HTMLElement` クラス、SSR では `__tagName__` / `__propsSchema__` を持つプレースホルダークラスを返す
    - JSX helper props 型は compiler-reserved な `client:*` directive を受け入れて transform 入力との型整合を保つが、JSX helper runtime 自体はそれらを DOM へ書き出さない
    - JSX helper runtime は compiler-generated internal client strategy metadata がある場合、host へ `data-dh-island` / `data-dh-island-value` を自動付与できる
    - コンストラクタで props シグナルを型変換付きで初期化し、各 prop に JS property getter / setter を定義する
    - CSR の custom element constructor では current store boundary を host に捕捉する
    - JSX runtime が生成した subtree 内の custom element に対しても current store boundary が伝播する
    - `attribute: false` の prop は属性監視せず、property setter 経由でのみ更新する
    - `connectedCallback` では host に bind 済みの store を解決し、`createRoot` スコープ内で関数コンポーネントを実行する
    - `connectedCallback` と `hydrate` へ渡す context には、host の island metadata を正規化した read-only `client` context を含める
    - `connectedCallback` では local `styles` と `adoptGlobalStyles()` で登録済みの global style を合成し、`adoptedStyleSheets` へ反映する
    - DSD が存在し `hydrate` がある場合は hydrate パス、`hydrate` がない場合は shadowRoot をクリアして再実行する
    - DSD と `hydrate` があり、host が runtime が認識する `data-dh-island` metadata（`load` / `visible` / `idle` / `interaction` / `media`）を持つ場合は `connectedCallback` で即 hydrate せず、runtime `hydrateIslands()` が呼ぶ internal hook を host に公開して遅延 hydrate する
    - compiler-generated colocated client handler を持つ component は render ベースの setup を hydrate entrypoint とし、`interaction` では初回 click 後に root setup を実行して event replay する
    - DSD に SSR `<style>` が存在し、CSR で `adoptedStyleSheets` を適用する場合は `<style>` を除去して重複適用を避ける
    - `disconnectedCallback` では `dispose` により cleanup を実行する
    - SSR では `getCssText()`、`registerComponent()`、`ensureComponentRenderer()` を用いて SSR 情報を登録する
    - 属性から Signal への型変換は `String` / `Number` / `Boolean` / カスタム関数の規則に従い、初期化時と属性変更時で同じ coercion 規則を使う。`Number` では `null` を `Number(null)` にせずデフォルト値へフォールバックする
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
  header("islands metadata を持つ host の hydrate は runtime scheduler に委譲する", Status.Accepted, "2026-03-16"),
  [
    Phase 0 / Pillar 2 では component 自体の hydrate 実装は維持しつつ、`client:*` directive 由来 metadata に応じて hydration のタイミングだけを遅延制御する必要がある。
  ],
  [
    runtime が認識する `data-dh-island` metadata を持つ host は `connectedCallback` で即 hydrate せず、runtime `hydrateIslands()` が呼ぶ internal hook を instance 上へ登録して strategy 発火時に hydrate する。未知の値は island とみなさず通常 hydrate にフォールバックする。
  ],
  [
    - Web Component 自身が ShadowRoot hydration の責務を持つ ADR と両立できる
    - scheduler 実装を runtime 側へ閉じ込められる
    - island でない component の既存 hydrate/setup フローを壊さない
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
  header("global style は component local style より前に合成する", Status.Accepted, "2026-03-15"),
  [
    design token / typography / reset のような global style は複数 component で共有したいが、component 固有 style で上書きできる余地も残す必要がある。
  ],
  [
    `defineComponent` は `adoptGlobalStyles()` で登録済みの global style を local `styles` より前に `adoptedStyleSheets` へ並べる。重複する style は 1 回だけ採用する。
  ],
  [
    - shared style の優先順位が安定する
    - component 固有 style は後段で override しやすい
    - local/global の同一 style 重複を避けられる
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
  header("client metadata は ComponentContext から読めるようにする", Status.Proposed, "2026-03-16"),
  [
    `client:*` を host metadata へ正規化するだけでは component author から hydration strategy の意図が見えづらく、colocated client handler 設計とも接続しにくい。
  ],
  [
    `ComponentContext` / hydrate context に `client` object を追加し、strategy / value / hydrated を読み取れるようにする。`client` は host の island metadata を runtime が正規化した read-only view とし、unknown metadata は `null` として扱う。
  ],
  [
    - render と hydrate の両方から client strategy を同じ mental model で参照できる
    - bare host-level `client:*` と将来の colocated client handlers を同じ context surface へ寄せられる
    - existing `props` / `store` 中心 API と整合する
  ],
)

#adr(
  header("compiler-generated client handlers も defineComponent host 境界へ集約する", Status.Proposed, "2026-03-16"),
  [
    colocated client handler syntax を導入しても、runtime scheduler と cleanup は Web Component host 単位で管理した方が既存 island 設計と両立しやすい。
  ],
  [
    `<strategy>:on<Event>` は target HTML 要素に直接 hydrate 境界を作らず、transformer が target marker と strategy metadata を埋め込む。`defineComponent` host は DSD 接続時に shadowRoot 内 metadata を読んで island 境界へ集約する。
  ],
  [
    - scheduler / cleanup / store boundary を host 単位で維持できる
    - native element 単位の sub-island を runtime へ増やさずに済む
    - element-level syntax と host-level execution model を両立できる
  ],
)

#adr(
  header("colocated client handlers MVP は render replay で実現する", Status.Proposed, "2026-03-16"),
  [
    将来は compiler-generated action plan を個別 bind する設計を見据えるが、まず UX を検証できる MVP が必要である。現行 runtime / transformer の構造では host setup を hydrate entrypoint に再利用する方が変更範囲を抑えやすい。
  ],
  [
    MVP では `load:onClick` / `interaction:onClick` を compiler が target marker + strategy metadata へ変換し、component は DSD を保持したまま strategy 発火後に root setup を再実行する。`interaction` では trigger click 後に host subtree の target button へ synthetic click を replay する。
  ],
  [
    - MVP を比較的短い変更で動かせる
    - SSR DSD を部分再利用するのではなく、hydrate 時に client render へ切り替える
    - `hydrate` option と共存させるには別の artifact-based 設計が必要になる
  ],
)

#adr(
  header("colocated client handler の capture は v1 で厳格に制限する", Status.Proposed, "2026-03-16"),
  [
    colocated syntax は author 体験を改善する一方で、任意の closure capture を許すと compiler / runtime の責務が急激に肥大化する。
  ],
  [
    MVP 実装は render replay ベースで inline handler 自体を setup に残すが、artifact-based action extraction へ進む v2 では compiler-generated client handler が参照できる外側値を `props`, `store`, signal, serializable で不変な local `const` に限定する。serializable local `const` には primitive literal、primitive-only template literal、readonly tuple、readonly object literal を含める。
  ],
  [
    - MVP の後でも capture model の拡張方針をぶらさずに進められる
    - `ctx.client` / `ctx.store` を中心に mental model を揃えやすい
    - imported helper や class instance capture は将来拡張として切り出せる
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
    25. `adoptGlobalStyles()` で登録した global style が `adoptedStyleSheets` に含まれる
    26. component 接続後に `adoptGlobalStyles()` を呼んでも既存 ShadowRoot へ style が反映される
     27. component が切断されている間は global style 更新を受け取らず、再接続時に最新の style 集合へ再同期する
     28. custom coercer prop は属性未指定の初期化時も属性除去時も同じ `null` 入力規則で評価される
     29. DSD hydration 時に SSR `<style>` を除去し、global/local の `adoptedStyleSheets` へ置き換える
     30. `data-dh-island` を持つ DSD component は `connectedCallback` で hydrate せず、`hydrateIslands()` の strategy 発火後に hydrate する
     31. JSX helper で `client:*` directive を書いても型エラーにならず、runtime では DOM attribute として書き出されない
     32. `ctx.client` から island strategy / value / hydrated 状態を読める
     33. colocated client handler MVP は host-level island metadata により setup を遅延実行する
     34. artifact-based client handler へ進む段階では capture model を `props` / `store` / signal / serializable local `const` へ制限する
     35. `interaction:onClick` は host setup 完了後に target click を replay する
  ],
)
