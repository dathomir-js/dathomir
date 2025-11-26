import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Attributes for the `<details>` element, which creates a disclosure widget.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details
 */
interface DetailsIntrinsicElements extends CommonIntrinsicElements {
  /** Whether the details are visible */
  open?: boolean;
}

export { DetailsIntrinsicElements };
