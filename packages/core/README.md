# @dathomir/core

## 破壊前の最終コミット

https://github.com/dathomir-js/dathomir/tree/e6e39d33a40e5b8bb851c588ca5c2b8301c18dc0

## Overview

A full-stack JS framework that works with the new order TC39 Signals.

### Quick start

```bash
npm install @dathomir/core @dathomir/plugin
```

## Getting started

### 1. Create Vite project

```bash
npm create vite@latest my-dathomir-app -- --template vanilla-ts
cd my-dathomir-app
```

### 2. Install dependencies

```bash
npm install @dathomir/core @dathomir/plugin
```

### 3. Configure Vite

Create `vite.config.ts` in the project root with the following content:

```ts
import { defineConfig } from "vite";
import { dathomir } from "@dathomir/plugin";

export default defineConfig({
  plugins: [dathomir.vite()],
});
```

### 4. Update tsconfig.json

Add the following to `compilerOptions` in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@dathomir/core"
  }
}
```

### 5. Create app entry point

Create `src/main.tsx` with the following content:

```tsx
import { mount } from "@dathomir/core";

const Counter = () => {
  const [count, setCount] = signal(0);

  return computed(() => (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>Increment</button>
    </div>
  ));
};

const App = (
  <div>
    <h1>Hello, Dathomir!</h1>
    <Counter />
  </div>
);

mount(App, document.getElementById("app")!);
```

### 6. Update index.html

Update `index.html` to include a div with id "app" and src to `main.tsx`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dathomir App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 7. Run the development server

```bash
npm run dev
```
