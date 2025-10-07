import { effect } from "./reactivity";
import { AilurosJSX } from "./types/types";

type ReactiveLike<T = unknown> = {
  readonly value: T;
  peek: () => T;
};

const isReactiveNode = (value: unknown): value is ReactiveLike => {
  return (
    value !== null &&
    typeof value === "object" &&
    "value" in value &&
    "peek" in value &&
    typeof (value as { peek: unknown }).peek === "function"
  );
};

const isDomNode = (value: unknown): value is Node => {
  return value instanceof Node;
};

const isEventProp = (key: string): boolean => {
  return key.startsWith("on") && key.length > 2;
};

const extractEventName = (key: string): string => {
  return key.slice(2).toLowerCase();
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

const addEventListenerFromProp = (
  element: Element,
  propKey: string,
  value: unknown
) => {
  const eventName = extractEventName(propKey);

  const register = (
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => {
    element.addEventListener(eventName, listener, options);
  };

  const applyListener = (candidate: unknown) => {
    if (!candidate) {
      return;
    }

    if (
      typeof candidate === "function" ||
      (typeof candidate === "object" &&
        typeof (candidate as EventListenerObject).handleEvent === "function")
    ) {
      register(candidate as EventListenerOrEventListenerObject);
      return;
    }

    if (typeof candidate === "object") {
      const { listener, options, capture, once, passive, signal } =
        candidate as {
          listener?: EventListenerOrEventListenerObject;
          options?: boolean | AddEventListenerOptions;
          capture?: boolean;
          once?: boolean;
          passive?: boolean;
          signal?: AbortSignal;
        };

      if (listener) {
        register(
          listener,
          options ?? {
            capture,
            once,
            passive,
            signal,
          }
        );
      }
    }
  };

  if (Array.isArray(value)) {
    value.forEach((item) => {
      applyListener(item);
    });
  } else {
    applyListener(value);
  }
};

const setDomProperty = (element: Element, key: string, value: unknown) => {
  if (isReactiveNode(value)) {
    mountReactiveProperty(element, key, value);
    return;
  }

  applyPropertyValue(element, key, value);
};

const createNodesFromValue = (value: unknown): Node[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => createNodesFromValue(item));
  }

  if (typeof value === "string" || typeof value === "number") {
    return [document.createTextNode(String(value))];
  }

  if (typeof value === "boolean" || value === null || value === undefined) {
    return [];
  }

  if (isDomNode(value)) {
    return [value];
  }

  return [];
};

const mountReactiveChild = (parent: Element, reactiveChild: ReactiveLike) => {
  const anchor = document.createComment("ailuros:placeholder");
  parent.appendChild(anchor);
  let currentNodes: Node[] = [];

  const cleanupCurrentNodes = () => {
    for (const node of currentNodes) {
      if (node.parentNode === parent) {
        parent.removeChild(node);
      }
    }
    currentNodes = [];
  };

  effect(() => {
    const nextValue = reactiveChild.value;

    if (typeof nextValue === "string" || typeof nextValue === "number") {
      const textContent = String(nextValue);

      if (currentNodes.length === 1 && currentNodes[0] instanceof Text) {
        currentNodes[0].data = textContent;
        return;
      }

      cleanupCurrentNodes();
      const textNode = document.createTextNode(textContent);
      parent.insertBefore(textNode, anchor);
      currentNodes = [textNode];
      return;
    }

    if (
      typeof nextValue === "boolean" ||
      nextValue === null ||
      nextValue === undefined
    ) {
      cleanupCurrentNodes();
      return;
    }

    const nextNodes = createNodesFromValue(nextValue);
    cleanupCurrentNodes();

    for (const node of nextNodes) {
      parent.insertBefore(node, anchor);
    }

    currentNodes = nextNodes;
  });
};

const appendChild = (parent: Element, child: unknown) => {
  if (Array.isArray(child)) {
    child.forEach((item) => appendChild(parent, item));
    return;
  }

  if (typeof child === "boolean" || child === null || child === undefined) {
    return;
  }

  if (isReactiveNode(child)) {
    mountReactiveChild(parent, child);
    return;
  }

  if (typeof child === "string" || typeof child === "number") {
    parent.appendChild(document.createTextNode(String(child)));
    return;
  }

  if (isDomNode(child)) {
    parent.appendChild(child);
  }
};

const jsx: AilurosJSX = (tag, props, _key) => {
  const element = (() => {
    if (typeof tag === "string") {
      return document.createElement(tag);
    }

    return document.createElement("div");
  })();

  if (props) {
    for (const propKey in props) {
      if (propKey === "children") {
        appendChild(element, props[propKey]);
        continue;
      }

      const propValue = props[propKey];

      if (isEventProp(propKey)) {
        addEventListenerFromProp(element, propKey, propValue);
        continue;
      }

      setDomProperty(element, propKey, propValue);
    }
  }

  return element;
};

export { jsx, jsx as jsxs };

export * from "./types/types";
