import { Computed } from "@ailuros/reactivity";

type AilurosJSX = (
  tag: any,
  props: {
    [key: string]: any;
    children?: AilurosNode;
  } | null,
  key?: string | number
) => Element;

type AilurosNode =
  | string
  | number
  | boolean
  | null
  | undefined
  | Computed<string | number | boolean | null | undefined>
  | AilurosJSX
  | Element
  | Computed<Element>
  | AilurosNode[];

type AilurosElement = AilurosJSX;

export namespace JSX {
  export interface IntrinsicElements {
    [elemName: string]: any;
  }

  export interface Element extends HTMLElement {}
}

export { AilurosJSX, AilurosNode, AilurosElement };
