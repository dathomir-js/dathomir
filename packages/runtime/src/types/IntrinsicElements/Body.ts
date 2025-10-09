import { CommonIntrinsicElements } from "./Common";

type BodyEventHandler<E extends Event = Event> = (event: E) => void;

/**
 * Attributes and lifecycle event handlers available on the `<body>` element.
 * Extends global attributes with window-level navigation and network events.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body
 */
interface BodyIntrinsicElements
  extends Omit<CommonIntrinsicElements, "onError"> {
  /** Fired after the print dialog is closed */
  onAfterPrint?: BodyEventHandler;
  /** Fired right before the print dialog is shown */
  onBeforePrint?: BodyEventHandler;
  /** Fired when the document is about to be unloaded */
  onBeforeUnload?: BodyEventHandler<BeforeUnloadEvent>;
  /** Fired when a resource loading error occurs */
  onError?: BodyEventHandler<ErrorEvent>;
  /** Fired when the fragment identifier of the URL changes */
  onHashChange?: BodyEventHandler<HashChangeEvent>;
  /** Fired when the user's preferred languages change */
  onLanguageChange?: BodyEventHandler;
  /** Fired once the document and dependent resources are fully loaded */
  onLoad?: BodyEventHandler;
  /** Fired when a message is received via messaging APIs */
  onMessage?: BodyEventHandler<MessageEvent>;
  /** Fired when a received message cannot be deserialized */
  onMessageError?: BodyEventHandler<MessageEvent>;
  /** Fired when the browser detects network disconnection */
  onOffline?: BodyEventHandler;
  /** Fired when the browser regains network connectivity */
  onOnline?: BodyEventHandler;
  /** Fired when the page becomes hidden during a session navigation */
  onPageHide?: BodyEventHandler<PageTransitionEvent>;
  /** Fired when a page is revealed after being frozen or discarded */
  onPageReveal?: BodyEventHandler;
  /** Fired when the page becomes visible during a session navigation */
  onPageShow?: BodyEventHandler<PageTransitionEvent>;
  /** Fired when navigating away triggers a page swap */
  onPageSwap?: BodyEventHandler;
  /** Fired when the active history entry changes */
  onPopState?: BodyEventHandler<PopStateEvent>;
  /** Fired when a previously rejected promise gets a handler */
  onRejectionHandled?: BodyEventHandler<PromiseRejectionEvent>;
  /** Fired when the viewport size changes */
  onResize?: BodyEventHandler<UIEvent>;
  /** Fired when `localStorage` or `sessionStorage` data changes */
  onStorage?: BodyEventHandler<StorageEvent>;
  /** Fired when an unhandled promise rejection occurs */
  onUnhandledRejection?: BodyEventHandler<PromiseRejectionEvent>;
  /** Fired when the document is unloading */
  onUnload?: BodyEventHandler;
}

export { BodyIntrinsicElements, BodyEventHandler };
