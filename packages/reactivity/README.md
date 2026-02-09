# @dathomir/reactivity

Fine-grained reactivity system built on [alien-signals](https://github.com/stackblitz/alien-signals). Provides TC39 Signals-style `signal` / `computed` / `effect` primitives.

## Install

```bash
npm install @dathomir/reactivity
```

## Usage

```ts
import { signal, computed, effect, batch } from "@dathomir/reactivity";

const count = signal(0);
const doubled = computed(() => count.value * 2);

const stop = effect(() => {
  console.log(`count: ${count.value}, doubled: ${doubled.value}`);
});

count.value = 5;   // logs: count: 5, doubled: 10
count.set(10);     // logs: count: 10, doubled: 20

batch(() => {
  count.value = 100;
  count.value = 200; // single notification
});
// logs: count: 200, doubled: 400

stop();
```

## API

### `signal(initialValue)`

Create a mutable reactive signal.

```ts
const name = signal("world");
console.log(name.value);  // "world"
name.value = "dathomir";  // triggers dependents
name.set("new value");    // alternative setter
name.update(v => v.toUpperCase()); // updater function
name.peek();              // read without tracking
```

### `computed(fn)`

Create a cached derived value that recomputes when dependencies change.

```ts
const count = signal(1);
const doubled = computed(() => count.value * 2);
console.log(doubled.value); // 2
console.log(doubled.peek()); // read without tracking
```

### `effect(fn)`

Run a side effect whenever its dependencies change. Returns a cleanup function.

```ts
const count = signal(0);
const stop = effect(() => {
  console.log(count.value);
});
count.value = 1; // triggers re-run
stop();          // dispose effect
```

### `batch(fn)`

Batch multiple signal writes into a single notification flush.

```ts
const a = signal(0);
const b = signal(0);
batch(() => {
  a.value = 1;
  b.value = 2;
}); // dependents notified once
```

### `createRoot(fn)`

Create a cleanup/ownership scope. Returns a dispose function.

```ts
const dispose = createRoot(() => {
  const count = signal(0);
  effect(() => console.log(count.value));
  count.value = 1;
});
dispose(); // cleans up all effects in scope
```

### `onCleanup(fn)`

Register a cleanup callback within the current owner scope. Called when the scope is disposed.

```ts
createRoot(() => {
  const timer = setInterval(() => {}, 1000);
  onCleanup(() => clearInterval(timer));
});
```

### `templateEffect(fn)`

Optimized effect for template bindings. Used internally by the runtime.

```ts
templateEffect(() => {
  setText(node, count.value);
});
```

## License

[MPL-2.0](./LICENSE.md)
