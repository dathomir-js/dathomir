import { CommonIntrinsicElements } from "./Common";

type ImgDecoding = "sync" | "async" | "auto";
type ImgLoading = "eager" | "lazy";
type ImgReferrerPolicy =
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url";

/**
 * Attributes for the `<img>` element, which embeds an image.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img
 */
interface ImgIntrinsicElements extends CommonIntrinsicElements {
  /** Alternative text for the image */
  alt?: string;
  /** CORS settings for the image */
  crossOrigin?: "anonymous" | "use-credentials";
  /** Hint for how the browser should decode the image */
  decoding?: ImgDecoding;
  /** Relative importance for resource loading */
  fetchPriority?: "high" | "low" | "auto";
  /** Intrinsic height of the image in pixels */
  height?: number | string;
  /** Whether the image is part of a server-side image map */
  isMap?: boolean;
  /** Indicates how the browser should load the image */
  loading?: ImgLoading;
  /** Referrer policy for fetches initiated by the element */
  referrerPolicy?: ImgReferrerPolicy;
  /** Image sizes for different layouts */
  sizes?: string;
  /** URL of the image */
  src?: string;
  /** Image source set for responsive images */
  srcSet?: string;
  /** Image map to associate with the element */
  useMap?: string;
  /** Intrinsic width of the image in pixels */
  width?: number | string;
  /** <img> is a void element */
  children?: never;
}

export { ImgIntrinsicElements, ImgDecoding, ImgLoading, ImgReferrerPolicy };
