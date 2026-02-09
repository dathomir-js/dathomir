/**
 * Re-export all runtime functions from @dathomir/runtime.
 */

// CSR (from @dathomir/runtime)
export {
  // Namespace enum
  Namespace,
  // DOM insertion
  append,
  // Reactivity (also exported from reactivity)
  createRoot,
  // Events
  event,
  // DOM navigation
  firstChild,
  // DOM generation
  fromTree,
  insert,
  nextSibling,
  onCleanup,
  // List reconciliation
  reconcile,
  // DOM attributes and properties
  setAttr,
  setProp,
  // DOM text
  setText,
  // DOM spread
  spread,
  templateEffect,
} from "@dathomir/runtime";

export type {
  // Tree types
  Attrs,
  Owner,
  Placeholder,
  PlaceholderType,
  RootDispose,
  SpreadProps,
  TextContent,
  Tree,
  TreeNode,
} from "@dathomir/runtime";

// SSR (from @dathomir/runtime/ssr)
export {
  MarkerType,
  createMarker,
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
  HydrationMismatchError,
  createHydrationContext,
  createWalker,
  deserializeState,
  findMarker,
  hydrate,
  hydrateRoot,
  isHydrated,
  parseStateScript,
} from "@dathomir/runtime/hydration";

export type { HydrationContext, MarkerInfo } from "@dathomir/runtime/hydration";
