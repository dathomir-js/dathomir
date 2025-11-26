import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

type TrackKind =
  | "subtitles"
  | "captions"
  | "descriptions"
  | "chapters"
  | "metadata";

/**
 * Attributes for the `<track>` element, which specifies timed text tracks for media elements.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track
 */
interface TrackIntrinsicElements extends CommonIntrinsicElements {
  /** Whether the track should be enabled by default */
  default?: boolean;
  /** Kind of text track */
  kind?: TrackKind;
  /** User-visible label for the track */
  label?: string;
  /** URL of the track file */
  src?: string;
  /** Language of the track text data */
  srcLang?: string;
  /** <track> is a void element */
  children?: never;
}

export { TrackIntrinsicElements, TrackKind };
