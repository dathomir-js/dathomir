export {
  // Namespace enum
  Namespace,
  // DOM insertion
  append,
  // Events
  event,
  // DOM navigation
  firstChild,
  // DOM generation
  fromTree,
  insert,
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

export { createRoot, onCleanup, templateEffect } from "@dathomir/reactivity";

export type {
  // Tree types
  Attrs,
  FC,
  FCWithChildren,
  Placeholder,
  PlaceholderType,
  SpreadProps,
  TextContent,
  Tree,
  TreeNode,
  // Component types
  dathomirElement,
  dathomirJSX,
  dathomirNode,
  dathomirSpreadChildren,
} from "@dathomir/runtime";

export type { Owner, RootDispose } from "@dathomir/reactivity";

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

export {
  HydrationMismatchError,
  registerClientAction,
  createHydrationContext,
  createWalker,
  deserializeState,
  findMarker,
  hydrate,
  hydrateIslands,
  hydrateRoot,
  isHydrated,
  parseStateScript,
} from "@dathomir/runtime/hydration";

export type { HydrationContext, MarkerInfo } from "@dathomir/runtime/hydration";
