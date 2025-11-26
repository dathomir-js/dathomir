import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Attributes for the `<ol>` element, which represents an ordered list.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol
 */
interface OlIntrinsicElements extends CommonIntrinsicElements {
  /** Whether the list order is reversed */
  reversed?: boolean;
  /** Starting value of the ordered list */
  start?: number;
  /** Type of marker to use */
  type?: "1" | "a" | "A" | "i" | "I";
}

export { OlIntrinsicElements };
