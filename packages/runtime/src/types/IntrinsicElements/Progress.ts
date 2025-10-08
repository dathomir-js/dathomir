import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<progress>` element, which displays an indicator showing the completion progress of a task.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress
 */
interface ProgressIntrinsicElements extends CommonIntrinsicElements {
  /** Maximum value of the progress bar */
  max?: number;
  /** Current value of the progress bar */
  value?: number;
}

export { ProgressIntrinsicElements };
