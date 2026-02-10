/**
 * SSR rendering - converts structured arrays to HTML strings.
 *
 * Per SPEC.typ:
 * - Generates HTML with SSR markers for Hydration
 * - Uses Declarative Shadow DOM for Web Components
 * - Inserts state script for Signal initialization
 */

import {
  MarkerType,
  createBlockEndMarker,
  createMarker,
  createStateScript,
} from "@/ssr/markers/implementation";
import {
  serializeState,
  type StateObject,
} from "@/ssr/serialize/implementation";
import { Namespace, type Tree, type TreeNode } from "@/types/tree";

const SVG_NS_ELEMENTS = new Set([
  "svg",
  "path",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "ellipse",
  "g",
  "defs",
  "use",
  "symbol",
  "clipPath",
  "mask",
  "pattern",
  "filter",
  "linearGradient",
  "radialGradient",
  "stop",
  "text",
  "tspan",
  "textPath",
  "image",
  "foreignObject",
  "marker",
  "animate",
  "animateMotion",
  "animateTransform",
  "set",
]);

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const BOOLEAN_ATTRS = new Set([
  "disabled",
  "checked",
  "readonly",
  "required",
  "autofocus",
  "autoplay",
  "controls",
  "defer",
  "hidden",
  "loop",
  "multiple",
  "muted",
  "novalidate",
  "open",
  "reversed",
  "selected",
  "async",
  "contenteditable",
  "default",
  "draggable",
  "formnovalidate",
  "inert",
  "ismap",
  "itemscope",
  "nomodule",
  "playsinline",
  "spellcheck",
  "translate",
]);

/**
 * Render context for tracking dynamic parts.
 */
interface RenderContext {
  /** Current marker ID counter */
  markerId: number;
  /** State object for serialization */
  state: StateObject;
  /** Dynamic values to render */
  dynamicValues: Map<number, unknown>;
  /** Current namespace (HTML/SVG/MathML) */
  namespace: Namespace;
  /** Component renderer for Declarative Shadow DOM */
  componentRenderer?: ComponentRenderer;
}

/**
 * Renders DSD content for a custom element.
 * Returns DSD HTML string (excluding outer tag), or null if not registered.
 */
type ComponentRenderer = (
  tagName: string,
  attrs: Record<string, unknown>,
) => string | null;

/**
 * Global default component renderer.
 * Set this before SSR rendering to enable DSD output for Web Components.
 */
let globalComponentRenderer: ComponentRenderer | undefined;

/**
 * Render options.
 */
interface RenderOptions {
  /** Initial state for Signals */
  state?: StateObject;
  /** Dynamic values keyed by marker ID */
  dynamicValues?: Map<number, unknown>;
  /** Whether to include state script */
  includeState?: boolean;
  /** Component renderer for Declarative Shadow DOM output */
  componentRenderer?: ComponentRenderer;
}

/**
 * Create a new render context.
 */
function createContext(options: RenderOptions = {}): RenderContext {
  return {
    markerId: 0,
    state: options.state ?? {},
    dynamicValues: options.dynamicValues ?? new Map(),
    namespace: Namespace.HTML,
    componentRenderer: options.componentRenderer ?? globalComponentRenderer,
  };
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Escape attribute value.
 */
function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * Convert a camelCase CSS property name to kebab-case.
 * Handles vendor prefixes like "webkitTransform" → "-webkit-transform".
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Serialize a style object to a CSS string.
 * Converts `{ padding: "20px", borderRadius: "8px" }`
 * to `"padding: 20px; border-radius: 8px"`.
 */
function serializeStyleObject(obj: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value == null || value === "") continue;
    const cssKey = camelToKebab(key);
    parts.push(`${cssKey}: ${String(value)}`);
  }
  return parts.join("; ");
}

/**
 * Render attributes to string.
 */
function renderAttrs(attrs: Record<string, unknown>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(attrs)) {
    // Skip event handlers (they start with "on")
    if (key.startsWith("on") && key.length > 2) continue;

    if (BOOLEAN_ATTRS.has(key.toLowerCase())) {
      if (value) {
        parts.push(key);
      }
    } else if (key === "style" && typeof value === "object" && value !== null) {
      // Serialize style object to CSS string
      const css = serializeStyleObject(value as Record<string, unknown>);
      if (css) {
        parts.push(`style="${escapeAttr(css)}"`);
      }
    } else if (value != null && value !== false) {
      parts.push(`${key}="${escapeAttr(String(value))}"`);
    }
  }

  return parts.length > 0 ? " " + parts.join(" ") : "";
}

/**
 * Check if a tree node is a placeholder.
 */
function isPlaceholder(
  node: Tree,
): node is ["{text}" | "{insert}" | "{each}", null] {
  return (
    Array.isArray(node) &&
    node.length === 2 &&
    typeof node[0] === "string" &&
    node[0].startsWith("{") &&
    node[1] === null
  );
}

/**
 * Check if a tree node is an element.
 */
function isElement(node: Tree): node is TreeNode {
  return (
    Array.isArray(node) &&
    node.length >= 2 &&
    typeof node[0] === "string" &&
    !node[0].startsWith("{")
  );
}

/**
 * Render a single tree node to HTML string.
 */
function renderNode(node: Tree, ctx: RenderContext): string {
  // Text content
  if (typeof node === "string") {
    return escapeHtml(node);
  }

  // Placeholder - emit marker and dynamic value
  if (isPlaceholder(node)) {
    const id = ++ctx.markerId;
    const type = node[0];

    if (type === "{text}") {
      const value = ctx.dynamicValues.get(id);
      const textContent = value != null ? escapeHtml(String(value)) : "";
      return createMarker(MarkerType.Text, id) + textContent;
    }

    if (type === "{insert}") {
      const value = ctx.dynamicValues.get(id);
      const content =
        value != null && typeof value === "string" ? value : "<!--empty-->";
      return createMarker(MarkerType.Insert, id) + content;
    }

    if (type === "{each}") {
      const items = ctx.dynamicValues.get(id) as string[] | undefined;
      const content = items ? items.join("") : "";
      return (
        createMarker(MarkerType.Block, id) + content + createBlockEndMarker()
      );
    }

    return "";
  }

  // Element node
  if (isElement(node)) {
    const [tag, attrs, ...children] = node;

    // Check for custom elements with DSD support
    if (tag.includes("-") && ctx.componentRenderer) {
      const attrObj = (attrs ?? {}) as Record<string, unknown>;
      const dsdContent = ctx.componentRenderer(tag, attrObj);
      if (dsdContent !== null) {
        // Render as custom element with Declarative Shadow DOM
        const attrStr = attrs ? renderAttrs(attrs) : "";
        return `<${tag}${attrStr}><template shadowrootmode="open">${dsdContent}</template></${tag}>`;
      }
    }

    // Track namespace changes
    const prevNamespace = ctx.namespace;
    if (SVG_NS_ELEMENTS.has(tag)) {
      ctx.namespace = Namespace.SVG;
    }

    // Build opening tag
    const attrStr = attrs ? renderAttrs(attrs) : "";
    let html = `<${tag}${attrStr}`;

    // Void elements
    if (VOID_ELEMENTS.has(tag.toLowerCase())) {
      ctx.namespace = prevNamespace;
      return html + " />";
    }

    html += ">";

    // Render children
    for (const child of children) {
      html += renderNode(child as Tree, ctx);
    }

    // Closing tag
    html += `</${tag}>`;

    // Restore namespace
    ctx.namespace = prevNamespace;

    return html;
  }

  return "";
}

/**
 * Set the global component renderer for SSR DSD output.
 * Call this before rendering to enable DSD for registered Web Components.
 * @param renderer - Component renderer callback, or undefined to clear.
 */
function setComponentRenderer(renderer: ComponentRenderer | undefined): void {
  globalComponentRenderer = renderer;
}

/**
 * Render a tree to HTML string.
 */
function renderTree(tree: Tree[], options: RenderOptions = {}): string {
  const ctx = createContext(options);
  let html = "";

  for (const node of tree) {
    html += renderNode(node, ctx);
  }

  // Include state script if requested
  if (options.includeState && Object.keys(ctx.state).length > 0) {
    html = createStateScript(serializeState(ctx.state)) + html;
  }

  return html;
}

/**
 * Render a tree to a complete HTML string with state.
 */
function renderToString(
  tree: Tree[],
  state: StateObject = {},
  dynamicValues: Map<number, unknown> = new Map(),
  componentRenderer?: ComponentRenderer,
): string {
  return renderTree(tree, {
    state,
    dynamicValues,
    includeState: Object.keys(state).length > 0,
    componentRenderer,
  });
}

export { createContext, renderToString, renderTree, setComponentRenderer };
export type { ComponentRenderer, RenderContext, RenderOptions };
