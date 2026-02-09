/**
 * Re-export all runtime functions from @dathomir/runtime.
 */
export {
  // Hydration
  HydrationMismatchError,
  // SSR
  MarkerType,
  // Namespace enum
  Namespace,
  // DOM insertion
  append,
  createHydrationContext,
  createMarker,
  // Reactivity (also exported from reactivity)
  createRoot,
  createWalker,
  deserializeState,
  // Events
  event,
  findMarker,
  // DOM navigation
  firstChild,
  // DOM generation
  fromTree,
  hydrate,
  hydrateRoot,
  insert,
  isHydrated,
  nextSibling,
  onCleanup,
  parseStateScript,
  // List reconciliation
  reconcile,
  renderToString,
  renderTree,
  serializeState,
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
  // Hydration types
  HydrationContext,
  MarkerInfo,
  Owner,
  Placeholder,
  PlaceholderType,
  // SSR types
  RenderContext,
  RenderOptions,
  RootDispose,
  SerializableValue,
  SpreadProps,
  StateObject,
  TextContent,
  Tree,
  TreeNode,
} from "@dathomir/runtime";
