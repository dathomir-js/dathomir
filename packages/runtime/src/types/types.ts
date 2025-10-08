import { Computed } from "@ailuros/reactivity";
import { Fragment } from "../jsx-runtime";
import { BaseIntrinsicElements } from "./IntrinsicElements/Base";
import { BodyIntrinsicElements } from "./IntrinsicElements/Body";
import { DivIntrinsicElements } from "./IntrinsicElements/Div";
import { HeadIntrinsicElements } from "./IntrinsicElements/Head";
import { HtmlIntrinsicElements } from "./IntrinsicElements/Html";
import { LinkIntrinsicElements } from "./IntrinsicElements/Link";
import { MetaIntrinsicElements } from "./IntrinsicElements/Meta";
import { StyleIntrinsicElements } from "./IntrinsicElements/Style";
import { TitleIntrinsicElements } from "./IntrinsicElements/Title";

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
    base: BaseIntrinsicElements;
    body: BodyIntrinsicElements;
    head: HeadIntrinsicElements;
    link: LinkIntrinsicElements;
    meta: MetaIntrinsicElements;
    style: StyleIntrinsicElements;
    title: TitleIntrinsicElements;
    html: HtmlIntrinsicElements;
    div: DivIntrinsicElements;
  }

  export type Element = HostElement;
  export type Fragment = typeof Fragment;
}

export { AilurosJSX, AilurosNode, AilurosElement };
