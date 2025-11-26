import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Attributes for the `<math>` element, which defines a MathML fragment.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/math
 */
interface MathIntrinsicElements extends CommonIntrinsicElements {
  /** Display style for the math content */
  display?: "block" | "inline";
  /** Namespace for MathML */
  xmlns?: string;
}

export { MathIntrinsicElements };
