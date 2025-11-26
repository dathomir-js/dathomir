import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Attributes for the `<del>` element, which represents deleted text.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del
 */
interface DelIntrinsicElements extends CommonIntrinsicElements {
  /** URL that explains the change */
  cite?: string;
  /** Date and time of the change */
  dateTime?: string;
}

export { DelIntrinsicElements };
