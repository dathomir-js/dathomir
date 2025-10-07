import type { AilurosJSX } from "../types/types";
import { appendChild } from "./children";
import { addEventListenerFromProp, isEventProp, setDomProperty } from "./props";

/**
 * Create a DOM element for the given host tag, falling back to a div.
 */
const createHostElement = (tag: unknown): Element => {
  if (typeof tag === "string") {
    return document.createElement(tag);
  }

  return document.createElement("div");
};

/**
 * JSX factory used by the runtime to materialize host elements and wire props.
 */
const jsx: AilurosJSX = (tag, props, _key) => {
  const element = createHostElement(tag);

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

const jsxs = jsx;

export { jsx, jsxs };
export * from "../types/types";
