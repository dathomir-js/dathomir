import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<meter>` element, which represents a scalar measurement within a known range.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter
 */
interface MeterIntrinsicElements extends CommonIntrinsicElements {
  /** Upper numeric bound of the high end */
  high?: number;
  /** Lower numeric bound of the low end */
  low?: number;
  /** Upper numeric bound of the measured range */
  max?: number;
  /** Lower numeric bound of the measured range */
  min?: number;
  /** Optimum numeric value */
  optimum?: number;
  /** Current numeric value */
  value?: number;
}

export { MeterIntrinsicElements };
