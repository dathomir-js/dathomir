import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Attributes for the `<wbr>` element, which represents a word break opportunity.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/wbr
 */
interface WbrIntrinsicElements extends CommonIntrinsicElements {
  /** <wbr> is a void element */
  children?: never;
}

export { WbrIntrinsicElements };
