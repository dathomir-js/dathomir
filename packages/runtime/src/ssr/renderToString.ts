/**
 * SSR rendering: Convert a VNode tree into an HTML string.
 * 実装ポリシー (Phase 1 初期版):
 * - 副作用なし純粋関数
 * - reactive 値は @dathomir/reactivity の toUnreactive で静的化
 * - 危険な on* / ref / style=(object)/boolean/null/undefined の扱いを明示
 * - XSS 対策: テキスト / 属性値に escape を適用
 */

import { toUnreactive } from "@dathomir/reactivity";
import { kebabCase } from "@dathomir/shared"; // style(object) で使用

import type { VNode, VNodeChild } from "@/types";
import type { Computed } from "@dathomir/reactivity";

/** HTML テキストエスケープ (&, <, >, \", ') */
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
  /** 将来: 属性フィルタ拡張用 */
  attributeFilter?: (key: string, value: unknown) => boolean;
}

/** void 要素 (子要素/終了タグ不要) */
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

/** 属性シリアライズ: フィルタリングと変換 */
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
    if (value === null || value === undefined || value === false) continue;
    if (attrFilter && !attrFilter(key, value)) continue;

    // boolean true は key のみ (HTML 属性省略形)
    if (value === true) {
      out += ` ${key}`;
      continue;
    }

    // style object -> kebab-case + escape
    if (key === "style" && typeof value === "object" && !Array.isArray(value)) {
      const styleObj = value as Record<string, unknown>;
      const styleStr = Object.keys(styleObj)
        .map((prop) => {
          const cssVal = styleObj[prop];
          if (cssVal === null || cssVal === undefined || cssVal === false) {
            return ""; // 削除対象は省略
          }
          const name = kebabCase(prop);
          return `${name}:${String(cssVal)}`;
        })
        .filter(Boolean)
        .join(";");
      out += ` style="${escape(styleStr)}"`;
      continue;
    }

    const escaped = escape(value);
    out += ` ${key}="${escaped}"`;
  }
  return out;
}

function isVNode(value: unknown): value is VNode {
  return !!value && typeof value === "object" && "t" in value;
}

function isReactive(value: unknown): value is Computed<unknown> {
  return (
    !!value &&
    typeof value === "object" &&
    "__type__" in value &&
    (value as any).__type__ === "computed" &&
    "value" in value &&
    "peek" in value
  );
}

function normalizeChildren(children: VNodeChild[] | undefined): VNodeChild[] {
  if (!children) return [];
  return children.flatMap((ch) => {
    if (ch === null || ch === undefined || ch === false) return [];
    return [ch];
  });
}

function renderChild(
  child: VNodeChild,
  escape: (v: unknown) => string,
  opts: RenderToStringOptions,
): string {
  // Check if reactive first, then unwrap
  if (isReactive(child)) {
    const unwrapped = toUnreactive(child);
    return renderChild(unwrapped as VNodeChild, escape, opts);
  }

  // VNode はそのまま、その他は reactive unwrap
  const staticVal = isVNode(child) ? child : toUnreactive(child);
  // Primitive text
  if (
    typeof staticVal === "string" ||
    typeof staticVal === "number"
    // boolean は SSR テキストノード化しない (true/false は表示不要)
  ) {
    return escape(staticVal);
  }
  // Nested VNode
  if (isVNode(staticVal)) {
    return renderVNode(staticVal, escape, opts);
  }
  // Array -> join
  if (Array.isArray(staticVal)) {
    return staticVal.map((c) => renderChild(c as any, escape, opts)).join("");
  }
  return "";
}

function renderVNode(
  vNode: VNode,
  escape: (v: unknown) => string,
  opts: RenderToStringOptions,
): string {
  // Host element
  if (typeof vNode.t === "string") {
    const tag = vNode.t;
    const unwrappedProps = toUnreactive(vNode.p);
    const attrs = serializeProps(unwrappedProps, escape, opts.attributeFilter);
    const children = normalizeChildren(vNode.c);
    const inner = VOID_ELEMENTS.has(tag)
      ? ""
      : children.map((c) => renderChild(c, escape, opts)).join("");
    if (VOID_ELEMENTS.has(tag)) {
      return `<${tag}${attrs}>`;
    }
    return `<${tag}${attrs}>${inner}</${tag}>`;
  }
  return "";
}

/**
 * Convert a VNode tree to HTML string (SSR initial version).
 */
function renderToString(
  vNode: VNode | Computed<VNode>,
  options?: RenderToStringOptions,
): string {
  const escape = options?.escape ?? defaultEscape;

  // If vNode is a Computed<VNode>, unwrap it
  if (isReactive(vNode)) {
    const unwrapped = toUnreactive(vNode);
    if (isVNode(unwrapped)) {
      return renderVNode(unwrapped, escape, options || {});
    }
    return "";
  }

  return renderVNode(vNode, escape, options || {});
}

export type { RenderToStringOptions };
export { renderToString };
