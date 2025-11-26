import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Attributes for the `<svg>` element, which defines a container for SVG graphics.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/svg
 */
interface SvgIntrinsicElements extends CommonIntrinsicElements {
  /** Height of the SVG viewport */
  height?: number | string;
  /** Preserves the aspect ratio */
  preserveAspectRatio?: string;
  /** Defines the coordinate system and viewport */
  viewBox?: string;
  /** Width of the SVG viewport */
  width?: number | string;
  /** Namespace for SVG */
  xmlns?: string;
}

export { SvgIntrinsicElements };
