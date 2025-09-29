---
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript Development Principles Instructions

## Purpose
This document defines comprehensive development principles for TypeScript in the Ailuros project to maintain high-quality code and provide a consistent developer experience.

## Basic Principles

### 1. Type Safety First
- Avoid using the `any` type; prefer appropriate type annotations.
- Use `unknown` where appropriate and implement safe type guards.
- Minimize type assertions and only use them when well justified.
- Use type narrowing to write safe code.

```typescript
// ❌ Avoid
function process(data: any) {
  return data.foo.bar;
}

// ✅ Recommended
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'foo' in data) {
    // Safe handling using a type guard
  }
}
```

### 2. Explicit Type Definitions
- Always explicitly declare function return types (do not rely solely on inference).
- Public API types must always be explicit.
- Name complex types using type aliases or interfaces.

```typescript
// ✅ Recommended
export function createSignal<T>(value: T): Signal<T> {
  // implementation
}

export interface SignalOptions {
  reactive?: boolean;
  computed?: boolean;
}
```

### 3. Consistent Type Definition Patterns

#### Priorities for type declarations
1. `interface` - use for describing object shapes
2. `type` - use for unions, conditional, or computed types
3. `enum` - use for constant sets (consider `const` assertions first)

```typescript
// ✅ For object shapes
interface Component {
  render(): Element;
}

// ✅ For union types
type Status = 'loading' | 'success' | 'error';

// ✅ Prefer const-based constants over enums
const ComponentType = {
  FUNCTIONAL: 'functional',
  CLASS: 'class'
} as const;
type ComponentType = typeof ComponentType[keyof typeof ComponentType];
```

### 4. Function and Method Design Principles

#### Function signatures
- Place optional arguments at the end.
- Order overloads from the most specific to the most general.
- Use `void` for callback return types when the return value is ignored.

```typescript
// ✅ Recommended
function createComponent(
  name: string,
  props: ComponentProps,
  options?: ComponentOptions
): Component {
  // implementation
}

// Proper callback typing
function addEventListener(
  event: string,
  callback: (event: Event) => void
): void {
  // implementation
}
```

#### Generics
- Do not declare generic type parameters that are not used.
- Use constraints (`extends`) appropriately.
- Prefer default type parameters when useful.

```typescript
// ✅ Recommended
interface Signal<T = unknown> {
  value: T;
  subscribe<U extends T>(callback: (value: U) => void): void;
}
```

### 5. Class Design Principles

#### Access modifiers
- Do not explicitly mark public members with `public` (default).
- Use `private` or `#` for private members.
- Use `readonly` for properties that should not change.

```typescript
// ✅ Recommended
class SignalImpl<T> implements Signal<T> {
  readonly #value: T;
  #subscribers: Set<Subscriber<T>> = new Set();

  constructor(value: T) {
    this.#value = value;
  }

  get value(): T {
    return this.#value;
  }
  
  private notifySubscribers(): void {
    // implementation
  }
}
```

### 6. Error Handling

#### Use of Error objects
- Always use classes that extend the built-in `Error` for exceptions.
- Define custom error classes to provide specific error information.

```typescript
// ✅ Recommended
class SignalError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly signal?: string
  ) {
    super(message);
    this.name = 'SignalError';
  }
}

function updateSignal<T>(signal: Signal<T>, value: T): void {
  if (!signal) {
    throw new SignalError('Signal is required', 'MISSING_SIGNAL');
  }
  // implementation
}
```

### 7. Modules and Imports

#### Imports/Exports
- Use `import type` to explicitly import types only.
- Prefer named exports over default exports.
- Design to avoid circular dependencies.

```typescript
// ✅ Recommended
import type { Signal, SignalOptions } from './types';
import { createSignal, updateSignal } from './signal';

// Prefer named exports over default exports
export { createSignal, updateSignal };
export type { Signal, SignalOptions };
```

### 8. Asynchronous Code

#### Promises and async/await
- Functions that return a Promise should be declared `async`.
- Avoid unhandled (floating) Promises.
- Implement proper error handling.

```typescript
// ✅ Recommended
async function loadComponent(name: string): Promise<Component> {
  try {
    const module = await import(`./components/${name}`);
    return module.default;
  } catch (error) {
    throw new ComponentLoadError(`Failed to load component: ${name}`, error);
  }
}

// Proper handling of returned promises
function initializeApp(): void {
  loadComponent('app')
    .then(component => component.render())
    .catch(error => handleError(error));
}
```

### 9. Use of Utility Types

#### TypeScript standard utility types
- Use `Partial<T>`, `Required<T>`, `Pick<T, K>`, `Omit<T, K>` appropriately.
- Use conditional types to create flexible type definitions.

```typescript
// ✅ Recommended
interface ComponentProps {
  id: string;
  className?: string;
  children?: React.ReactNode;
}

// Type for partial updates
type ComponentUpdate = Partial<Pick<ComponentProps, 'className' | 'children'>>;

// Using conditional types
type ApiResponse<T> = T extends string 
  ? { message: T } 
  : { data: T };
```

### 10. Performance Considerations

#### Type-checking performance
- Avoid overly complex type definitions.
- Avoid circular type references.
- Use the `satisfies` operator when appropriate.

```typescript
// ✅ Recommended - using the satisfies operator
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
} satisfies ApiConfig;
```

## Ailuros Project-specific Principles

### 1. Type Safety in Signals Implementation
- Always explicitly declare the type of signal values.
- Implement changes to reactive values in a type-safe manner.
- Ensure computed signals infer dependency types correctly.

```typescript
// ✅ Recommended
interface Signal<T> {
  readonly value: T;
  set(value: T): void;
  subscribe(callback: (value: T) => void): () => void;
}

// Type-safe implementation for computed signals
function computed<T>(fn: () => T): ReadonlySignal<T> {
  // implementation
}
```

### 2. Web Components Integration
- Provide proper type definitions for custom elements.
- Perform DOM operations in a type-safe manner.
- Define event handler types accurately.

```typescript
// ✅ Recommended
interface CustomElementConstructor {
  new (): HTMLElement;
}

declare global {
  interface HTMLElementTagNameMap {
    'ailuros-component': AilurosComponent;
  }
}

class AilurosComponent extends HTMLElement {
  connectedCallback(): void {
    // implementation
  }
  
  disconnectedCallback(): void {
    // implementation  
  }
}
```

### 3. Type Sharing Between Packages
- Maintain shared type definitions in a dedicated package.
- Ensure type consistency across package boundaries.
- Design types with version compatibility in mind.

```typescript
// packages/shared/types.ts
export interface ComponentAPI {
  render(): void;
  destroy(): void;
}

// Usage across packages
import type { ComponentAPI } from '@ailuros/shared/types';
```

### 4. Build Tool Integration
- Preserve type information in the transformer.
- Integrate type checking into plugins.
- Catch type errors early during development.

## Tooling Configuration

### Recommended ESLint rules
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/strict-boolean-expressions": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/prefer-as-const": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error"
  }
}
```

### TypeScript Compiler Options
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

### Prettier configuration
```json
{
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "quoteProps": "as-needed",
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

## Continuous Improvement

### Code review checklist
1. **Type safety checks**
   - Usage of `any`
   - Validity of type assertions
   - Proper handling of null/undefined

2. **Performance impact assessment**
   - Complexity of type computations
   - Impact on build times
   - Impact on bundle size

3. **API design consistency checks**
   - Consistency of interface design
   - Adherence to naming conventions
   - Type compatibility between packages

4. **Error handling adequacy**
   - Use of custom error classes
   - Richness of error information
   - Exception safety

5. **Documentation (type annotations) quality**
   - Presence of JSDoc comments
   - Self-documenting type definitions
   - Inclusion of sample code

### Periodic maintenance
- Keep TypeScript up to date
- Review ESLint rules regularly
- Measure and optimize performance
- Improve developer experience

Following these principles will help ensure high-quality, maintainable TypeScript code in the Ailuros project and improve the team's overall development efficiency.