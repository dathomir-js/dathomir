import type { dathomirJSX, dathomirNode } from "../types/types";
import { appendChild } from "./children";
import { addEventListenerFromProp, isEventProp, setDomProperty } from "./props";

const FragmentSymbol = Symbol.for("dathomir.fragment");

/**
 * Fragment component for JSX
 */
function Fragment(props: { children?: dathomirNode }): DocumentFragment {
  const fragment = document.createDocumentFragment();
  if (props && "children" in props) {
    appendChild(fragment, props.children);
  }
  return fragment;
}

// Assign the symbol to the Fragment function for runtime identification
(Fragment as any)[Symbol.for("dathomir.fragment.symbol")] = FragmentSymbol;

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
const jsx: dathomirJSX = (tag, props, _key) => {
  if (tag === Fragment || tag === FragmentSymbol) {
    return Fragment(props || {});
  }

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

export { jsx, jsxs, Fragment };
export * from "../types/types";
