import { CommonIntrinsicElements } from "./Common";

type VideoPreload = "none" | "metadata" | "auto" | "";

/**
 * Attributes for the `<video>` element, which embeds video content.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
 */
interface VideoIntrinsicElements extends CommonIntrinsicElements {
  /** Whether to automatically start playing the video */
  autoPlay?: boolean;
  /** Whether to show the default media controls */
  controls?: boolean;
  /** Customizes which controls to show */
  controlsList?: string;
  /** CORS settings for the video */
  crossOrigin?: "anonymous" | "use-credentials";
  /** Whether to disable picture-in-picture mode */
  disablePictureInPicture?: boolean;
  /** Whether to disable remote playback */
  disableRemotePlayback?: boolean;
  /** Intrinsic height of the video in pixels */
  height?: number | string;
  /** Whether to loop the video */
  loop?: boolean;
  /** Whether the video is muted by default */
  muted?: boolean;
  /** Whether the video should play inline on mobile devices */
  playsInline?: boolean;
  /** Image to show while the video is downloading */
  poster?: string;
  /** Hints for how much buffering the media should do */
  preload?: VideoPreload;
  /** URL of the video resource */
  src?: string;
  /** Intrinsic width of the video in pixels */
  width?: number | string;
}

export { VideoIntrinsicElements, VideoPreload };
