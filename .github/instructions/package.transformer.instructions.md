---
applyTo: '**/packages/transformer/**'
priority: 1
---

# Transformer Package Instructions

## Package Overview
The purpose of this library is to analyze jsx/tsx code, detect places inside HTML where the features `signal` and `computed` from `@ailuros/reactivity` are used, and transform all of them into reactive code.

### 変換するとは
1. Pattern 1 基本
  ```tsx
  const count = signal(0);
  const doubleCount = computed(() => count.value * 2);

  return (
    <div>
      <div>Count is {count.value}</div>
      <div>Double count is {doubleCount.value}</div>
    </div>
  );
  ```
  What we mean by "transform":
  From the code above, the transformer finds occurrences inside the HTML syntax that call the `count` variable created by `signal`, detects that it is used as a getter, and transforms it as follows.
  It wraps `count.value` with `computed` provided by `@ailuros/reactivity`.
  ```tsx
  const count = signal(0);
  const doubleCount = computed(() => count.value * 2);

  return (
    <div>
      <div>Count is {computed(() => count.value)}</div>
      <div>Double count is {computed(() => doubleCount.value)}</div>
    </div>
  );
  ```
  The subsequent rendering is handled by a separate `@ailuros/runtime`.

2. Pattern 2 エレメント出し分け
  ```tsx
  const count = signal(0);
  const isOdd = computed(() => count.value % 2 === 1);

  return (
    <div>
      {isOdd.value ? <div>Odd</div> : <div>Even</div>}
    </div>
  );
  ```
  ```tsx
  // transformed
  const count = signal(0);
  const isOdd = computed(() => count.value % 2 === 1);

  return (
    <div>
      {computed(() => isOdd.value ? <div>Odd</div> : <div>Even</div>)}
    </div>
  );
  ```

3. Pattern 3 イベントハンドラ
  ```tsx
  const count = signal(0);
  const handleClick = computed(() => {
    count.set((c) => c + 1);
  });

  return (
    <div>
      <div>Count is {count.value}</div>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
  ```
  ```tsx
  // transformed
  const count = signal(0);
  const handleClick = computed(() => {
    count.set((c) => c + 1);
  });

  return (
    <div>
      <div>Count is {computed(() => count.value)}</div>
      <button onClick={computed(() => handleClick)}>Increment</button>
    </div>
  );
  ```

## Main Instructions

 - Please treat the information in [`@ailuros/reactivity`](packages/reactivity/src/index.ts) as background knowledge.
 - Please treat `@babel/parser` and `@babel/traverse` as background knowledge. Use context7.
