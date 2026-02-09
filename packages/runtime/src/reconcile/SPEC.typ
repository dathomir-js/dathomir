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
  keyFn: (item: T) => unknown,
  createFn: (item: T) => Node
): void
```

- `items`: 新しいリストデータ
- `keyFn`: 各アイテムから一意キーを抽出する関数
- `createFn`: 新しいアイテムから DOM ノードを生成する関数

== 動作仕様

1. `WeakMap` で親ノードごとの管理リスト（`ManagedItem<T>[]`）を保持
2. 新しいリストと既存リストをキーで比較
3. 既存ノードの再利用（キーが一致する場合）
4. 新しいノードの追加（キーが新規の場合）
5. 不要なノードの削除（キーが消えた場合）
6. ノードの順序変更（キーの位置が変わった場合）

== 内部型

```typescript
type ManagedItem<T> = { key: unknown; node: Node; item: T }
```

== 設計判断

- `WeakMap` で管理リストを保持し、GC によるメモリ解放を保証
- keyed のみサポート（unkeyed リストは keyed のインデックスキーで代替可能）
- バンドルサイズ目標 ~400B のため、最適なアルゴリズムより簡潔さを優先
