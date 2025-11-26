import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Attributes for the `<slot>` element, which is a placeholder inside a web component.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot
 */
interface SlotIntrinsicElements extends CommonIntrinsicElements {
  /** Name of the slot */
  name?: string;
}

export { SlotIntrinsicElements };
