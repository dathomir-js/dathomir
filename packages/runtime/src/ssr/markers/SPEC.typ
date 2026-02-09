= markers API

#import "../../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

SSR 出力に挿入するマーカー文字列を生成する。Hydration 時にこれらのマーカーを探索して動的ノードを特定する。

== 関数

=== `createMarker`

```typescript
function createMarker(type: MarkerType, id: number | string): string
```

SSR 用コメントマーカー文字列を生成する。形式: `<!--dh:{type}:{id}-->`

=== `createBlockEndMarker`

```typescript
function createBlockEndMarker(): string
```

ブロック終了マーカーを生成する。形式: `<!--/dh:b-->`

=== `createDataMarker`

```typescript
function createDataMarker(id: number | string): string
```

要素用 data 属性マーカーを生成する。形式: `data-dh="{id}"`

=== `createStateScript`

```typescript
function createStateScript(serializedState: string): string
```

状態スクリプトタグを生成する。形式: `<script type="application/json" data-dh-state>{state}</script>`

== 型定義

```typescript
const enum MarkerType {
  Text = "t",
  Insert = "i",
  Block = "b",
}
```

== マーカープロトコル

- テキスト: `<!--dh:t:{id}-->` — 動的テキストの位置を示す
- 挿入: `<!--dh:i:{id}-->` — 動的コンポーネント挿入位置を示す
- ブロック: `<!--dh:b:{id}-->...<!--/dh:b-->` — 条件分岐/リストのブロック範囲
- 状態: `<script type="application/json" data-dh-state>` — シリアライズされた Signal 初期値

== 設計判断

- コメントノードベースのマーカーで、DOM 構造に影響を与えない
- `data-dh` 属性マーカーは要素にバインドされた動的データの識別に使用
- `type="application/json"` でブラウザのスクリプト実行を防止
