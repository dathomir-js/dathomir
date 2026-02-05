/**
 * Re-export all runtime functions from @dathomir/runtime.
 */
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
