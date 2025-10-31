/**
 * VNode flags (bitmask) for optimization and type identification.
 */
enum VNodeFlags {
  ELEMENT = 1 << 0, // 1: Host element (div, span, etc.)
  COMPONENT = 1 << 1, // 2: Function component
  FRAGMENT = 1 << 2, // 4: Fragment
  TEXT = 1 << 3, // 8: Text node (primitive value)
  REACTIVE_PROP = 1 << 4, // 16: Contains reactive props
  REACTIVE_CHILD = 1 << 5, // 32: Contains reactive children
  STATIC_LEAF = 1 << 6, // 64: Fully static (optimization hint)
}

/**
 * Fragment symbol for identifying fragment nodes.
 */
const FragmentSymbol = Symbol.for("dathomir.fragment");

export { VNodeFlags, FragmentSymbol };
