= insertion API

#import "../../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

DOM ノードの挿入と追加を行うユーティリティ関数を提供する。

== 関数

=== `append`

```typescript
function append(parent: Node, child: Node): void
```

親ノードの末尾に子ノードを追加する。`parent.appendChild(child)` のラッパー。

=== `insert`

```typescript
function insert(
  parent: Node,
  child: Node | (() => DocumentFragment) | unknown,
  anchor: Node | null
): void
```

アンカーノードの前に子ノードを挿入する。`anchor` が `null` の場合は末尾に追加する。

`child` の型:
- `Node`: 単一のノード
- `() => DocumentFragment`: DocumentFragment を返すファクトリー関数
- `unknown`: その他の値（文字列化してテキストノードに変換）

== Hydration対応の動作仕様

`insert` 関数は SSR/Hydration に対応した動的挿入を実行する。

=== 初回呼び出し（Hydration時）

SSR で生成された既存コンテンツを削除してから新しいコンテンツを挿入する。

1. `anchor` の `nextSibling` を取得
2. 次のマーカー（`<!--dh:...-->`）または親の終端まで削除
3. 新しいコンテンツを `anchor` の後ろに挿入
4. 挿入したノードを `WeakMap` で追跡

=== 2回目以降の呼び出し（リアクティブ更新）

前回挿入したコンテンツを削除してから新しいコンテンツを挿入する。

1. `WeakMap` から前回挿入したノードリストを取得
2. すべてのノードを DOM から削除
3. 新しいコンテンツを `anchor` の後ろに挿入
4. 挿入したノードを `WeakMap` で追跡（上書き）

== 設計判断

#adr[
  *ADR: WeakMap による挿入追跡*

  *背景*: `templateEffect` 内で `insert` が再実行されるとき、前回挿入した DOM を削除する必要がある。

  *決定*: `WeakMap<Node, Node[]>` で `anchor` ごとに挿入済みノードを追跡。
  - `anchor` が削除されれば WeakMap から自動で消える（メモリリーク防止）
  - 初回呼び出しでは SSR コンテンツを削除、2回目以降は追跡されたノードを削除
]

#adr[
  *ADR: SSR コンテンツの削除ロジック*

  *背景*: SSR では `<!--marker-->content` のようにマーカーの後に初期コンテンツがある。Hydration 時にこれを削除する必要がある。

  *決定*: 初回呼び出しで `anchor.nextSibling` を削除（シンプルな実装）。
  - 次の Hydration マーカー（`<!--dh:...-->`）まで削除
  - コメントノードがマーカーであれば停止（ネストされた動的コンテンツの境界）
]

#adr[
  *ADR: 複数の child 型のサポート*

  *背景*: ファクトリー関数や予期しない値を渡されるケースに対応したい。

  *決定*:
  - `DocumentFragment`: そのまま挿入（children を追跡）
  - `Node`: 単一ノード挿入
  - `() => DocumentFragment`: 呼び出してから挿入
  - その他: `String(value)` でテキストノードに変換（DEV モードで警告）
]

- 単純なラッパーだが、Runtime API の一貫性のために提供
- SSR/Hydration 対応により複雑な挿入ロジックを内包
