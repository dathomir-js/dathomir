import { setAttr } from "@/dom/attr/implementation";

type SpreadProps = Record<string, unknown>;

/**
 * WeakMap to store event handlers for each element.
 * This allows us to properly remove old handlers when props change.
 */
const eventHandlerMap = new WeakMap<Element, Map<string, EventListener>>();

/**
 * Check if a key-value pair is an event handler.
 */
function isEventHandler(key: string, value: unknown): value is EventListener {
  return key.startsWith("on") && key.length > 2 && typeof value === "function";
}

/**
 * Convert event key to event type (e.g., onClick -> click).
 */
function getEventType(key: string): string {
  return key.slice(2).toLowerCase();
}

/**
 * Add or update an event handler on an element.
 * Removes the previous handler if it exists.
 */
function setEventHandler(
  element: Element,
  eventType: string,
  handler: EventListener,
): void {
  let handlers = eventHandlerMap.get(element);
  if (handlers === undefined) {
    handlers = new Map();
    eventHandlerMap.set(element, handlers);
  }

  // Remove previous handler if exists
  const prevHandler = handlers.get(eventType);
  if (prevHandler !== undefined) {
    element.removeEventListener(eventType, prevHandler);
  }

  // Add new handler
  element.addEventListener(eventType, handler);
  handlers.set(eventType, handler);
}

/**
 * Remove an event handler from an element.
 */
function removeEventHandler(element: Element, eventType: string): void {
  const handlers = eventHandlerMap.get(element);
  if (handlers !== undefined) {
    const handler = handlers.get(eventType);
    if (handler !== undefined) {
      element.removeEventListener(eventType, handler);
      handlers.delete(eventType);
    }
  }
}

/**
 * Spread props onto an element, diffing against previous props.
 * Returns the new props object to be used as prev in the next call.
 *
 * @param element The element to apply props to.
 * @param prev The previous props object (or null on first call).
 * @param next The new props object.
 * @returns The next props object (for use as prev in next call).
 */
function spread(
  element: Element,
  prev: SpreadProps | null,
  next: SpreadProps,
): SpreadProps {
  const prevProps = prev ?? {};

  // Apply new/changed props
  for (const key of Object.keys(next)) {
    const nextValue = next[key];
    const prevValue = prevProps[key];

    if (prevValue !== nextValue) {
      if (isEventHandler(key, nextValue)) {
        // Use our own event handler management
        setEventHandler(element, getEventType(key), nextValue);
      } else {
        setAttr(element, key, nextValue);
      }
    }
  }

  // Remove props that are no longer present
  for (const key of Object.keys(prevProps)) {
    if (!(key in next)) {
      if (isEventHandler(key, prevProps[key])) {
        // Remove the event handler
        removeEventHandler(element, getEventType(key));
      } else {
        setAttr(element, key, null);
      }
    }
  }

  return next;
}

export { spread };
export type { SpreadProps };
