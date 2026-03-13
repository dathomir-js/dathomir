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
    - `createRoot` スコープで管理し、dispose 時に全リスナーを自動クリーンアップ
    - `__DEV__` フラグで開発/本番の挙動を分岐
    - `state` は `parseStateScript` が `null` を返した場合に `\{\}` でフォールバック（`null` は保持しない）
    - `options.store` がある場合は hydration setup 全体をその store boundary 内で実行する
    - `options.storeSnapshotSchema` がある場合は `data-dh-store` script を parse し、setup 実行前に `storeSnapshotSchema.hydrate(store, snapshot)` を行う
    - `storeSnapshotSchema` を指定する場合は `store` も必須とする
    - `HydrationMismatchError`、`hydrateTextMarker` は公開 API として export される
    - `nextMarker` は実装内部ユーティリティとして非公開（export しない）
  ],
)
