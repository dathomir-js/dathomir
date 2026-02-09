= SSR ユーティリティ（transformer）

#import "../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

SSR モードでの変換に必要なユーティリティ関数を提供する。
メインの SSR 変換ロジックは `transform` 内で処理されるが、
このモジュールは SSR 固有のコード生成ヘルパーを提供する。

== 提供する関数

=== isSSRImport

```typescript
function isSSRImport(name: string): name is SSRImport
```

指定されたインポート名が SSR 固有のものかを判定する。

=== generateSSRRender

```typescript
function generateSSRRender(
  tree: Expression,
  dynamicValues: Expression[],
  stateExpr: Expression | null
): Expression
```

構造化配列から `renderToString()` 呼び出し式を生成する。

=== generateStateObject

```typescript
function generateStateObject(
  signals: Map<string, Expression>
): Expression
```

Signal の状態をシリアライズするオブジェクト式を生成する。

== 定数

=== SSR_IMPORTS

SSR 固有のランタイムインポート名のリスト:
`renderToString`, `renderTree`, `serializeState`, `createMarker`, `MarkerType`

== テストケース

- SSR モードで renderToString インポートを生成する
- SSR マーカーを挿入する
- Signal 状態のシリアライズコードを生成する
