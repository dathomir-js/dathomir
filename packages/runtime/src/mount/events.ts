import { effect } from "../reactivity";
import { eventNameFromProp, isReactiveChild } from "../utils";

/**
 * Check if value is EventListenerObject (has handleEvent method)
 */
const isListenerObj = (v: unknown): v is EventListenerObject => {
  return (
    !!v && typeof v === "object" && typeof (v as any).handleEvent === "function"
  );
};

/**
 * Check if value is a valid event listener (function or EventListenerObject)
 */
const isListener = (v: unknown): v is EventListenerOrEventListenerObject => {
  return typeof v === "function" || isListenerObj(v);
};

/**
 * Add event listeners from JSX prop.
 * Supports static listeners, reactive listeners, arrays, and listener objects with options.
 */
const addEventFromProp = (el: Element, propKey: string, value: unknown) => {
  const ev = eventNameFromProp(propKey);
  if (!ev) return;

  const mountReactiveEvents = (reactive: {
    value: unknown;
    peek: () => unknown;
  }) => {
    let prev: Array<{
      listener: EventListenerOrEventListenerObject;
      options?: boolean | AddEventListenerOptions;
    }> = [];
    effect(() => {
      const nextVal = reactive.value;
      const next: Array<{
        listener: EventListenerOrEventListenerObject;
        options?: boolean | AddEventListenerOptions;
      }> = [];
      const collect = (candidate: unknown) => {
        if (Array.isArray(candidate)) {
          candidate.forEach(collect);
          return;
        }
        if (!candidate) return;
        if (isReactiveChild(candidate as any)) {
          collect((candidate as any).value);
          return;
        }
        if (isListener(candidate)) {
          next.push({ listener: candidate });
          return;
        }
        if (typeof candidate === "object") {
          const rec = candidate as Record<string, unknown>;
          const listener = rec.listener;
          if (isReactiveChild(listener as any)) {
            collect((listener as any).value);
            return;
          }
          if (isListener(listener)) {
            let options: boolean | AddEventListenerOptions | undefined;
            const {
              capture,
              once,
              passive,
              signal,
              options: direct,
            } = rec as any;
            if (direct !== undefined) {
              options = direct as any;
            } else if (
              capture !== undefined ||
              once !== undefined ||
              passive !== undefined ||
              signal !== undefined
            ) {
              options = {};
              if (capture !== undefined)
                (options as AddEventListenerOptions).capture = capture;
              if (once !== undefined)
                (options as AddEventListenerOptions).once = once;
              if (passive !== undefined)
                (options as AddEventListenerOptions).passive = passive;
              if (signal !== undefined)
                (options as AddEventListenerOptions).signal = signal;
            }
            next.push({ listener, options });
          }
        }
      };
      collect(nextVal);
      // diff
      for (const { listener, options } of prev) {
        el.removeEventListener(ev, listener, options);
      }
      for (const { listener, options } of next) {
        el.addEventListener(ev, listener, options);
      }
      prev = next;
    });
  };

  if (isReactiveChild(value as any)) {
    mountReactiveEvents(value as any);
    return;
  }

  // static listeners
  const staticList: Array<{
    listener: EventListenerOrEventListenerObject;
    options?: boolean | AddEventListenerOptions;
  }> = [];
  const collectStatic = (candidate: unknown) => {
    if (Array.isArray(candidate)) {
      candidate.forEach(collectStatic);
      return;
    }
    if (!candidate) return;
    if (isListener(candidate)) {
      staticList.push({ listener: candidate });
      return;
    }
    if (typeof candidate === "object") {
      const rec = candidate as Record<string, unknown>;
      const listener = rec.listener;
      if (isListener(listener)) {
        let options: boolean | AddEventListenerOptions | undefined;
        const { capture, once, passive, signal, options: direct } = rec as any;
        if (direct !== undefined) {
          options = direct as any;
        } else if (
          capture !== undefined ||
          once !== undefined ||
          passive !== undefined ||
          signal !== undefined
        ) {
          options = {};
          if (capture !== undefined)
            (options as AddEventListenerOptions).capture = capture;
          if (once !== undefined)
            (options as AddEventListenerOptions).once = once;
          if (passive !== undefined)
            (options as AddEventListenerOptions).passive = passive;
          if (signal !== undefined)
            (options as AddEventListenerOptions).signal = signal;
        }
        staticList.push({ listener, options });
      }
    }
  };
  collectStatic(value);
  for (const { listener, options } of staticList) {
    el.addEventListener(ev, listener, options);
  }
};

export { eventNameFromProp, addEventFromProp };
