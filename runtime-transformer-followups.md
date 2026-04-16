# Runtime to Transformer Follow-ups

Temporary working note for the next transformer-expansion pass.

## Goal

Reduce conservative runtime fallback where compile-time lowering is still possible, while keeping true runtime-only behavior in runtime.

## Work Items

1. `unsupported-component-body`
- Split current umbrella cases into:
  - safely compilable
  - conditionally compilable
  - runtime-only
- Identify the smallest first subset to support.

Current findings:
- Supported now:
  - block-body `return condition ? <A /> : <B />`
  - block-body `return condition && <A />`
  - direct-body `condition ? <A /> : <B />`
  - direct-body `condition && <A />`
- Likely still runtime-only or conservative for now:
  - async / generator bodies
  - loops (`for` / `while` / `do-while` / `for-in` / `for-of`)
  - `try` / `catch` / `finally`
  - `throw`
  - arbitrary `ExpressionStatement` preludes
  - class declarations in prelude
  - bodies without a final JSX-bearing return

First concrete expansion completed:
- `return condition && <JSX />` now lowers to dispatch metadata with an empty fragment false branch instead of falling back to `unsupported-component-body`.

2. `opaque-helper-call`
- Re-check helper-call patterns that are currently rejected.
- Expand support only for transparent/pure helper chains we can normalize safely.

Current findings:
- Supported now:
  - local zero-arg helpers that directly return JSX
  - transparent thunk wrappers
  - known imported transparent wrappers
  - top-level static object-literal helper methods like `helpers.render(...)`
- Still intentionally unsupported for now:
  - closure-produced helpers (`const render = makeRenderer()`)
  - runtime-selected callees (`(cond ? a : b)(...)`)
  - unknown imported wrappers
  - method-style helpers where the object shape is not static and locally analyzable

Second concrete expansion completed:
- top-level static object-literal helper methods now resolve through the helper chain analyzer instead of falling back to `opaque-helper-call`.

3. `non-normalizable-spread`
- Identify spread shapes that are still analyzable.
- Support only static/analyzable subsets first.

Current findings:
- Supported now:
  - plain spread expressions like `{...props.attrs.value}`
  - object-literal spreads without nested `SpreadElement`
  - object-literal spread merges whose nested spread operands resolve to serializable top-level/local const object bindings
- Still intentionally unsupported for now:
  - merges of runtime object sources like `{ ...props.a.value, ...props.b.value }`
  - spread operands that resolve through non-serializable bindings
  - spread merges that depend on opaque helper/runtime-selected values

Third concrete expansion completed:
- nested object-literal spread merges now compile when every spread operand resolves to a serializable object binding, including top-level const bindings used inside component JSX.

4. `imperative-dom-query`
- Re-confirm which cases are fundamentally runtime-only.
- Only move anything if it is truly deterministic and side-effect free.

5. `node-identity-reuse`
- Re-confirm whether any subset can be lowered safely.
- Preserve runtime handling for identity-sensitive DOM creation patterns.

6. `runtime-branching`
- Review current dispatch support.
- Tighten contract/tests for branch classification where the compiler already supports the pattern.

## Cross-Cutting

- Check whether CSR/SSR static analysis can be shared more aggressively once the above classifications are clear.

## Suggested Order

1. `unsupported-component-body`
2. `opaque-helper-call`
3. `non-normalizable-spread`
4. `imperative-dom-query`
5. `node-identity-reuse`
6. `runtime-branching`

## Exit Condition

- Each item is classified as one of:
  - compile now
  - compile later with explicit prerequisites
  - runtime-only by design
