#import "/SPEC/settings.typ": *
#show: apply-settings

= SSR Web Component Registry

== 目的

SSR 環境で Web Components のメタデータを管理するためのグローバルレジストリ。`defineComponent` が SSR で呼ばれた際、コンポーネントの setup 関数、CSS、PropsSchema を登録し、SSR レンダラーがこれを参照して Declarative Shadow DOM を生成する。

== API

=== registerComponent

```typescript
function registerComponent(
  tagName: string,
  setup: SetupFunction,
  cssTexts: readonly string[],
  propsSchema?: PropsSchema,
): void
```

Web Component を SSR レジストリに登録する。

*パラメータ:*
- `tagName`: カスタム要素のタグ名（ハイフン必須）
- `setup`: コンポーネントの DOM コンテンツを生成する関数
- `cssTexts`: SSR `<style>` 出力用の生 CSS テキスト配列
- `propsSchema`: Props スキーマ定義（型変換用、オプショナル）

*振る舞い:*
- グローバル Map に tagName → ComponentRegistration を保存
- 既存の tagName は上書きされる
- SSR 環境でのみ使用される（CSR では呼ばれない）

=== getComponent

```typescript
function getComponent(tagName: string): ComponentRegistration | undefined
```

登録済み Web Component のメタデータを取得する。

*パラメータ:*
- `tagName`: カスタム要素のタグ名

*返り値:*
- 登録済みの場合: `ComponentRegistration` オブジェクト
- 未登録の場合: `undefined`

=== hasComponent

```typescript
function hasComponent(tagName: string): boolean
```

タグ名が登録済み Web Component かチェックする。

*パラメータ:*
- `tagName`: チェックするタグ名

*返り値:*
- 登録済みの場合: `true`
- 未登録の場合: `false`

=== clearRegistry

```typescript
function clearRegistry(): void
```

レジストリをクリアする（テスト用）。

*振る舞い:*
- グローバル Map の全エントリを削除
- 本番環境では使用しない（テスト専用）

== データ構造

=== ComponentRegistration

```typescript
interface ComponentRegistration {
  readonly tagName: string;
  readonly setup: SetupFunction;
  readonly cssTexts: readonly string[];
  readonly propsSchema?: PropsSchema;
}
```

*フィールド:*
- `tagName`: カスタム要素のタグ名
- `setup`: DOM コンテンツを生成する setup 関数
- `cssTexts`: DSD `<style>` タグ出力用の CSS テキスト配列
- `propsSchema`: Props スキーマ定義（型変換用、オプショナル）

== 設計決定

=== ADR-001: グローバル Map による管理

*決定:* Web Component のメタデータをモジュールレベルの Map で管理する。

*理由:*
1. SSR は単一プロセスで動作し、複数コンポーネント間で共有が必要
2. `defineComponent` からの登録と SSR レンダラーからの取得が疎結合に保たれる
3. パフォーマンス: O(1) の検索性能

*影響:*
- テスト時は `clearRegistry()` で状態をリセットする必要がある
- プロセス全体で状態を共有するため、並行テストには注意が必要

=== ADR-002: SSR 専用 API

*決定:* registry は SSR 環境でのみ使用し、CSR では空のまま。

*理由:*
1. CSR では customElements.define() により Web Components が直接登録される
2. レジストリは Declarative Shadow DOM 生成にのみ必要
3. バンドルサイズ削減: CSR ビルドでは Tree shaking により削除される

*影響:*
- `defineComponent` は環境判定（`typeof window === "undefined"`）を行い、SSR でのみ `registerComponent` を呼ぶ
- CSR コードには registry への参照が含まれない

=== ADR-003: 上書き可能な登録

*決定:* 同じ tagName で複数回 `registerComponent` を呼ぶと、最新の登録で上書きされる。

*理由:*
1. HMR（Hot Module Replacement）やテストでの再登録をサポート
2. エラーを投げるより柔軟性が高い
3. 開発体験の向上

*影響:*
- 意図しない上書きに注意が必要（通常は問題にならない）
- テストで同じ tagName を使う場合、各テスト後に `clearRegistry()` を推奨

== 使用例

```typescript
import { registerComponent, getComponent, hasComponent } from "@/registry/implementation";

// defineComponent 内部で呼ばれる（SSR のみ）
registerComponent(
  "my-counter",
  (host, ctx) => {
    // setup function
    return document.createElement("div");
  },
  [":host { display: block; }"],
  { initial: { type: Number, default: 0 } }
);

// SSR レンダラーから取得
const registration = getComponent("my-counter");
if (registration) {
  // DSD を生成
}

// 存在チェック
if (hasComponent("my-counter")) {
  // 登録済み
}

// テストのクリーンアップ
clearRegistry();
```

== テストケース

1. `registerComponent()` が正しく登録する
2. `getComponent()` が登録済みコンポーネントを返す
3. `getComponent()` が未登録タグで `undefined` を返す
4. `hasComponent()` が存在チェックする
5. `hasComponent()` が未登録タグで `false` を返す
6. `clearRegistry()` が全エントリを削除する
7. 同じ tagName で登録すると上書きされる
