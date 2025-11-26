import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

type IframeLoading = "eager" | "lazy";
type IframeReferrerPolicy =
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url";
type IframeSandbox =
  | "allow-forms"
  | "allow-modals"
  | "allow-orientation-lock"
  | "allow-pointer-lock"
  | "allow-popups"
  | "allow-popups-to-escape-sandbox"
  | "allow-presentation"
  | "allow-same-origin"
  | "allow-scripts"
  | "allow-top-navigation"
  | "allow-top-navigation-by-user-activation"
  | "allow-top-navigation-to-custom-protocols";

/**
 * Attributes for the `<iframe>` element, which embeds another HTML page.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
 */
interface IframeIntrinsicElements extends CommonIntrinsicElements {
  /** Permissions policy for the iframe */
  allow?: string;
  /** Whether to allow fullscreen */
  allowFullscreen?: boolean;
  /** Height of the iframe */
  height?: number | string;
  /** Indicates how the browser should load the iframe */
  loading?: IframeLoading;
  /** Name of the iframe for targeting */
  name?: string;
  /** Referrer policy for fetches initiated by the iframe */
  referrerPolicy?: IframeReferrerPolicy;
  /** Security restrictions for the iframe content */
  sandbox?: IframeSandbox | string;
  /** URL of the page to embed */
  src?: string;
  /** Inline HTML to embed */
  srcDoc?: string;
  /** Width of the iframe */
  width?: number | string;
}

export { IframeIntrinsicElements, IframeLoading, IframeReferrerPolicy, IframeSandbox };
