import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Attributes for the `<source>` element, which specifies multiple media resources.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source
 */
interface SourceIntrinsicElements extends CommonIntrinsicElements {
  /** Height of the media resource (for picture element) */
  height?: number | string;
  /** Applicable media query */
  media?: string;
  /** Image sizes for different layouts */
  sizes?: string;
  /** URL of the media resource */
  src?: string;
  /** Image source set for responsive images */
  srcSet?: string;
  /** MIME type of the media resource */
  type?: string;
  /** Width of the media resource (for picture element) */
  width?: number | string;
  /** <source> is a void element */
  children?: never;
}

export { SourceIntrinsicElements };
