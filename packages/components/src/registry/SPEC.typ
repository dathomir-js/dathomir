#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

= SSR Web Component Registry

== 目的

SSR 環境で Web Components のメタデータを管理するためのグローバルレジストリ。`defineComponent` が SSR で呼ばれた際、コンポーネントの setup 関数、CSS、PropsSchema を登録し、SSR レンダラーがこれを参照して Declarative Shadow DOM を生成する。

== インターフェース仕様

#interface_spec(
  name: "SSR registry API",
  summary: [
    SSR 用に Web Component のメタデータを登録・参照・初期化する API 群。
  ],
  format: [
    ```typescript
    function registerComponent(
      tagName: string,
      setup: SetupFunction,
      cssTexts: readonly string[],
      propsSchema?: PropsSchema,
      hydrationMetadata?: ComponentHydrationMetadata,
    ): void

    function getComponent(tagName: string): ComponentRegistration | undefined

    function hasComponent(tagName: string): boolean

    function clearRegistry(): void

    interface ComponentRegistration {
      readonly tagName: string;
      readonly setup: SetupFunction;
      readonly cssTexts: readonly string[];
      readonly propsSchema?: PropsSchema;
      readonly hydrationMetadata?: ComponentHydrationMetadata;
    }

    interface ComponentHydrationMetadata {
      readonly kind: "generic-plan";
      readonly planFactory?: unknown;
      readonly unsupportedReason?: string;
    }
    ```
  ],
  constraints: [
    - `registerComponent()` はグローバル Map に `tagName -> ComponentRegistration` を保存する
    - 既存の `tagName` は上書きされる
    - `getComponent()` は未登録時に `undefined` を返す
    - `hasComponent()` は登録有無のみを返す
    - `clearRegistry()` はテスト用であり、全エントリを削除する
    - registry は SSR 環境でのみ使用する
    - compiler-generated hydration plan を持つ component は SSR registry に hydration metadata を登録できる
  ],
  examples: [
    ```typescript
    import { registerComponent, getComponent, hasComponent } from "@/registry/implementation";

    registerComponent(
      "my-counter",
      (host, ctx) => document.createElement("div"),
      [":host { display: block; }"],
      { initial: { type: Number, default: 0 } }
    );

    const registration = getComponent("my-counter");

    if (hasComponent("my-counter")) {
      clearRegistry();
    }
    ```
  ],
)

== 機能仕様

#feature_spec(
  name: "registry management",
  summary: [
    SSR レンダラーと defineComponent の間で共有されるコンポーネント登録情報を一元管理する。
  ],
  api: [
    - `registerComponent()` は setup、CSS テキスト、PropsSchema をまとめて登録する
    - compiler-generated hydration metadata があれば setup と一緒に登録する
    - `getComponent()` は登録済みのメタデータを返す
    - `hasComponent()` は存在確認のみを行う
    - `clearRegistry()` はテスト後の状態リセットに使う
  ],
  test_cases: [
    1. `registerComponent()` が正しく登録する
    2. `getComponent()` が登録済みコンポーネントを返す
    3. `getComponent()` が未登録タグで `undefined` を返す
    4. `hasComponent()` が存在チェックする
    5. `hasComponent()` が未登録タグで `false` を返す
    6. `clearRegistry()` が全エントリを削除する
    7. 同じ tagName で登録すると上書きされる
    8. compiler-generated hydration metadata を登録して取得できる
    9. plan 非対応 component は unsupported reason を持つ metadata か metadata なしで登録できる
  ],
)

#feature_spec(
  name: "hydration metadata source of truth",
  summary: [
    compiler-generated hydration metadata は component definition object を source of truth とし、SSR registry はそれをミラーして renderer へ渡す。
  ],
  edge_cases: [
    - CSR runtime は registry に依存せず component definition から hydration metadata を読める必要がある
    - SSR renderer は registry から hydration metadata を読める必要がある
    - definition object と registry metadata がズレる経路は作らない
  ],
  test_cases: [
    - definition object に付いた hydration metadata を `registerComponent()` がそのまま保存できる
    - SSR renderer は registry から hydration metadata を取得できる
    - CSR runtime は definition object から hydration metadata を取得できる
  ],
  impl_notes: [
    - `defineComponent` は transform 生成コードが definition object へ付与した metadata を SSR registration と CSR runtime 両方へ流す
    - registry は source of truth ではなく SSR-side cache/mirror として扱う
  ],
)

#behavior_spec(
  name: "vertical slice: hydration metadata mirroring",
  summary: [
    transform が component definition object へ付与した `planFactory` または `unsupportedReason` は、SSR registration を経由して renderer にも同じ内容で渡る。
  ],
  preconditions: [
    - component definition object が hydration metadata を持つ
    - `defineComponent` の SSR path が `registerComponent()` を呼ぶ
  ],
  steps: [
    1. transform 生成コードは definition object に hydration metadata を static field として付与する
    2. `defineComponent` の SSR path はその metadata を `registerComponent()` に渡す
    3. SSR renderer は registry から同 metadata を取得できる
  ],
  postconditions: [
    - CSR/SSR で hydration metadata source が分岐しない
    - registry は definition object metadata の mirror として振る舞う
  ],
)

#adr(
  header("SSR registry は compiler-generated hydration metadata も保持する", Status.Proposed, "2026-03-18"),
  [
    generic setup hydration plan を SSR/CSR 間で一致させるには、component definition に付いた hydration metadata を registry からも参照できる必要がある。
  ],
  [
    `registerComponent()` は setup / CSS / propsSchema に加えて optional hydration metadata も保持し、SSR 側 diagnostics や renderer から参照できるようにする。
  ],
  [
    - `defineComponent` の SSR 登録経路を大きく変えずに hydration plan 情報を運べる
    - plan 非対応 component は metadata なしで従来どおり扱える
    - metadata の具体型は components/runtime/transformer 間で別途詰める必要がある
  ],
)

== 設計判断

#adr(
  header("グローバル Map による管理", Status.Accepted, "2026-03-09"),
  [
    SSR は単一プロセスで動作し、`defineComponent` からの登録と SSR レンダラーからの参照を共有する必要がある。
  ],
  [
    Web Component のメタデータをモジュールレベルの Map で管理する。
  ],
  [
    - `defineComponent` と SSR レンダラーを疎結合に保てる
    - 検索性能は O(1)
    - テスト時は `clearRegistry()` による状態リセットが必要
  ],
)

#adr(
  header("SSR 専用 API", Status.Accepted, "2026-03-09"),
  [
    registry は Declarative Shadow DOM 生成のためだけに必要で、CSR 側では customElements.define() が直接登録を担う。
  ],
  [
    registry は SSR 環境でのみ使用し、CSR では空のままとする。
  ],
  [
    - CSR ビルドでは Tree shaking により除去しやすい
    - `defineComponent` は SSR 判定時のみ `registerComponent` を呼ぶ
  ],
)

#adr(
  header("上書き可能な登録", Status.Accepted, "2026-03-09"),
  [
    HMR やテストでは同じ tagName を繰り返し登録するケースがある。
  ],
  [
    同じ tagName で複数回 `registerComponent` を呼ぶと、最新の登録で上書きする。
  ],
  [
    - 再登録時に例外を投げず柔軟に扱える
    - 意図しない上書きには注意が必要
  ],
)
