import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

type MetaHttpEquivValue =
  | "content-security-policy"
  | "content-type"
  | "default-style"
  | "refresh"
  | "x-ua-compatible"
  | "referrer"
  | (string & {});

/**
 * Attributes for the `<meta>` element covering charset, pragma directives, and named metadata.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta
 */
interface MetaIntrinsicElements extends CommonIntrinsicElements {
  /** Declares the document encoding */
  charset?: "utf-8" | (string & {});
  /** Value associated with name or http-equiv */
  content?: string;
  /** Pragma directive equivalent to an HTTP header */
  httpEquiv?: MetaHttpEquivValue;
  /** Name for metadata name/value pairs */
  name?: string;
  /** Media query for theme-color metadata */
  media?: string;
  /** RDFa property attribute (e.g. Open Graph) */
  property?: string;
  /** <meta> is a void element */
  children?: never;
}

export { MetaIntrinsicElements, MetaHttpEquivValue };
