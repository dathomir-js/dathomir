import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<data>` element, which links content with a machine-readable translation.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data
 */
interface DataIntrinsicElements extends CommonIntrinsicElements {
  /** Machine-readable translation of the content */
  value?: string;
}

export { DataIntrinsicElements };
