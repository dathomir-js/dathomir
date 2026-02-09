= plugin（ビルドツール統合）

#import "../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

Vite、webpack 等のビルドツール向けプラグインを提供する。
unplugin を使用して複数のバンドラーに対応し、JSX/TSX ファイルに対して
`\@dathomir/transformer` を適用する。

== 提供する関数

=== dathomirPlugin

```typescript
const dathomirPlugin: UnpluginInstance<PluginOptions | undefined>
```

unplugin インスタンス。Vite/webpack 両対応。

=== dathomirVitePlugin

```typescript
function dathomirVitePlugin(options?: PluginOptions): VitePlugin[]
```

Vite 専用プラグイン。Environment API でモード判定を行う。

=== dathomirWebpackPlugin

```typescript
const dathomirWebpackPlugin: (options?: PluginOptions) => WebpackPlugin
```

webpack 専用プラグイン。

== 設定

```typescript
interface PluginOptions {
  include?: string[];        // 対象ファイル拡張子（デフォルト: ['.tsx', '.jsx']）
  exclude?: string[];        // 除外パターン
  runtimeModule?: string;    // ランタイムモジュール名（デフォルト: '\@dathomir/core'）
  mode?: 'csr' | 'ssr';     // 強制モード指定
}
```

== 動作

=== ファイルフィルタリング

- `include` に一致し `exclude` に一致しないファイルのみ変換
- デフォルトで `.tsx` と `.jsx` ファイルを対象

=== モード判定

優先順位:
1. `options.mode`（明示的指定）
2. Vite Environment API（`environment.name`）
3. `options.ssr`（Vite SSR フラグ）
4. デフォルト: CSR

=== 変換

- `\@dathomir/transformer` の `transform()` を呼び出す
- ソースマップを生成する

== テストケース

- JSX/TSX ファイルを変換する
- 非対象ファイルを無視する
- CSR/SSR モードを正しく判定する
- PluginOptions が正しく適用される
