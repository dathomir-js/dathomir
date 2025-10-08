import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<optgroup>` element, which creates a grouping of options within a select.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup
 */
interface OptgroupIntrinsicElements extends CommonIntrinsicElements {
  /** Whether the optgroup is disabled */
  disabled?: boolean;
  /** Label for the optgroup */
  label?: string;
}

export { OptgroupIntrinsicElements };
