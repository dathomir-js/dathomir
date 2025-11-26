import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

type ATarget = "_self" | "_blank" | "_parent" | "_top" | (string & {});

type AReferrerPolicy =
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url";

/**
 * Attributes for the `<a>` element, which creates hyperlinks.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a
 */
interface AIntrinsicElements extends CommonIntrinsicElements {
  /** URL of the hyperlinked resource */
  href?: string;
  /** Where to display the linked URL */
  target?: ATarget;
  /** Relationship between current document and linked URL */
  rel?: string;
  /** Hints for file downloads */
  download?: string | boolean;
  /** Language of the linked resource */
  hrefLang?: string;
  /** Media query for the linked resource */
  media?: string;
  /** MIME type of the linked resource */
  type?: string;
  /** Prompts the user to save linked content */
  ping?: string;
  /** Referrer policy for fetches initiated by the element */
  referrerPolicy?: AReferrerPolicy;
}

export { AIntrinsicElements, AReferrerPolicy, ATarget };
