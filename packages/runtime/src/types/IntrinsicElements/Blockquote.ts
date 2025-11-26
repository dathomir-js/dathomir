import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Attributes for the `<blockquote>` element, which represents a section quoted from another source.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote
 */
interface BlockquoteIntrinsicElements extends CommonIntrinsicElements {
  /** URL of the source of the quote */
  cite?: string;
}

export { BlockquoteIntrinsicElements };
