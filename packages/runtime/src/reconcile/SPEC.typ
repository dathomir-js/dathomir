= reconcile API

#import "../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

Keyed リストの効率的な差分更新を行う。既存ノードの再利用・移動・追加・削除を最小限の DOM 操作で実行する。

== 関数

=== `reconcile`

```typescript
function reconcile<T>(
  parent: Node,
  items: T[],
  keyFn: ((item: T) => unknown) | undefined,
  createFn: (item: T, index: number) => Node,
  updateFn?: (node: Node, item: T, index: number) => void
): void
```

- `items`: 新しいリストデータ
- `keyFn`: 各アイテムから一意キーを抽出する関数（`undefined` の場合は非キー付きモード）
- `createFn`: 新しいアイテムから DOM ノードを生成する関数（index も受け取る）
- `updateFn`: 既存ノードを更新する関数（オプショナル）

== 動作仕様

=== キー付きモード（`keyFn` が定義されている場合）

1. `WeakMap` で親ノードごとの管理リスト（`ManagedItem<T>[]`）を保持
2. 新しいリストと既存リストをキーで比較
3. 既存ノードの再利用（キーが一致する場合）
  - `updateFn` が指定されていれば、ノードを更新
4. 新しいノードの追加（キーが新規の場合）
5. 不要なノードの削除（キーが消えた場合）
6. ノードの順序変更（キーの位置が変わった場合）

=== 非キー付きモード（`keyFn` が `undefined` の場合）

1. インデックスベースでノードを再利用
2. 既存ノード数 < 新規リスト長: 不足分を作成
3. 既存ノード数 > 新規リスト長: 余剰分を削除
4. `updateFn` が指定されていれば、再利用ノードを更新

== 内部型

```typescript
type ManagedItem<T> = { key: unknown; node: Node; item: T }
```

== 設計判断

#adr[
  *ADR: キー付きと非キー付きの両対応*

  *背景*: Keyed のみサポートする案もあったが、シンプルな用途では keyed が冗長。

  *決定*: `keyFn` が `undefined` の場合は非キー付きモードで動作する。
  - キー付きモード: WeakMap で管理、効率的な移動・再利用
  - 非キー付きモード: インデックスベースで単純に更新
]

#adr[
  *ADR: updateFn の追加*

  *背景*: ノードを再利用する際、内容を更新したいケースが多い。

  *決定*: オプショナルな `updateFn` を追加。
  - 既存ノード再利用時に呼ばれる
  - キー付き・非キー付き両方で動作
]

#adr[
  *ADR: createFn に index 引数を追加*

  *背景*: インデックスを使った UI 表示（例: "Item 1", "Item 2"）が必要。

  *決定*: `createFn(item, index)` として index を渡す。
]

#adr[
  *ADR: 重複キーと null/undefined キーの警告*

  *背景*: 重複キーや null キーはバグの原因になりやすい。

  *決定*: DEV モードで警告を出力する。
]

- `WeakMap` で管理リストを保持し、GC によるメモリ解放を保証
- バンドルサイズ目標 ~400B のため、最適なアルゴリズムより簡潔さを優先
