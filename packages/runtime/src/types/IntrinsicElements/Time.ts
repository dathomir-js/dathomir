import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Attributes for the `<time>` element, which represents a specific period in time.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time
 */
interface TimeIntrinsicElements extends CommonIntrinsicElements {
  /** Machine-readable datetime value */
  dateTime?: string;
}

export { TimeIntrinsicElements };
