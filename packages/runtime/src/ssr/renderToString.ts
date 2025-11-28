import { toUnreactive } from "@dathomir/reactivity";

import { Fragment } from "@/jsx-runtime/index";
import type { VNode, VNodeChild } from "@/types";
import { isReactive, isVNode, normalizeStyle, VOID_ELEMENTS } from "@/utils";

import type { Computed } from "@dathomir/reactivity";

/** Escape HTML special characters (&, <, >, ", '). */
function defaultEscape(value: unknown): string {
  const str = String(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface RenderToStringOptions {
  escape?: (text: unknown) => string;
  /** Optional attribute filter hook (future extension). */
  attributeFilter?: (key: string, value: unknown) => boolean;
  /** Hydration key generation mode: 'struct' (increment for every child position) | 'host' (increment only for host elements). */
  keyMode?: "struct" | "host";
}

/** Map JSX attribute names to their HTML equivalents (React-compatible). */
const JSX_TO_HTML_ATTR: Record<string, string> = {
  htmlFor: "for",
  // 必要に応じて追加: tabIndex -> tabindex, etc.
};

/** Serialize props into HTML attributes (filtering and name normalization). */
function serializeProps(
  props: Record<string, any> | undefined,
  escape: (v: unknown) => string,
  attrFilter?: (key: string, value: unknown) => boolean,
): string {
  if (!props) return "";
  let out = "";
  for (const key in props) {
    const value = props[key];
    if (key === "children") continue; // jsx-runtime で除外済み想定
    if (key === "ref") continue; // SSR では無視
    if (key.startsWith("on")) continue; // イベントは除外 (XSS 対策 & 無意味)
    if (key === "className") continue;
    if (value === null || value === undefined || value === false) continue;
    if (attrFilter && !attrFilter(key, value)) continue;

    // JSX 属性名 → HTML 属性名に変換
    const htmlKey = JSX_TO_HTML_ATTR[key] ?? key;

    // boolean true は key のみ (HTML 属性省略形)
    if (value === true) {
      out += ` ${htmlKey}`;
      continue;
    }

    // style object -> kebab-case + escape
    if (key === "style") {
      const styleStr = normalizeStyle(value);
      if (styleStr !== null) {
        out += ` style="${escape(styleStr)}"`;
      }
      continue;
    }

    const escaped = escape(value);
    out += ` ${htmlKey}="${escaped}"`;
  }
  return out;
}

interface HydrationContext {
  id: string; // Current node id (root = "0")
  next: number; // Local child index counter
}

function renderChild(
  child: VNodeChild,
  escape: (v: unknown) => string,
  opts: RenderToStringOptions,
  ctx: HydrationContext,
): string {
  const mode = opts.keyMode ?? "struct";
  // struct mode: consume index for every child slot (including text / fragment expansion)
  if (mode === "struct") {
    const childIndex = ctx.next++;
    const childId = ctx.id === "" ? "0" : `${ctx.id}.${childIndex}`;
    if (isReactive(child)) {
      const unwrapped = toUnreactive(child);
      return renderChild(unwrapped as VNodeChild, escape, opts, ctx);
    }
    const staticVal = isVNode(child) ? child : toUnreactive(child);
    if (Array.isArray(staticVal)) {
      return staticVal
        .map((c) => renderChild(c as any, escape, opts, ctx))
        .join("");
    }
    if (typeof staticVal === "string" || typeof staticVal === "number") {
      return escape(staticVal);
    }
    if (isVNode(staticVal)) {
      const childCtx: HydrationContext = { id: childId, next: 0 };
      return renderVNode(staticVal, escape, opts, childCtx);
    }
    return "";
  }
  // host mode: increment only when encountering a host element (skips plain text / fragments)
  if (isReactive(child)) {
    const unwrapped = toUnreactive(child);
    return renderChild(unwrapped as VNodeChild, escape, opts, ctx);
  }
  const staticVal = isVNode(child) ? child : toUnreactive(child);
  if (Array.isArray(staticVal)) {
    return staticVal
      .map((c) => renderChild(c as any, escape, opts, ctx))
      .join("");
  }
  if (typeof staticVal === "string" || typeof staticVal === "number") {
    return escape(staticVal);
  }
  if (isVNode(staticVal)) {
    if (staticVal.t === (Fragment as any)) {
      const children = staticVal.c || [];
      return children.map((c) => renderChild(c, escape, opts, ctx)).join("");
    }
    if (typeof staticVal.t === "string") {
      const childIndex = ctx.next++;
      const childId = ctx.id === "" ? "0" : `${ctx.id}.${childIndex}`;
      const childCtx: HydrationContext = { id: childId, next: 0 };
      return renderVNode(staticVal, escape, opts, childCtx);
    }
  }
  return "";
}

function renderVNode(
  vNode: VNode,
  escape: (v: unknown) => string,
  opts: RenderToStringOptions,
  ctx: HydrationContext,
): string {
  // Fragment: logical wrapper, does not emit own tag.
  if (vNode.t === (Fragment as any)) {
    const children = vNode.c || [];
    return children.map((c) => renderChild(c, escape, opts, ctx)).join("");
  }
  // Host element.
  if (typeof vNode.t === "string") {
    const tag = vNode.t;
    const unwrappedProps = toUnreactive(vNode.p);
    const attrs = serializeProps(unwrappedProps, escape, opts.attributeFilter);
    const children = vNode.c || [];
    const hasUserHydrationKey = unwrappedProps && "data-hk" in unwrappedProps;
    const hkAttr = hasUserHydrationKey ? "" : ` data-hk="${ctx.id}"`;
    if (VOID_ELEMENTS.has(tag)) {
      return `<${tag}${hkAttr}${attrs}>`;
    }
    const childCtx: HydrationContext = { id: ctx.id, next: 0 };
    const inner = children
      .map((c) => renderChild(c, escape, opts, childCtx))
      .join("");
    return `<${tag}${hkAttr}${attrs}>${inner}</${tag}>`;
  }
  return "";
}

/** Convert a VNode (possibly reactive) tree into an HTML string. */
function renderToString(
  vNode: VNode | Computed<VNode>,
  options?: RenderToStringOptions,
): string {
  const escape = options?.escape ?? defaultEscape;

  // If vNode is a Computed<VNode>, unwrap it
  const rootCtx: HydrationContext = { id: "0", next: 0 };
  if (isReactive(vNode)) {
    const unwrapped = toUnreactive(vNode);
    if (isVNode(unwrapped)) {
      return renderVNode(unwrapped, escape, options || {}, rootCtx);
    }
    return "";
  }
  return renderVNode(vNode, escape, options || {}, rootCtx);
}

export { renderToString };
export type { RenderToStringOptions };
