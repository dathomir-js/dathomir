import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

type StyleBlocking = "render";

type StyleChildren = string | string[];

/**
 * Attributes and content model for the `<style>` element containing embedded CSS.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style
 */
interface StyleIntrinsicElements extends CommonIntrinsicElements {
  /** Blocks rendering until the stylesheet is applied */
  blocking?: StyleBlocking;
  /** Media query controlling when styles apply */
  media?: string;
  /** Indicates whether the stylesheet is disabled */
  disabled?: boolean;
  /** Deprecated scoped stylesheet flag */
  scoped?: boolean;
  /** MIME type for the stylesheet */
  type?: "text/css" | (string & {});
  /** Embedded CSS text content */
  children?: StyleChildren;
}

export { StyleIntrinsicElements, StyleBlocking };
