import { Computed } from "@ailuros/reactivity";
import { Fragment } from "../jsx-runtime";

type PrimitiveChild = string | number | boolean | null | undefined;
type HostElement = Element | DocumentFragment;

type AilurosJSX = (
  tag: any,
  props: {
    [key: string]: any;
    children?: AilurosNode;
  } | null,
  key?: string | number
) => HostElement;

type AilurosNode =
  | PrimitiveChild
  | Computed<PrimitiveChild>
  | AilurosJSX
  | HostElement
  | Computed<HostElement>
  | AilurosNode[];

type AilurosElement = AilurosJSX;

export namespace JSX {
  export interface IntrinsicElements {
    [elemName: string]: any;
  }

  export type Element = HostElement;
  export type Fragment = typeof Fragment;
}

export { AilurosJSX, AilurosNode, AilurosElement };
