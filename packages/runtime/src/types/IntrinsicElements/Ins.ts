import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Attributes for the `<ins>` element, which represents inserted text.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins
 */
interface InsIntrinsicElements extends CommonIntrinsicElements {
  /** URL that explains the change */
  cite?: string;
  /** Date and time of the change */
  dateTime?: string;
}

export { InsIntrinsicElements };
