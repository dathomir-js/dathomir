---
applyTo: '**'
priority: 1
lastUpdated: '2025-10-28'
---

# @dathomir/transformer

## Overview
`@dathomir/transformer` is a package that parses JSX/TSX into an AST, traverses it, and provides an AST transform/generate pipeline that wraps JavaScript expressions inside JSX with the `computed` function from `@dathomir/reactivity`.

## What it does
- Detect JavaScript expressions placed inside JSX curly braces (`{ ... }`) and wrap them with `computed`.
  - Example: `{ someValue + 10 }` becomes `computed(() => someValue + 10)`.
  - Example: expressions that read signals, e.g. `{ count.value * 2 }`, become `computed(() => count.value * 2)`.
  - In principle, expressions inside `{}` are wrapped with `computed`.
- Do not modify code that is already wrapped with `computed`.
- Do not modify code outside of JSX syntax.