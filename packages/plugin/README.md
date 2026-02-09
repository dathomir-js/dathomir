# @dathomir/plugin

Build tool plugin for Dathomir. Transforms JSX/TSX files using `@dathomir/transformer`. Built with [unplugin](https://github.com/unjs/unplugin) for multi-bundler support.

## Install

```bash
npm install @dathomir/plugin
```

## Vite

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { dathomir } from "@dathomir/plugin";

export default defineConfig({
  plugins: [dathomir.vite()],
});
```

## Webpack

```js
// webpack.config.js
const { dathomir } = require("@dathomir/plugin");

module.exports = {
  plugins: [dathomir.webpack()],
};
```

## Rollup

```js
// rollup.config.js
import { dathomir } from "@dathomir/plugin";

export default {
  plugins: [dathomir.rollup()],
};
```

## esbuild

```js
import { dathomir } from "@dathomir/plugin";

require("esbuild").build({
  plugins: [dathomir.esbuild()],
});
```

## Options

```ts
dathomir.vite({
  include: [".tsx", ".jsx"],  // file extensions to transform (default)
  exclude: [],                // patterns to exclude
  runtimeModule: "@dathomir/core", // runtime import module (default)
  mode: "csr",                // "csr" | "ssr" — overrides auto-detection
});
```

| Option | Type | Default | Description |
|---|---|---|---|
| `include` | `string[]` | `[".tsx", ".jsx"]` | File extensions to transform |
| `exclude` | `string[]` | `[]` | Patterns to exclude |
| `runtimeModule` | `string` | `"@dathomir/core"` | Module for runtime imports |
| `mode` | `"csr" \| "ssr"` | auto | Force rendering mode |

### SSR Mode Detection

When `mode` is not set, the plugin auto-detects SSR from the Vite environment:

1. `environment.name` (Vite Environment API)
2. `options.ssr` (Vite SSR flag)
3. Falls back to CSR

## License

[MPL-2.0](./LICENSE.md)
