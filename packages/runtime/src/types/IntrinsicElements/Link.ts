import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

type LinkAsValue =
  | "audio"
  | "document"
  | "embed"
  | "fetch"
  | "font"
  | "image"
  | "object"
  | "script"
  | "style"
  | "track"
  | "video"
  | "worker"
  | (string & {});

type LinkReferrerPolicy =
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url";

type LinkBlocking = "render";

type LinkTarget = "_self" | "_blank" | "_parent" | "_top" | (string & {});

/**
 * Attributes available on the `<link>` element for external resource hints and stylesheets.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
 */
interface LinkIntrinsicElements extends CommonIntrinsicElements {
  /** Request destination hint for preload/modulepreload */
  as?: LinkAsValue;
  /** Blocks rendering until the stylesheet or expectation resolves */
  blocking?: LinkBlocking;
  /** CORS mode for the linked resource */
  crossOrigin?: "anonymous" | "use-credentials";
  /** Disables a stylesheet link until enabled */
  disabled?: boolean;
  /** Relative priority hint when fetching */
  fetchPriority?: "high" | "low" | "auto";
  /** Linked resource URL */
  href?: string;
  /** Language of the linked resource */
  hrefLang?: string;
  /** Image sizes hint for preload */
  imageSizes?: string;
  /** Image source set hint for preload */
  imageSrcset?: string;
  /** Subresource integrity metadata */
  integrity?: string;
  /** Applicable media query */
  media?: string;
  /** Controls referrer information when fetching */
  referrerPolicy?: LinkReferrerPolicy;
  /** Relationship between current document and linked resource */
  rel?: string;
  /** Icon size hints */
  sizes?: string;
  /** Default browsing context for the link */
  target?: LinkTarget;
  /** MIME type of the linked resource */
  type?: string;
  /** Icon color hint, e.g. for mask icons */
  color?: string;
  /** <link> is a void element */
  children?: never;
}

export { LinkIntrinsicElements, LinkAsValue, LinkReferrerPolicy };
