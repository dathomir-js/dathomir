import { Computed } from "@ailuros/reactivity";
import { Fragment } from "../jsx-runtime";
import { AIntrinsicElements } from "./IntrinsicElements/A";
import { AbbrIntrinsicElements } from "./IntrinsicElements/Abbr";
import { AddressIntrinsicElements } from "./IntrinsicElements/Address";
import { AreaIntrinsicElements } from "./IntrinsicElements/Area";
import { AudioIntrinsicElements } from "./IntrinsicElements/Audio";
import { ArticleIntrinsicElements } from "./IntrinsicElements/Article";
import { AsideIntrinsicElements } from "./IntrinsicElements/Aside";
import { BIntrinsicElements } from "./IntrinsicElements/B";
import { BaseIntrinsicElements } from "./IntrinsicElements/Base";
import { BdiIntrinsicElements } from "./IntrinsicElements/Bdi";
import { BdoIntrinsicElements } from "./IntrinsicElements/Bdo";
import { BlockquoteIntrinsicElements } from "./IntrinsicElements/Blockquote";
import { BodyIntrinsicElements } from "./IntrinsicElements/Body";
import { BrIntrinsicElements } from "./IntrinsicElements/Br";
import { CiteIntrinsicElements } from "./IntrinsicElements/Cite";
import { CodeIntrinsicElements } from "./IntrinsicElements/Code";
import { DataIntrinsicElements } from "./IntrinsicElements/Data";
import { DdIntrinsicElements } from "./IntrinsicElements/Dd";
import { DfnIntrinsicElements } from "./IntrinsicElements/Dfn";
import { DivIntrinsicElements } from "./IntrinsicElements/Div";
import { DlIntrinsicElements } from "./IntrinsicElements/Dl";
import { DtIntrinsicElements } from "./IntrinsicElements/Dt";
import { EmIntrinsicElements } from "./IntrinsicElements/Em";
import { FigcaptionIntrinsicElements } from "./IntrinsicElements/Figcaption";
import { FigureIntrinsicElements } from "./IntrinsicElements/Figure";
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
import { HrIntrinsicElements } from "./IntrinsicElements/Hr";
import { HtmlIntrinsicElements } from "./IntrinsicElements/Html";
import { IIntrinsicElements } from "./IntrinsicElements/I";
import { ImgIntrinsicElements } from "./IntrinsicElements/Img";
import { KbdIntrinsicElements } from "./IntrinsicElements/Kbd";
import { LiIntrinsicElements } from "./IntrinsicElements/Li";
import { LinkIntrinsicElements } from "./IntrinsicElements/Link";
import { MainIntrinsicElements } from "./IntrinsicElements/Main";
import { MapIntrinsicElements } from "./IntrinsicElements/Map";
import { MarkIntrinsicElements } from "./IntrinsicElements/Mark";
import { MenuIntrinsicElements } from "./IntrinsicElements/Menu";
import { MetaIntrinsicElements } from "./IntrinsicElements/Meta";
import { NavIntrinsicElements } from "./IntrinsicElements/Nav";
import { OlIntrinsicElements } from "./IntrinsicElements/Ol";
import { PIntrinsicElements } from "./IntrinsicElements/P";
import { PreIntrinsicElements } from "./IntrinsicElements/Pre";
import { QIntrinsicElements } from "./IntrinsicElements/Q";
import { RpIntrinsicElements } from "./IntrinsicElements/Rp";
import { RtIntrinsicElements } from "./IntrinsicElements/Rt";
import { RubyIntrinsicElements } from "./IntrinsicElements/Ruby";
import { SIntrinsicElements } from "./IntrinsicElements/S";
import { SampIntrinsicElements } from "./IntrinsicElements/Samp";
import { SearchIntrinsicElements } from "./IntrinsicElements/Search";
import { SectionIntrinsicElements } from "./IntrinsicElements/Section";
import { SmallIntrinsicElements } from "./IntrinsicElements/Small";
import { SpanIntrinsicElements } from "./IntrinsicElements/Span";
import { StrongIntrinsicElements } from "./IntrinsicElements/Strong";
import { StyleIntrinsicElements } from "./IntrinsicElements/Style";
import { SubIntrinsicElements } from "./IntrinsicElements/Sub";
import { SupIntrinsicElements } from "./IntrinsicElements/Sup";
import { TimeIntrinsicElements } from "./IntrinsicElements/Time";
import { TitleIntrinsicElements } from "./IntrinsicElements/Title";
import { TrackIntrinsicElements } from "./IntrinsicElements/Track";
import { UIntrinsicElements } from "./IntrinsicElements/U";
import { UlIntrinsicElements } from "./IntrinsicElements/Ul";
import { VarIntrinsicElements } from "./IntrinsicElements/Var";
import { VideoIntrinsicElements } from "./IntrinsicElements/Video";
import { WbrIntrinsicElements } from "./IntrinsicElements/Wbr";

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
    a: AIntrinsicElements;
    abbr: AbbrIntrinsicElements;
    address: AddressIntrinsicElements;
    area: AreaIntrinsicElements;
    article: ArticleIntrinsicElements;
    aside: AsideIntrinsicElements;
    audio: AudioIntrinsicElements;
    b: BIntrinsicElements;
    base: BaseIntrinsicElements;
    bdi: BdiIntrinsicElements;
    bdo: BdoIntrinsicElements;
    blockquote: BlockquoteIntrinsicElements;
    body: BodyIntrinsicElements;
    br: BrIntrinsicElements;
    cite: CiteIntrinsicElements;
    code: CodeIntrinsicElements;
    data: DataIntrinsicElements;
    dd: DdIntrinsicElements;
    dfn: DfnIntrinsicElements;
    div: DivIntrinsicElements;
    dl: DlIntrinsicElements;
    dt: DtIntrinsicElements;
    em: EmIntrinsicElements;
    figcaption: FigcaptionIntrinsicElements;
    figure: FigureIntrinsicElements;
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
    hr: HrIntrinsicElements;
    html: HtmlIntrinsicElements;
    i: IIntrinsicElements;
    img: ImgIntrinsicElements;
    kbd: KbdIntrinsicElements;
    li: LiIntrinsicElements;
    link: LinkIntrinsicElements;
    main: MainIntrinsicElements;
    map: MapIntrinsicElements;
    mark: MarkIntrinsicElements;
    menu: MenuIntrinsicElements;
    meta: MetaIntrinsicElements;
    nav: NavIntrinsicElements;
    ol: OlIntrinsicElements;
    p: PIntrinsicElements;
    pre: PreIntrinsicElements;
    q: QIntrinsicElements;
    rp: RpIntrinsicElements;
    rt: RtIntrinsicElements;
    ruby: RubyIntrinsicElements;
    s: SIntrinsicElements;
    samp: SampIntrinsicElements;
    search: SearchIntrinsicElements;
    section: SectionIntrinsicElements;
    small: SmallIntrinsicElements;
    span: SpanIntrinsicElements;
    strong: StrongIntrinsicElements;
    style: StyleIntrinsicElements;
    sub: SubIntrinsicElements;
    sup: SupIntrinsicElements;
    time: TimeIntrinsicElements;
    title: TitleIntrinsicElements;
    track: TrackIntrinsicElements;
    u: UIntrinsicElements;
    ul: UlIntrinsicElements;
    var: VarIntrinsicElements;
    video: VideoIntrinsicElements;
    wbr: WbrIntrinsicElements;
  }

  export type Element = HostElement;
  export type Fragment = typeof Fragment;
}

export { AilurosJSX, AilurosNode, AilurosElement };
