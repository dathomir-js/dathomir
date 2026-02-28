= hydrate API

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

SSR で生成された DOM を再利用し、リアクティビティとイベントを接続する（Hydration）。

== 関数

=== `hydrateRoot`

```typescript
function hydrateRoot(
  root: ShadowRoot,
  setup: (ctx: HydrationContext) => void
): RootDispose | null
```

SSR 生成の `ShadowRoot` を Hydrate する。

- `WeakMap` で二重 Hydration を防止（冪等性保証）
- `createRoot` で cleanup スコープを作成
- 状態スクリプト（`<script data-dh-state>`）をパースして初期状態を復元

=== `hydrate`

```typescript
function hydrate(
  root: ShadowRoot,
  bindings: {
    texts?: Map<number, () => unknown>;
    events?: Map<Element, Map<string, EventListener>>;
  }
): RootDispose | null
```

テキストバインディングとイベントバインディングを接続する簡易 Hydrate API。

=== `createHydrationContext`

```typescript
function createHydrationContext(root: ShadowRoot): HydrationContext
```

Hydration コンテキストを作成する。状態解析とマーカー収集を行う。

=== `handleMismatch`

```typescript
function handleMismatch(message: string): boolean
```

Hydration ミスマッチの処理。開発モードでは `HydrationMismatchError` を投げ、本番モードでは警告を出して CSR フォールバックを許可する。

=== `isHydrated` / `markHydrated`

冪等性管理ユーティリティ。`WeakMap` で ShadowRoot の Hydration 状態を追跡する。

== 型定義

```typescript
interface HydrationContext {
  state: StateObject | null;
  walker: TreeWalker;
  markers: MarkerInfo[];
  markerIndex: number;
  textHandlers: Map<number, () => unknown>;
  eventHandlers: Map<Element, Map<string, EventListener>>;
}
```

== 設計判断

- `WeakMap` による冪等性保証で、同一 ShadowRoot の二重 Hydration を防止
- `createRoot` スコープで管理し、dispose 時に全リスナーを自動クリーンアップ
- `__DEV__` フラグで開発/本番の挙動を分岐
