import { CommonIntrinsicElements } from "./Common";

type AudioPreload = "none" | "metadata" | "auto" | "";

/**
 * Attributes for the `<audio>` element, which embeds sound content.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
 */
interface AudioIntrinsicElements extends CommonIntrinsicElements {
  /** Whether to automatically start playing the audio */
  autoPlay?: boolean;
  /** Whether to show the default media controls */
  controls?: boolean;
  /** Customizes which controls to show */
  controlsList?: string;
  /** CORS settings for the audio */
  crossOrigin?: "anonymous" | "use-credentials";
  /** Whether to disable remote playback */
  disableRemotePlayback?: boolean;
  /** Whether to loop the audio */
  loop?: boolean;
  /** Whether the audio is muted by default */
  muted?: boolean;
  /** Hints for how much buffering the media should do */
  preload?: AudioPreload;
  /** URL of the audio resource */
  src?: string;
}

export { AudioIntrinsicElements, AudioPreload };
