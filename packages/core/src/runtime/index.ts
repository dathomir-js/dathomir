/**
 * Re-export all runtime functions from @dathomir/runtime.
 */

// CSR (from @dathomir/runtime)
export {
  // DOM insertion
  append,
  // Events
  event,
  // DOM navigation
  firstChild,
  // DOM generation
  fromTree,
  insert,
  // Namespace enum
  Namespace,
  nextSibling,
  // List reconciliation
  reconcile,
  // DOM attributes and properties
  setAttr,
  setProp,
  // DOM text
  setText,
  // DOM spread
  spread,
} from "@dathomir/runtime";

// Reactivity (from @dathomir/reactivity, for runtime convenience)
export { createRoot, onCleanup, templateEffect } from "@dathomir/reactivity";

export type {
  // Tree types
  Attrs,
  // Component types
  FC,
  FCWithChildren,
  Placeholder,
  PlaceholderType,
  SpreadProps,
  TextContent,
  Tree,
  TreeNode,
} from "@dathomir/runtime";

// Reactivity types (from @dathomir/reactivity, for runtime convenience)
export type { Owner, RootDispose } from "@dathomir/reactivity";

// SSR (from @dathomir/runtime/ssr)
export {
  createMarker,
  MarkerType,
  renderToString,
  renderTree,
  serializeState,
} from "@dathomir/runtime/ssr";

export type {
  RenderContext,
  RenderOptions,
  SerializableValue,
  StateObject,
} from "@dathomir/runtime/ssr";

// Hydration (from @dathomir/runtime/hydration)
export {
  createHydrationContext,
  createWalker,
  deserializeState,
  findMarker,
  hydrate,
  hydrateRoot,
  HydrationMismatchError,
  isHydrated,
  parseStateScript,
} from "@dathomir/runtime/hydration";

export type { HydrationContext, MarkerInfo } from "@dathomir/runtime/hydration";
