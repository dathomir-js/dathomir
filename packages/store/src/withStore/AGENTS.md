# withStore API - AI Agent Instructions

## Before Implementation

**MUST READ:**

1. [SPEC.typ](./SPEC.typ) - Contains the specification and design decisions
2. [implementation.test.ts](./implementation.test.ts) - Contains the correctness criteria for implementation

These two files define what to implement and how to verify it is correct.

## Your Role

Implement the withStore API according to SPEC.typ while ensuring all test cases in implementation.test.ts pass.

## Architecture

This module uses a **dual-implementation** pattern for browser and Node.js environments:

- **`internal.ts`** — Browser (sync stack). Pure module-global `storeStack[]` array. No `node:async_hooks` references.
- **`internal.node.ts`** — Node.js / Edge (AsyncLocalStorage). Per-request isolation via `AsyncLocalStorage`.
- **`implementation.ts`** — Public API (`withStore`, `getCurrentStore`). Delegates to whichever `internal` variant is active.

### Build-time swapping

- **tsdown** uses `resolve.alias` in the Node.js config to replace `internal.ts` → `internal.node.ts`.
- **vitest** uses a `resolveId` plugin in `vitest.config.ts` for the same swap.
- Both `internal.ts` and `internal.node.ts` export the same API: `getCurrentStore()` and `runWithStoreContext()`.

### Key constraint

`internal.ts` must **never** import or reference `node:async_hooks`. The browser build must be free of any Node.js-specific code.
