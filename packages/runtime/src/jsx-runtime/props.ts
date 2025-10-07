import { effect } from "../reactivity";
import { isReactiveNode } from "./guards";
import type { ReactiveLike } from "./guards";

/**
 * Normalized representation of an event listener with its registration options.
 */
type EventListenerDescriptor = {
  listener: EventListenerOrEventListenerObject;
  options?: boolean | AddEventListenerOptions;
};

/**
 * Determine whether a JSX property name represents an event listener.
 */
const isEventProp = (key: string): boolean => {
  return key.startsWith("on") && key.length > 2;
};

const extractEventName = (key: string): string => {
  return key.slice(2).toLowerCase();
};

const isEventListenerObject = (
  value: unknown
): value is EventListenerObject => {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as EventListenerObject).handleEvent === "function"
  );
};

const isEventListener = (
  value: unknown
): value is EventListenerOrEventListenerObject => {
  return typeof value === "function" || isEventListenerObject(value);
};

const unwrapReactive = (value: unknown): unknown => {
  let current = value;
  while (isReactiveNode(current)) {
    current = current.value;
  }
  return current;
};

const createAddEventOptions = (
  value: Record<string, unknown>
): boolean | AddEventListenerOptions | undefined => {
  const directOptions = value.options;

  if (directOptions !== undefined) {
    return directOptions as boolean | AddEventListenerOptions;
  }

  const { capture, once, passive, signal } = value as {
    capture?: boolean;
    once?: boolean;
    passive?: boolean;
    signal?: AbortSignal;
  };

  if (
    capture === undefined &&
    once === undefined &&
    passive === undefined &&
    signal === undefined
  ) {
    return undefined;
  }

  const options: AddEventListenerOptions = {};

  if (capture !== undefined) {
    options.capture = capture;
  }
  if (once !== undefined) {
    options.once = once;
  }
  if (passive !== undefined) {
    options.passive = passive;
  }
  if (signal !== undefined) {
    options.signal = signal;
  }

  return options;
};

const createDescriptor = (
  candidate: unknown
): EventListenerDescriptor | null => {
  const resolved = unwrapReactive(candidate);

  if (!resolved) {
    return null;
  }

  if (isEventListener(resolved)) {
    return { listener: resolved };
  }

  if (typeof resolved === "object") {
    const record = resolved as Record<string, unknown>;
    const listener = unwrapReactive(record.listener);

    if (isEventListener(listener)) {
      return {
        listener,
        options: createAddEventOptions(record),
      };
    }
  }

  return null;
};

const collectDescriptors = (
  value: unknown,
  descriptors: EventListenerDescriptor[]
) => {
  const resolved = unwrapReactive(value);

  if (Array.isArray(resolved)) {
    for (const item of resolved) {
      collectDescriptors(item, descriptors);
    }
    return;
  }

  const descriptor = createDescriptor(resolved);
  if (descriptor) {
    descriptors.push(descriptor);
  }
};

const normalizeEventValue = (value: unknown): EventListenerDescriptor[] => {
  const descriptors: EventListenerDescriptor[] = [];
  collectDescriptors(value, descriptors);
  return descriptors;
};

const updateEventListeners = (
  element: Element,
  eventName: string,
  previous: EventListenerDescriptor[],
  next: EventListenerDescriptor[]
) => {
  for (const { listener, options } of previous) {
    element.removeEventListener(eventName, listener, options);
  }

  for (const { listener, options } of next) {
    element.addEventListener(eventName, listener, options);
  }
};

const toKebabCase = (value: string): string => {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
};

const applyStyleObject = (element: Element, value: Record<string, unknown>) => {
  if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
    return;
  }

  const style = element.style;

  for (const styleKey in value) {
    const styleValue = value[styleKey];
    const propertyName = toKebabCase(styleKey);

    if (
      styleValue === null ||
      styleValue === undefined ||
      styleValue === false
    ) {
      style.removeProperty(propertyName);
    } else {
      style.setProperty(propertyName, String(styleValue));
    }
  }
};

const applyPropertyValue = (element: Element, key: string, value: unknown) => {
  if (key === "ref") {
    if (typeof value === "function") {
      value(element);
    } else if (value && typeof value === "object" && "current" in value) {
      (value as { current: Element | null }).current = element;
    }
    return;
  }

  if (key === "class" || key === "className") {
    if (value === false || value === null || value === undefined) {
      element.removeAttribute("class");
    } else {
      element.setAttribute("class", String(value));
    }
    return;
  }

  if (key === "style") {
    if (value === false || value === null || value === undefined) {
      element.removeAttribute("style");
      return;
    }

    if (typeof value === "string") {
      element.setAttribute("style", value);
      return;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      applyStyleObject(element, value as Record<string, unknown>);
    }
    return;
  }

  if (key.startsWith("data-") || key.startsWith("aria-")) {
    if (value === false || value === null || value === undefined) {
      element.removeAttribute(key);
    } else {
      element.setAttribute(key, String(value));
    }
    return;
  }

  const host = element as HTMLElement & Record<string, unknown>;

  if (key in host) {
    host[key] = value as unknown;
    return;
  }

  if (value === true) {
    element.setAttribute(key, "");
    return;
  }

  if (value === false || value === null || value === undefined) {
    element.removeAttribute(key);
    return;
  }

  element.setAttribute(key, String(value));
};

const mountReactiveProperty = (
  element: Element,
  key: string,
  reactive: ReactiveLike
) => {
  effect(() => {
    applyPropertyValue(element, key, reactive.value);
  });
};

/**
 * Attach event listeners derived from JSX props, supporting reactive values and
 * arrays while cleaning up outdated listeners between updates.
 */
const addEventListenerFromProp = (
  element: Element,
  propKey: string,
  value: unknown
) => {
  const eventName = extractEventName(propKey);

  const mountReactiveEvent = (reactive: ReactiveLike) => {
    let previousDescriptors: EventListenerDescriptor[] = [];

    effect(() => {
      const nextValue = reactive.value;
      const nextDescriptors = normalizeEventValue(nextValue);

      updateEventListeners(
        element,
        eventName,
        previousDescriptors,
        nextDescriptors
      );
      previousDescriptors = nextDescriptors;
    });
  };

  if (isReactiveNode(value)) {
    mountReactiveEvent(value);
    return;
  }

  const descriptors = normalizeEventValue(value);
  updateEventListeners(element, eventName, [], descriptors);
};

/**
 * Apply a JSX property to a host element, promoting reactive values to effects.
 */
const setDomProperty = (element: Element, key: string, value: unknown) => {
  if (isReactiveNode(value)) {
    mountReactiveProperty(element, key, value);
    return;
  }

  applyPropertyValue(element, key, value);
};

export { addEventListenerFromProp, isEventProp, setDomProperty };
