import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<q>` element, which represents an inline quotation.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q
 */
interface QIntrinsicElements extends CommonIntrinsicElements {
  /** URL of the source of the quotation */
  cite?: string;
}

export { QIntrinsicElements };
