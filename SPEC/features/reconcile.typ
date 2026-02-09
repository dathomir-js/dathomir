#import "../functions.typ": feature_spec
#import "../settings.typ": apply-settings
#show: apply-settings

= reconcile 機能詳細設計

#feature_spec(
  name: "reconcile",
  summary: [
    keyed/unkeyed リストの差分更新を行う Runtime 関数。
    配列データの変更を効率的に DOM に反映する。
  ],
  api: [
    ```typescript
    function reconcile<T>(
      container: Node,
      items: T[],
      keyFn: ((item: T) => string | number) | undefined,
      createFn: (item: T, index: number) => Node,
      updateFn: (node: Node, item: T, index: number) => void
    ): void
    ```

    *パラメータ*:
    - `container`: 親 DOM ノード（リストの親要素）
    - `items`: 新しいアイテム配列
    - `keyFn`: キー取得関数（undefined の場合は unkeyed モード）
    - `createFn`: 新しいノードを作成する関数
    - `updateFn`: 既存ノードを更新する関数

    *戻り値*: なし（副作用として DOM を更新）
  ],
  edge_cases: [
    1. *空配列*: `items` が空の場合、全ての子ノードを削除
    2. *初期レンダリング*: 既存の子ノードがない場合、全て新規作成
    3. *キー重複*: 同じキーが複数ある場合の動作（警告 or エラー）
    4. *null/undefined アイテム*: 配列に null が含まれる場合
    5. *巨大配列*: 10,000 件以上のアイテム（パフォーマンス考慮）
    6. *順序逆転*: `[1,2,3]` → `[3,2,1]` の完全逆転
  ],
  test_cases: [
    *基本操作*:
    + 空配列 → 3要素: 3要素追加される
    + 3要素 → 空配列: 3要素削除される
    + 3要素 → 3要素（同一）: 何も変更されない

    *追加*:
    + `[1,2,3]` → `[1,2,3,4]`: 末尾に追加
    + `[1,2,3]` → `[0,1,2,3]`: 先頭に追加
    + `[1,2,3]` → `[1,1.5,2,3]`: 中間に追加

    *削除*:
    + `[1,2,3]` → `[1,2]`: 末尾から削除
    + `[1,2,3]` → `[2,3]`: 先頭から削除
    + `[1,2,3]` → `[1,3]`: 中間から削除

    *keyed モード*:
    + `[a,b,c]` → `[c,b,a]`: 順序入れ替え時に DOM ノード再利用
    + `[a,b,c]` → `[a,c]`: 中間削除時に DOM ノード再利用
    + `[a,b]` → `[a,x,b]`: 中間挿入時に既存ノード保持

    *unkeyed モード*:
    + `[1,2,3]` → `[3,2,1]`: 全ノード更新（順序変更）
    + `[a,b,c]` → `[x,y,z]`: 既存ノードを再利用して更新

    *エッジケース*:
    + キー重複時に警告が出る（開発モード）
    + updateFn が呼ばれるのは既存ノードのみ
    + createFn が呼ばれるのは新規ノードのみ
  ],
  impl_notes: [
    *アルゴリズム*:
    - keyed: Map でキーからノードを検索、O(n) で差分適用
    - unkeyed: インデックスベースで比較、超過分は追加/削除

    *参考実装*:
    - SolidJS: `reconcileArrays` in `solid-js/store`
    - Svelte 5: `each` ブロックの内部実装

    *パフォーマンス目標*:
    - 1,000 アイテムの完全入れ替え: < 10ms
    - 1 アイテムの追加/削除: < 1ms
  ],
)
