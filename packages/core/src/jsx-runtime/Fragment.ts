/**
 * JSX Fragment component.
 */
type JSXChild =
  | Node
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => unknown);

interface FragmentProps {
  children?: JSXChild | JSXChild[];
}

/**
 * Fragment renders children without a wrapper element.
 */
export function Fragment(props: FragmentProps): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const { children } = props;

  function appendChild(child: JSXChild): void {
    if (child === null || child === undefined || typeof child === "boolean") {
      return;
    }

    if (child instanceof Node) {
      fragment.appendChild(child);
    } else if (typeof child === "function") {
      // Functions are not supported in Fragment - use in elements instead
      fragment.appendChild(document.createTextNode(String(child())));
    } else {
      fragment.appendChild(document.createTextNode(String(child)));
    }
  }

  if (Array.isArray(children)) {
    children.forEach(appendChild);
  } else if (children !== undefined) {
    appendChild(children);
  }

  return fragment;
}
