= walker API

#import "../../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

Hydration 時に SSR マーカー（コメントノード）を TreeWalker で線形探索する。

== 関数

=== `createWalker`

```typescript
function createWalker(root: Node): TreeWalker
```

コメントノードフィルター付きの `TreeWalker` を作成する。`NodeFilter.SHOW_COMMENT` を使用。

=== `findMarkers`

```typescript
function findMarkers(container: Node): MarkerInfo[]
```

コンテナ内の全マーカーを収集して配列で返す。

=== `findMarker`

```typescript
function findMarker(walker: TreeWalker): MarkerInfo | null
```

TreeWalker を使って次のマーカーを検索する。マーカーでないコメントはスキップする。

=== `getTextNodeAfterMarker`

```typescript
function getTextNodeAfterMarker(marker: Comment): Text | null
```

テキストマーカー直後のテキストノードを取得する。存在しなければ空のテキストノードを作成して挿入する。

=== `parseMarker`

```typescript
function parseMarker(comment: Comment): MarkerInfo | null
```

コメントノードの内容をパースし、マーカー情報を抽出する。

== 型定義

```typescript
const enum HydrationMarkerType {
  Text = "t",
  Insert = "i",
  Block = "b",
  BlockEnd = "/b",
}

interface MarkerInfo {
  type: HydrationMarkerType;
  id: number;
  node: Comment;
}
```

== 定数

- `MARKER_PREFIX = "dh:"` — マーカーのプレフィックス
- `BLOCK_END = "/dh:b"` — ブロック終了マーカー

== 設計判断

- `TreeWalker` による線形探索は O(n) だが、DOM ツリーを1回走査で完了
- マーカー形式: `<!--dh:{type}:{id}-->`（例: `<!--dh:t:1-->`）
- `getTextNodeAfterMarker` でテキストノードがなければ作成することで、SSR 出力の空テキスト問題に対処
