# @dathomir/components

Web Components high-level API for Dathomir framework.

## Features

- **`defineComponent`**: High-level API for defining Web Components with automatic Shadow DOM setup, reactive attributes, and lifecycle management
- **`css`**: Tagged template literal for creating CSSStyleSheets to use with adoptedStyleSheets

## Installation

```bash
pnpm add @dathomir/components @dathomir/reactivity
```

Note: Usually you'll install `@dathomir/core` which includes this package.

## Usage

```typescript
import { defineComponent, css } from '@dathomir/components';
import { signal } from '@dathomir/reactivity';

const styles = css`
  button {
    padding: 8px 16px;
    cursor: pointer;
  }
`;

defineComponent('my-counter', () => {
  const count = signal(0);

  return (
    <button onClick={() => count.value++}>
      Count: {count.value}
    </button>
  );
}, {
  styles: [styles],
});
```

```html
<my-counter></my-counter>
```

## API

### `defineComponent(tagName, setup, options?)`

Define and register a custom element.

- **tagName**: Custom element name (must contain a hyphen)
- **setup**: Function that creates the component's DOM content
- **options**: Optional configuration
  - `styles`: Array of CSSStyleSheet or string styles
  - `attrs`: Array of attribute names to observe
  - `hydrate`: Hydration setup function for SSR

### `css`

Create a CSSStyleSheet from a template literal.

```typescript
const styles = css`
  :host {
    display: block;
  }
  .card {
    border: 1px solid #ccc;
    padding: 16px;
  }
`;
```

## SSR with Declarative Shadow DOM

To enable SSR with Declarative Shadow DOM, simply import the auto-setup module:

```typescript
// entry-server.tsx
import '@dathomir/components/ssr'; // Auto-enables DSD rendering
import { App } from './App';

export function render(): string {
  return App() as unknown as string;
}
```

The `@dathomir/components/ssr` import automatically configures the SSR renderer to generate `<template shadowrootmode="open">` for all registered Web Components. No additional setup required!

## License

MPL-2.0
