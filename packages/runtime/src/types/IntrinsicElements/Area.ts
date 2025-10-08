import { CommonIntrinsicElements } from "./Common";

type AreaTarget = "_self" | "_blank" | "_parent" | "_top" | (string & {});

type AreaReferrerPolicy =
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url";

/**
 * Attributes for the `<area>` element, which defines a clickable area inside an image map.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area
 */
interface AreaIntrinsicElements extends CommonIntrinsicElements {
  /** Alternative text for the area */
  alt?: string;
  /** Coordinates for the clickable area */
  coords?: string;
  /** Hints for file downloads */
  download?: string | boolean;
  /** URL of the hyperlinked resource */
  href?: string;
  /** Language of the linked resource */
  hrefLang?: string;
  /** Media query for the linked resource */
  media?: string;
  /** URLs to ping when the link is followed */
  ping?: string;
  /** Referrer policy for fetches initiated by the element */
  referrerPolicy?: AreaReferrerPolicy;
  /** Relationship of the linked resource */
  rel?: string;
  /** Shape of the clickable area */
  shape?: "rect" | "circle" | "poly" | "default";
  /** Where to display the linked URL */
  target?: AreaTarget;
  /** <area> is a void element */
  children?: never;
}

export { AreaIntrinsicElements, AreaTarget, AreaReferrerPolicy };
