import { Computed } from "@dathomir/reactivity";

import type { VNode } from "@/types";
import { AIntrinsicElements } from "@/types/IntrinsicElements/A";
import { AbbrIntrinsicElements } from "@/types/IntrinsicElements/Abbr";
import { AddressIntrinsicElements } from "@/types/IntrinsicElements/Address";
import { AreaIntrinsicElements } from "@/types/IntrinsicElements/Area";
import { ArticleIntrinsicElements } from "@/types/IntrinsicElements/Article";
import { AsideIntrinsicElements } from "@/types/IntrinsicElements/Aside";
import { AudioIntrinsicElements } from "@/types/IntrinsicElements/Audio";
import { BIntrinsicElements } from "@/types/IntrinsicElements/B";
import { BaseIntrinsicElements } from "@/types/IntrinsicElements/Base";
import { BdiIntrinsicElements } from "@/types/IntrinsicElements/Bdi";
import { BdoIntrinsicElements } from "@/types/IntrinsicElements/Bdo";
import { BlockquoteIntrinsicElements } from "@/types/IntrinsicElements/Blockquote";
import { BodyIntrinsicElements } from "@/types/IntrinsicElements/Body";
import { BrIntrinsicElements } from "@/types/IntrinsicElements/Br";
import { ButtonIntrinsicElements } from "@/types/IntrinsicElements/Button";
import { CanvasIntrinsicElements } from "@/types/IntrinsicElements/Canvas";
import { CaptionIntrinsicElements } from "@/types/IntrinsicElements/Caption";
import { CiteIntrinsicElements } from "@/types/IntrinsicElements/Cite";
import { CodeIntrinsicElements } from "@/types/IntrinsicElements/Code";
import { ColIntrinsicElements } from "@/types/IntrinsicElements/Col";
import { ColgroupIntrinsicElements } from "@/types/IntrinsicElements/Colgroup";
import { DataIntrinsicElements } from "@/types/IntrinsicElements/Data";
import { DatalistIntrinsicElements } from "@/types/IntrinsicElements/Datalist";
import { DdIntrinsicElements } from "@/types/IntrinsicElements/Dd";
import { DelIntrinsicElements } from "@/types/IntrinsicElements/Del";
import { DetailsIntrinsicElements } from "@/types/IntrinsicElements/Details";
import { DfnIntrinsicElements } from "@/types/IntrinsicElements/Dfn";
import { DialogIntrinsicElements } from "@/types/IntrinsicElements/Dialog";
import { DivIntrinsicElements } from "@/types/IntrinsicElements/Div";
import { DlIntrinsicElements } from "@/types/IntrinsicElements/Dl";
import { DtIntrinsicElements } from "@/types/IntrinsicElements/Dt";
import { EmIntrinsicElements } from "@/types/IntrinsicElements/Em";
import { EmbedIntrinsicElements } from "@/types/IntrinsicElements/Embed";
import { FencedframeIntrinsicElements } from "@/types/IntrinsicElements/Fencedframe";
import { FieldsetIntrinsicElements } from "@/types/IntrinsicElements/Fieldset";
import { FigcaptionIntrinsicElements } from "@/types/IntrinsicElements/Figcaption";
import { FigureIntrinsicElements } from "@/types/IntrinsicElements/Figure";
import { FooterIntrinsicElements } from "@/types/IntrinsicElements/Footer";
import { FormIntrinsicElements } from "@/types/IntrinsicElements/Form";
import { H1IntrinsicElements } from "@/types/IntrinsicElements/H1";
import { H2IntrinsicElements } from "@/types/IntrinsicElements/H2";
import { H3IntrinsicElements } from "@/types/IntrinsicElements/H3";
import { H4IntrinsicElements } from "@/types/IntrinsicElements/H4";
import { H5IntrinsicElements } from "@/types/IntrinsicElements/H5";
import { H6IntrinsicElements } from "@/types/IntrinsicElements/H6";
import { HeadIntrinsicElements } from "@/types/IntrinsicElements/Head";
import { HeaderIntrinsicElements } from "@/types/IntrinsicElements/Header";
import { HgroupIntrinsicElements } from "@/types/IntrinsicElements/Hgroup";
import { HrIntrinsicElements } from "@/types/IntrinsicElements/Hr";
import { HtmlIntrinsicElements } from "@/types/IntrinsicElements/Html";
import { IIntrinsicElements } from "@/types/IntrinsicElements/I";
import { IframeIntrinsicElements } from "@/types/IntrinsicElements/Iframe";
import { ImgIntrinsicElements } from "@/types/IntrinsicElements/Img";
import { InputIntrinsicElements } from "@/types/IntrinsicElements/Input";
import { InsIntrinsicElements } from "@/types/IntrinsicElements/Ins";
import { KbdIntrinsicElements } from "@/types/IntrinsicElements/Kbd";
import { LabelIntrinsicElements } from "@/types/IntrinsicElements/Label";
import { LegendIntrinsicElements } from "@/types/IntrinsicElements/Legend";
import { LiIntrinsicElements } from "@/types/IntrinsicElements/Li";
import { LinkIntrinsicElements } from "@/types/IntrinsicElements/Link";
import { MainIntrinsicElements } from "@/types/IntrinsicElements/Main";
import { MapIntrinsicElements } from "@/types/IntrinsicElements/Map";
import { MarkIntrinsicElements } from "@/types/IntrinsicElements/Mark";
import { MathIntrinsicElements } from "@/types/IntrinsicElements/Math";
import { MenuIntrinsicElements } from "@/types/IntrinsicElements/Menu";
import { MetaIntrinsicElements } from "@/types/IntrinsicElements/Meta";
import { MeterIntrinsicElements } from "@/types/IntrinsicElements/Meter";
import { NavIntrinsicElements } from "@/types/IntrinsicElements/Nav";
import { NoscriptIntrinsicElements } from "@/types/IntrinsicElements/Noscript";
import { ObjectIntrinsicElements } from "@/types/IntrinsicElements/Object";
import { OlIntrinsicElements } from "@/types/IntrinsicElements/Ol";
import { OptgroupIntrinsicElements } from "@/types/IntrinsicElements/Optgroup";
import { OptionIntrinsicElements } from "@/types/IntrinsicElements/Option";
import { OutputIntrinsicElements } from "@/types/IntrinsicElements/Output";
import { PIntrinsicElements } from "@/types/IntrinsicElements/P";
import { PictureIntrinsicElements } from "@/types/IntrinsicElements/Picture";
import { PreIntrinsicElements } from "@/types/IntrinsicElements/Pre";
import { ProgressIntrinsicElements } from "@/types/IntrinsicElements/Progress";
import { QIntrinsicElements } from "@/types/IntrinsicElements/Q";
import { RpIntrinsicElements } from "@/types/IntrinsicElements/Rp";
import { RtIntrinsicElements } from "@/types/IntrinsicElements/Rt";
import { RubyIntrinsicElements } from "@/types/IntrinsicElements/Ruby";
import { SIntrinsicElements } from "@/types/IntrinsicElements/S";
import { SampIntrinsicElements } from "@/types/IntrinsicElements/Samp";
import { ScriptIntrinsicElements } from "@/types/IntrinsicElements/Script";
import { SearchIntrinsicElements } from "@/types/IntrinsicElements/Search";
import { SectionIntrinsicElements } from "@/types/IntrinsicElements/Section";
import { SelectIntrinsicElements } from "@/types/IntrinsicElements/Select";
import { SelectedcontentIntrinsicElements } from "@/types/IntrinsicElements/Selectedcontent";
import { SlotIntrinsicElements } from "@/types/IntrinsicElements/Slot";
import { SmallIntrinsicElements } from "@/types/IntrinsicElements/Small";
import { SourceIntrinsicElements } from "@/types/IntrinsicElements/Source";
import { SpanIntrinsicElements } from "@/types/IntrinsicElements/Span";
import { StrongIntrinsicElements } from "@/types/IntrinsicElements/Strong";
import { StyleIntrinsicElements } from "@/types/IntrinsicElements/Style";
import { SubIntrinsicElements } from "@/types/IntrinsicElements/Sub";
import { SummaryIntrinsicElements } from "@/types/IntrinsicElements/Summary";
import { SupIntrinsicElements } from "@/types/IntrinsicElements/Sup";
import { SvgIntrinsicElements } from "@/types/IntrinsicElements/Svg";
import { TableIntrinsicElements } from "@/types/IntrinsicElements/Table";
import { TbodyIntrinsicElements } from "@/types/IntrinsicElements/Tbody";
import { TdIntrinsicElements } from "@/types/IntrinsicElements/Td";
import { TemplateIntrinsicElements } from "@/types/IntrinsicElements/Template";
import { TextareaIntrinsicElements } from "@/types/IntrinsicElements/Textarea";
import { TfootIntrinsicElements } from "@/types/IntrinsicElements/Tfoot";
import { ThIntrinsicElements } from "@/types/IntrinsicElements/Th";
import { TheadIntrinsicElements } from "@/types/IntrinsicElements/Thead";
import { TimeIntrinsicElements } from "@/types/IntrinsicElements/Time";
import { TitleIntrinsicElements } from "@/types/IntrinsicElements/Title";
import { TrIntrinsicElements } from "@/types/IntrinsicElements/Tr";
import { TrackIntrinsicElements } from "@/types/IntrinsicElements/Track";
import { UIntrinsicElements } from "@/types/IntrinsicElements/U";
import { UlIntrinsicElements } from "@/types/IntrinsicElements/Ul";
import { VarIntrinsicElements } from "@/types/IntrinsicElements/Var";
import { VideoIntrinsicElements } from "@/types/IntrinsicElements/Video";
import { WbrIntrinsicElements } from "@/types/IntrinsicElements/Wbr";


type PrimitiveChild = string | number | boolean | null | undefined;

type dathomirJSX = (
  tag: any,
  props: {
    [key: string]: any;
    children?: dathomirNode;
  } | null,
  key?: string | number
) => VNode;

type dathomirNode =
  | PrimitiveChild
  | Computed<PrimitiveChild>
  | VNode
  | Computed<VNode>
  | dathomirNode[];

type dathomirElement = VNode;

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
    button: ButtonIntrinsicElements;
    canvas: CanvasIntrinsicElements;
    caption: CaptionIntrinsicElements;
    cite: CiteIntrinsicElements;
    code: CodeIntrinsicElements;
    col: ColIntrinsicElements;
    colgroup: ColgroupIntrinsicElements;
    data: DataIntrinsicElements;
    datalist: DatalistIntrinsicElements;
    dd: DdIntrinsicElements;
    del: DelIntrinsicElements;
    details: DetailsIntrinsicElements;
    dfn: DfnIntrinsicElements;
    dialog: DialogIntrinsicElements;
    div: DivIntrinsicElements;
    dl: DlIntrinsicElements;
    dt: DtIntrinsicElements;
    em: EmIntrinsicElements;
    embed: EmbedIntrinsicElements;
    fencedframe: FencedframeIntrinsicElements;
    fieldset: FieldsetIntrinsicElements;
    figcaption: FigcaptionIntrinsicElements;
    figure: FigureIntrinsicElements;
    footer: FooterIntrinsicElements;
    form: FormIntrinsicElements;
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
    iframe: IframeIntrinsicElements;
    img: ImgIntrinsicElements;
    input: InputIntrinsicElements;
    ins: InsIntrinsicElements;
    kbd: KbdIntrinsicElements;
    label: LabelIntrinsicElements;
    legend: LegendIntrinsicElements;
    li: LiIntrinsicElements;
    link: LinkIntrinsicElements;
    main: MainIntrinsicElements;
    map: MapIntrinsicElements;
    mark: MarkIntrinsicElements;
    math: MathIntrinsicElements;
    menu: MenuIntrinsicElements;
    meta: MetaIntrinsicElements;
    meter: MeterIntrinsicElements;
    nav: NavIntrinsicElements;
    noscript: NoscriptIntrinsicElements;
    object: ObjectIntrinsicElements;
    ol: OlIntrinsicElements;
    optgroup: OptgroupIntrinsicElements;
    option: OptionIntrinsicElements;
    output: OutputIntrinsicElements;
    p: PIntrinsicElements;
    picture: PictureIntrinsicElements;
    pre: PreIntrinsicElements;
    progress: ProgressIntrinsicElements;
    q: QIntrinsicElements;
    rp: RpIntrinsicElements;
    rt: RtIntrinsicElements;
    ruby: RubyIntrinsicElements;
    s: SIntrinsicElements;
    samp: SampIntrinsicElements;
    script: ScriptIntrinsicElements;
    search: SearchIntrinsicElements;
    section: SectionIntrinsicElements;
    select: SelectIntrinsicElements;
    selectedcontent: SelectedcontentIntrinsicElements;
    slot: SlotIntrinsicElements;
    small: SmallIntrinsicElements;
    source: SourceIntrinsicElements;
    span: SpanIntrinsicElements;
    strong: StrongIntrinsicElements;
    style: StyleIntrinsicElements;
    sub: SubIntrinsicElements;
    summary: SummaryIntrinsicElements;
    sup: SupIntrinsicElements;
    svg: SvgIntrinsicElements;
    table: TableIntrinsicElements;
    tbody: TbodyIntrinsicElements;
    td: TdIntrinsicElements;
    template: TemplateIntrinsicElements;
    textarea: TextareaIntrinsicElements;
    tfoot: TfootIntrinsicElements;
    th: ThIntrinsicElements;
    thead: TheadIntrinsicElements;
    time: TimeIntrinsicElements;
    title: TitleIntrinsicElements;
    tr: TrIntrinsicElements;
    track: TrackIntrinsicElements;
    u: UIntrinsicElements;
    ul: UlIntrinsicElements;
    var: VarIntrinsicElements;
    video: VideoIntrinsicElements;
    wbr: WbrIntrinsicElements;
  }

  export type Element = VNode;
  export type ElementType =
    | keyof IntrinsicElements
    | ((props: { children?: dathomirNode }) => VNode);

  export interface ElementChildrenAttribute {
    children: {};
  }
}

export { dathomirJSX, dathomirNode, dathomirElement };
