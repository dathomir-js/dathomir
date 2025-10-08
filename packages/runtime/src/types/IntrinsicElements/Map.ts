import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<map>` element, which defines an image map with clickable areas.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map
 */
interface MapIntrinsicElements extends CommonIntrinsicElements {
  /** Name of the image map (for use with usemap attribute) */
  name?: string;
}

export { MapIntrinsicElements };
