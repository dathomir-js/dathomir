import { Computed } from "@ailuros/reactivity";
import { Fragment } from "../jsx-runtime";
import { AddressIntrinsicElements } from "./IntrinsicElements/Address";
import { ArticleIntrinsicElements } from "./IntrinsicElements/Article";
import { AsideIntrinsicElements } from "./IntrinsicElements/Aside";
import { BaseIntrinsicElements } from "./IntrinsicElements/Base";
import { BodyIntrinsicElements } from "./IntrinsicElements/Body";
import { DivIntrinsicElements } from "./IntrinsicElements/Div";
import { FooterIntrinsicElements } from "./IntrinsicElements/Footer";
import { H1IntrinsicElements } from "./IntrinsicElements/H1";
import { H2IntrinsicElements } from "./IntrinsicElements/H2";
import { H3IntrinsicElements } from "./IntrinsicElements/H3";
import { H4IntrinsicElements } from "./IntrinsicElements/H4";
import { H5IntrinsicElements } from "./IntrinsicElements/H5";
import { H6IntrinsicElements } from "./IntrinsicElements/H6";
import { HeadIntrinsicElements } from "./IntrinsicElements/Head";
import { HeaderIntrinsicElements } from "./IntrinsicElements/Header";
import { HgroupIntrinsicElements } from "./IntrinsicElements/Hgroup";
import { HtmlIntrinsicElements } from "./IntrinsicElements/Html";
import { LinkIntrinsicElements } from "./IntrinsicElements/Link";
import { MainIntrinsicElements } from "./IntrinsicElements/Main";
import { MetaIntrinsicElements } from "./IntrinsicElements/Meta";
import { NavIntrinsicElements } from "./IntrinsicElements/Nav";
import { SearchIntrinsicElements } from "./IntrinsicElements/Search";
import { SectionIntrinsicElements } from "./IntrinsicElements/Section";
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
    address: AddressIntrinsicElements;
    article: ArticleIntrinsicElements;
    aside: AsideIntrinsicElements;
    base: BaseIntrinsicElements;
    body: BodyIntrinsicElements;
    div: DivIntrinsicElements;
    footer: FooterIntrinsicElements;
    h1: H1IntrinsicElements;
    h2: H2IntrinsicElements;
    h3: H3IntrinsicElements;
    h4: H4IntrinsicElements;
    h5: H5IntrinsicElements;
    h6: H6IntrinsicElements;
    head: HeadIntrinsicElements;
    header: HeaderIntrinsicElements;
    hgroup: HgroupIntrinsicElements;
    html: HtmlIntrinsicElements;
    link: LinkIntrinsicElements;
    main: MainIntrinsicElements;
    meta: MetaIntrinsicElements;
    nav: NavIntrinsicElements;
    search: SearchIntrinsicElements;
    section: SectionIntrinsicElements;
    style: StyleIntrinsicElements;
    title: TitleIntrinsicElements;
  }

  export type Element = HostElement;
  export type Fragment = typeof Fragment;
}

export { AilurosJSX, AilurosNode, AilurosElement };
