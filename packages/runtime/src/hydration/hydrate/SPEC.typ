= hydrate API

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

SSR で生成された DOM を再利用し、リアクティビティとイベントを接続する（Hydration）。

== 機能仕様

#feature_spec(
  name: "HydrationMismatchError",
  summary: [
    Hydration ミスマッチを表すカスタムエラークラス。メッセージに `"Hydration mismatch"` プレフィックスを付与する。
  ],
  api: [
    ```typescript
    class HydrationMismatchError extends Error \{
      name: "HydrationMismatchError";
      constructor(message: string);
    \}
    ```
  ],
  test_cases: [
    - Error のインスタンスである
    - 正しい name を持つ
    - 正しいメッセージプレフィックスを持つ
  ],
)

#feature_spec(
  name: "handleMismatch",
  summary: [
    Hydration ミスマッチの処理。開発モード（`__DEV__`）では `HydrationMismatchError` を投げて処理を中断し、本番モードでは警告を出して `false` を返し CSR フォールバックを許可する。
  ],
  api: [
    ```typescript
    function handleMismatch(
      message: string,
      details?: \{
        markerId?: number;
        markerType?: string;
        expected?: string;
        actual?: string;
      \}
    ): boolean
    ```
  ],
  test_cases: [
    - dev モードで HydrationMismatchError を投げる
    - 本番モードで警告し false を返す
  ],
)

#feature_spec(
  name: "isHydrated / markHydrated",
  summary: [
    冪等性管理ユーティリティ。`WeakMap` で ShadowRoot の Hydration 状態を追跡する。
  ],
  api: [
    ```typescript
    function isHydrated(root: ShadowRoot): boolean
    function markHydrated(root: ShadowRoot): void
    ```
  ],
  test_cases: [
    - 新しい ShadowRoot に対して false を返す
    - markHydrated 後に true を返す
  ],
)

#feature_spec(
  name: "hydrateRoot",
  summary: [
    SSR 生成の `ShadowRoot` を Hydrate する。`WeakMap` で二重 Hydration を防止（冪等性保証）し、`createRoot` で cleanup スコープを作成する。状態スクリプト（`<script data-dh-state>`）をパースして初期状態を復元する。closed ShadowRoot は Hydrate 不可。
  ],
  api: [
    ```typescript
    function hydrateRoot(
      root: ShadowRoot,
      setup: (ctx: HydrationContext) => void,
      options?: \{
        store?: AtomStore;
        storeSnapshotSchema?: AtomStoreSnapshot<
          Record<string, PrimitiveAtom<unknown>>
        >;
      \}
    ): RootDispose | null
    ```

    - `root`: Hydrate 対象の ShadowRoot
    - `setup`: Hydration コンテキストを受け取るセットアップ関数
    - `options.store`: request-scoped な AtomStore
    - `options.storeSnapshotSchema`: store snapshot のスキーマ（`store` と併用必須）
    - 戻り値: cleanup 用の dispose 関数、または Hydrate 不可の場合 `null`
  ],
  test_cases: [
    - ShadowRoot をハイドレートする
    - ハイドレート済みの root に null を返す（冪等性）
    - dispose 関数を返しクリーンアップする
    - request-scoped store をハイドレーションコンテキストに渡す
    - schema 提供時に setup 実行前に store snapshot をハイドレート
    - storeSnapshotSchema を store なしで渡すとエラーを投げる
  ],
)

#feature_spec(
  name: "hydrateIslands",
  summary: [
    `data-dh-island` / `data-dh-island-value` metadata を持つ component host を走査し、strategy ごとに hydration を遅延実行する。`load`, `visible`, `idle`, `interaction`, `media` をサポートし、同一 island の二重起動を防ぐ。
  ],
  api: [
    ```typescript
    function hydrateIslands(
      root?: Document | ShadowRoot | Element
    ): () => void
    ```

    - `root`: islands を探索する起点。省略時は `document`
    - 戻り値: 未発火 strategy の observer / listener / timer を解除する cleanup 関数
  ],
  test_cases: [
    - `load` strategy は `window.load` 後に hydrate する
    - `visible` strategy は `IntersectionObserver` 発火前は hydrate しない
    - `idle` strategy は `requestIdleCallback` で hydrate し、API がない場合は timeout fallback で hydrate する
    - `interaction` strategy は指定 event で hydrate し、値欠如時は `click` を使う
    - `media` strategy は media query が match した時に hydrate する
    - browser API がない strategy は fail-open で即 hydrate する
    - 同一 island を複数回 scan しても二重 hydrate しない
    - pending schedule は cleanup 関数または `cancelScheduledIslandHydration()` で cancel でき、後続 scan で再 schedule できる
    - open ShadowRoot 内の island も再帰的に検出する
  ],
  impl_notes: [
    - custom element 側は runtime が呼ぶ internal hydration hook を host instance に公開する
    - browser API が未提供の strategy は fail-open で即 hydrate する
    - strategy 発火後は observer / listener を即解除する
    - `@dathomir/components` 連携のため `HYDRATE_ISLANDS_HOOK` / `HYDRATE_ISLANDS_STATUS` / `cancelScheduledIslandHydration()` と関連型を hydration package から export する
  ],
)

#feature_spec(
  name: "colocated client handler hydration MVP (proposal)",
  summary: [
    transformer が付与した target strategy metadata と marker を使い、`load:onClick` / `interaction:onClick` を render replay ベースで有効化する。
  ],
  test_cases: [
    - `load` strategy では host setup 実行後に target button click handler が有効になる
    - `interaction` strategy では初回 click 後に host setup を実行し、その click を target button へ replay する
    - target marker が見つからない場合は replay をスキップしつつ hydrate 自体は継続する
    - host dispose 時に pending replay state を cleanup する
    - v1 capture 制約で生成された transform output だけを前提にする
  ],
  impl_notes: [
    - MVP では compiler-generated action plan registry を持たず、CSR setup で通常の `onClick` binding を再生成する
    - runtime は interaction trigger event を一時保持し、host setup 後に `data-dh-client-target` marker を持つ button へ synthetic click を再配送する
    - capture validation 自体は compiler が担い、runtime は validated output だけを実行する
  ],
)

#feature_spec(
  name: "hydrate",
  summary: [
    テキストバインディングとイベントバインディングを接続する簡易 Hydrate API。
  ],
  api: [
    ```typescript
    function hydrate(
      root: ShadowRoot,
      bindings: \{
        texts?: Map<number, () => unknown>;
        events?: Map<Element, Map<string, EventListener>>;
      \},
      options?: \{
        store?: AtomStore;
        storeSnapshotSchema?: AtomStoreSnapshot<
          Record<string, PrimitiveAtom<unknown>>
        >;
      \}
    ): RootDispose | null
    ```
  ],
  test_cases: [
    - テキストバインディングをマーカーに接続
    - イベントバインディングを要素に接続
    - ハイドレート済みの root に null を返す
    - request-scoped store オプションを受け取る
    - data-dh-store script から store 値をハイドレート
    - data-dh-store script がない場合は store 値をそのままにする
  ],
)

#feature_spec(
  name: "closed ShadowRoot の処理",
  summary: [
    closed ShadowRoot は Hydration 対象外。DEV モードで `console.warn` を出力し `null` を返す。
  ],
  test_cases: [
    - closed ShadowRoot に null を返し警告する
  ],
)

#feature_spec(
  name: "hydrateTextMarker",
  summary: [
    テキストマーカー直後のテキストノードをリアクティブに更新する。`templateEffect` を使用して値の変更を自動反映する。
  ],
  api: [
    ```typescript
    function hydrateTextMarker(
      marker: MarkerInfo,
      getValue: () => unknown
    ): void
    ```
  ],
  test_cases: [
    - マーカー後のテキストノードをリアクティブに更新
  ],
)

#feature_spec(
  name: "createHydrationContext",
  summary: [
    Hydration コンテキストを作成する。状態解析とマーカー収集を行う。`options.store` が指定された場合はコンテキストに store を保持する。
  ],
  api: [
    ```typescript
    function createHydrationContext(
      root: ShadowRoot,
      options?: HydrationOptions
    ): HydrationContext

    interface HydrationOptions \{
      store?: AtomStore;
      storeSnapshotSchema?: AtomStoreSnapshot<
        Record<string, PrimitiveAtom<unknown>>
      >;
    \}

    interface HydrationContext \{
      state: Record<string, unknown>;
      walker: TreeWalker;
      markers: MarkerInfo[];
      markerIndex: number;
      eventHandlers: Map<Element, Map<string, EventListener>>;
      store?: AtomStore;
    \}
    ```
  ],
  impl_notes: [
    - `WeakMap` による冪等性保証で、同一 ShadowRoot の二重 Hydration を防止
    - islands runtime は host metadata `data-dh-island` / `data-dh-island-value` を読み、component host の internal hook を strategy ごとに起動する
    - `createRoot` スコープで管理し、dispose 時に全リスナーを自動クリーンアップ
    - `__DEV__` フラグで開発/本番の挙動を分岐
    - `state` は `parseStateScript` が `null` を返した場合に `\{\}` でフォールバック（`null` は保持しない）
    - `options.store` がある場合は hydration setup 全体をその store boundary 内で実行する
    - `options.storeSnapshotSchema` がある場合は `data-dh-store` script を parse し、setup 実行前に `storeSnapshotSchema.hydrate(store, snapshot)` を行う
    - `storeSnapshotSchema` を指定する場合は `store` も必須とする
    - `HydrationMismatchError`、`hydrateTextMarker`、`hydrateIslands` は公開 API として export される
    - `nextMarker` は実装内部ユーティリティとして非公開（export しない）
  ],
)

== 将来拡張案

#adr(
  header("first interaction replay を hydration runtime が担う", Status.Proposed, "2026-03-16"),
  [
    `interaction:onClick` 系 syntax では「最初の 1 回の event が hydrate trigger だけで消費される」挙動が UX を悪化させる。colocated client handler を導入するなら、初回 event も author の意図した処理へつなげたい。
  ],
  [
    interaction strategy の trigger event と compiler-generated action event が同一の場合、runtime は初回 event を保持し、host hydrate 完了後に target HTML 要素へ replay する。replay 可否は transformer が action plan metadata で示す。
  ],
  [
    - author は「最初の click から効く」感覚で書きやすくなる
    - runtime に event buffering / replay の責務が増える
    - submit や non-bubbling event など replay semantics の難しいケースは別途検討が必要
  ],
)

== 検討事項

- artifact-based action registry を v2 以降でどう導入するか（static field / symbol / hydrate option 拡張）
- target element marker を attribute にするか comment marker/path にするか
- replay 対象 event を click のみに絞るか、input/change/focus まで含めるか
- target 不在や stale marker を dev warning にするか hydration error にするか
- imported helper や module-level binding を将来の capture model に含めるか
- readonly object / tuple の nested serializability をどこまで保証するか
