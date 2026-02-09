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
function insert(parent: Node, child: Node, anchor: Node | null): void
```

アンカーノードの前に子ノードを挿入する。`anchor` が `null` の場合は末尾に追加する。
`parent.insertBefore(child, anchor)` のラッパー。

== 設計判断

- 単純なラッパーだが、Runtime API の一貫性のために提供
- 将来の SSR/Hydration 対応でモード分岐が必要になる可能性があるため、直接 DOM API を使わずラッパーを経由
