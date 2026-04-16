import { SharedIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Shared SVG attribute definitions derived from the SVG 2 element index and
 * MDN SVG element / attribute references.
 *
 * @see https://www.w3.org/TR/SVG2/eltindex.html
 * @see https://www.w3.org/TR/SVG2/struct.html
 * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element
 * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute
 */

type SvgNumberish = number | string;
type SvgCoordinateList = SvgNumberish | readonly SvgNumberish[];
type SvgUnits = "userSpaceOnUse" | "objectBoundingBox" | (string & {});
type SvgRestart = "always" | "whenNotActive" | "never" | (string & {});
type SvgAdditive = "replace" | "sum" | (string & {});
type SvgAccumulate = "none" | "sum" | (string & {});
type SvgCalcMode = "discrete" | "linear" | "paced" | "spline" | (string & {});
type SvgSpreadMethod = "pad" | "reflect" | "repeat" | (string & {});
type SvgMarkerUnits = "strokeWidth" | "userSpaceOnUse" | (string & {});
type SvgOrient = SvgNumberish;
type SvgChannelSelector = "R" | "G" | "B" | "A" | (string & {});
type SvgEdgeMode = "duplicate" | "wrap" | "none" | (string & {});
type SvgCompositeOperator =
  | "over"
  | "in"
  | "out"
  | "atop"
  | "xor"
  | "lighter"
  | "arithmetic"
  | (string & {});
type SvgMorphologyOperator = "erode" | "dilate" | (string & {});
type SvgTurbulenceType = "fractalNoise" | "turbulence" | (string & {});
type SvgStitchTiles = "stitch" | "noStitch" | (string & {});
type SvgLengthAdjust = "spacing" | "spacingAndGlyphs" | (string & {});
type SvgTextPathMethod = "align" | "stretch" | (string & {});
type SvgTextPathSpacing = "auto" | "exact" | (string & {});
type SvgXLinkShow =
  | "new"
  | "replace"
  | "embed"
  | "other"
  | "none"
  | (string & {});
type SvgXLinkActuate =
  | "onLoad"
  | "onRequest"
  | "other"
  | "none"
  | (string & {});
type SvgTransferType =
  | "identity"
  | "table"
  | "discrete"
  | "linear"
  | "gamma"
  | (string & {});

interface SvgBaseIntrinsicElements extends SharedIntrinsicElements {
  tabindex?: number;
  requiredExtensions?: string;
  requiredFeatures?: string;
  systemLanguage?: string;
  "xml:lang"?: string;
  "xml:space"?: "default" | "preserve";
}

interface SvgPresentationAttributes {
  "alignment-baseline"?: string;
  "baseline-shift"?: SvgNumberish;
  clip?: string;
  "clip-path"?: string;
  "clip-rule"?: string;
  color?: string;
  "color-interpolation"?: "auto" | "sRGB" | "linearRGB" | (string & {});
  "color-interpolation-filters"?: "auto" | "sRGB" | "linearRGB" | (string & {});
  cursor?: string;
  direction?: string;
  display?: string;
  "dominant-baseline"?: string;
  fill?: string;
  "fill-opacity"?: SvgNumberish;
  "fill-rule"?: string;
  filter?: string;
  "flood-color"?: string;
  "flood-opacity"?: SvgNumberish;
  "font-family"?: string;
  "font-size"?: SvgNumberish;
  "font-size-adjust"?: SvgNumberish | string;
  "font-stretch"?: string;
  "font-style"?: string;
  "font-variant"?: string;
  "font-weight"?: SvgNumberish | string;
  "glyph-orientation-horizontal"?: SvgNumberish | string;
  "glyph-orientation-vertical"?: SvgNumberish | string;
  "image-rendering"?: string;
  "letter-spacing"?: SvgNumberish | string;
  "lighting-color"?: string;
  "marker-end"?: string;
  "marker-mid"?: string;
  "marker-start"?: string;
  mask?: string;
  "mask-type"?: string;
  opacity?: SvgNumberish;
  overflow?: string;
  "paint-order"?: string;
  "pointer-events"?: string;
  "shape-rendering"?: string;
  "stop-color"?: string;
  "stop-opacity"?: SvgNumberish;
  stroke?: string;
  "stroke-dasharray"?: SvgNumberish | string;
  "stroke-dashoffset"?: SvgNumberish;
  "stroke-linecap"?: "butt" | "round" | "square" | (string & {});
  "stroke-linejoin"?:
    | "arcs"
    | "bevel"
    | "miter"
    | "miter-clip"
    | "round"
    | (string & {});
  "stroke-miterlimit"?: SvgNumberish;
  "stroke-opacity"?: SvgNumberish;
  "stroke-width"?: SvgNumberish;
  "text-anchor"?: "start" | "middle" | "end" | (string & {});
  "text-decoration"?: string;
  "text-overflow"?: string;
  "text-rendering"?: string;
  transform?: string;
  "transform-origin"?: string;
  "unicode-bidi"?: string;
  "vector-effect"?: string;
  visibility?: string;
  "white-space"?: string;
  "word-spacing"?: SvgNumberish | string;
  "writing-mode"?: string;
}

interface SvgGraphicsIntrinsicElements
  extends SvgBaseIntrinsicElements, SvgPresentationAttributes {}

interface SvgFitToViewBoxAttributes {
  preserveAspectRatio?: string;
  viewBox?: string;
}

interface SvgHrefAttributes {
  href?: string;
  "xlink:href"?: string;
}

interface SvgXLinkAttributes extends SvgHrefAttributes {
  "xlink:actuate"?: SvgXLinkActuate;
  "xlink:arcrole"?: string;
  "xlink:role"?: string;
  "xlink:show"?: SvgXLinkShow;
  "xlink:title"?: string;
  "xlink:type"?: string;
}

interface SvgAnimationTimingAttributes {
  begin?: string;
  dur?: SvgNumberish;
  end?: string;
  fill?: string;
  max?: SvgNumberish;
  min?: SvgNumberish;
  repeatCount?: SvgNumberish;
  repeatDur?: SvgNumberish;
  restart?: SvgRestart;
}

interface SvgAnimationTargetAttributes extends SvgHrefAttributes {
  attributeName?: string;
  attributeType?: "CSS" | "XML" | "auto" | (string & {});
}

interface SvgAnimationValueAttributes {
  by?: SvgNumberish | string;
  calcMode?: SvgCalcMode;
  from?: SvgNumberish | string;
  keySplines?: string;
  keyTimes?: string;
  to?: SvgNumberish | string;
  values?: string;
}

interface SvgAnimationAdditionAttributes {
  accumulate?: SvgAccumulate;
  additive?: SvgAdditive;
}

interface SvgFilterPrimitiveAttributes extends SvgGraphicsIntrinsicElements {
  height?: SvgNumberish;
  result?: string;
  width?: SvgNumberish;
  x?: SvgNumberish;
  y?: SvgNumberish;
}

interface SvgTransferFunctionAttributes {
  amplitude?: SvgNumberish;
  exponent?: SvgNumberish;
  intercept?: SvgNumberish;
  offset?: SvgNumberish;
  slope?: SvgNumberish;
  tableValues?: string;
  type?: SvgTransferType;
}

interface SvgAAttributes
  extends SvgGraphicsIntrinsicElements, SvgXLinkAttributes {
  hreflang?: string;
}

interface SvgScriptAttributes
  extends SvgBaseIntrinsicElements, SvgHrefAttributes {
  crossOrigin?: "anonymous" | "use-credentials";
  crossorigin?: "anonymous" | "use-credentials";
  type?: string;
}

interface SvgSvgAttributes
  extends SvgGraphicsIntrinsicElements, SvgFitToViewBoxAttributes {
  baseProfile?: string;
  height?: SvgNumberish;
  version?: string;
  width?: SvgNumberish;
  x?: SvgNumberish;
  xmlns?: string;
  y?: SvgNumberish;
  zoomAndPan?: "disable" | "magnify" | (string & {});
}

interface AnimateIntrinsicElements
  extends
    SvgBaseIntrinsicElements,
    SvgAnimationTargetAttributes,
    SvgAnimationTimingAttributes,
    SvgAnimationValueAttributes,
    SvgAnimationAdditionAttributes {}

interface AnimateMotionIntrinsicElements
  extends
    SvgBaseIntrinsicElements,
    SvgHrefAttributes,
    SvgAnimationTimingAttributes,
    SvgAnimationValueAttributes,
    SvgAnimationAdditionAttributes {
  keyPoints?: string;
  origin?: string;
  path?: string;
  rotate?: SvgNumberish | (string & {});
}

interface AnimateTransformIntrinsicElements
  extends
    SvgBaseIntrinsicElements,
    SvgAnimationTargetAttributes,
    SvgAnimationTimingAttributes,
    SvgAnimationValueAttributes,
    SvgAnimationAdditionAttributes {
  type?: "translate" | "scale" | "rotate" | "skewX" | "skewY" | (string & {});
}

interface CircleIntrinsicElements extends SvgGraphicsIntrinsicElements {
  cx?: SvgNumberish;
  cy?: SvgNumberish;
  pathLength?: SvgNumberish;
  r?: SvgNumberish;
}

interface ClipPathIntrinsicElements extends SvgGraphicsIntrinsicElements {
  clipPathUnits?: SvgUnits;
}

interface DefsIntrinsicElements extends SvgGraphicsIntrinsicElements {}

interface DescIntrinsicElements extends SvgBaseIntrinsicElements {}

interface DiscardIntrinsicElements
  extends SvgBaseIntrinsicElements, SvgHrefAttributes {
  begin?: string;
}

interface EllipseIntrinsicElements extends SvgGraphicsIntrinsicElements {
  cx?: SvgNumberish;
  cy?: SvgNumberish;
  pathLength?: SvgNumberish;
  rx?: SvgNumberish;
  ry?: SvgNumberish;
}

interface FeBlendIntrinsicElements extends SvgFilterPrimitiveAttributes {
  in?: string;
  in2?: string;
  mode?: string;
}

interface FeColorMatrixIntrinsicElements extends SvgFilterPrimitiveAttributes {
  in?: string;
  type?: string;
  values?: string;
}

interface FeComponentTransferIntrinsicElements extends SvgFilterPrimitiveAttributes {
  in?: string;
}

interface FeCompositeIntrinsicElements extends SvgFilterPrimitiveAttributes {
  in?: string;
  in2?: string;
  k1?: SvgNumberish;
  k2?: SvgNumberish;
  k3?: SvgNumberish;
  k4?: SvgNumberish;
  operator?: SvgCompositeOperator;
}

interface FeConvolveMatrixIntrinsicElements extends SvgFilterPrimitiveAttributes {
  bias?: SvgNumberish;
  divisor?: SvgNumberish;
  edgeMode?: SvgEdgeMode;
  in?: string;
  kernelMatrix?: string;
  kernelUnitLength?: SvgNumberish | string;
  order?: SvgNumberish | string;
  preserveAlpha?: boolean | "true" | "false";
  targetX?: SvgNumberish;
  targetY?: SvgNumberish;
}

interface FeDiffuseLightingIntrinsicElements extends SvgFilterPrimitiveAttributes {
  diffuseConstant?: SvgNumberish;
  in?: string;
  kernelUnitLength?: SvgNumberish | string;
  surfaceScale?: SvgNumberish;
}

interface FeDisplacementMapIntrinsicElements extends SvgFilterPrimitiveAttributes {
  in?: string;
  in2?: string;
  scale?: SvgNumberish;
  xChannelSelector?: SvgChannelSelector;
  yChannelSelector?: SvgChannelSelector;
}

interface FeDistantLightIntrinsicElements extends SvgBaseIntrinsicElements {
  azimuth?: SvgNumberish;
  elevation?: SvgNumberish;
}

interface FeDropShadowIntrinsicElements extends SvgFilterPrimitiveAttributes {
  dx?: SvgNumberish;
  dy?: SvgNumberish;
  stdDeviation?: SvgNumberish | string;
}

interface FeFloodIntrinsicElements extends SvgFilterPrimitiveAttributes {}

interface FeFuncAIntrinsicElements
  extends SvgBaseIntrinsicElements, SvgTransferFunctionAttributes {}

interface FeFuncBIntrinsicElements
  extends SvgBaseIntrinsicElements, SvgTransferFunctionAttributes {}

interface FeFuncGIntrinsicElements
  extends SvgBaseIntrinsicElements, SvgTransferFunctionAttributes {}

interface FeFuncRIntrinsicElements
  extends SvgBaseIntrinsicElements, SvgTransferFunctionAttributes {}

interface FeGaussianBlurIntrinsicElements extends SvgFilterPrimitiveAttributes {
  edgeMode?: SvgEdgeMode;
  in?: string;
  stdDeviation?: SvgNumberish | string;
}

interface FeImageIntrinsicElements
  extends SvgFilterPrimitiveAttributes, SvgXLinkAttributes {
  crossOrigin?: "anonymous" | "use-credentials";
  crossorigin?: "anonymous" | "use-credentials";
  preserveAspectRatio?: string;
}

interface FeMergeIntrinsicElements extends SvgFilterPrimitiveAttributes {}

interface FeMergeNodeIntrinsicElements extends SvgBaseIntrinsicElements {
  in?: string;
}

interface FeMorphologyIntrinsicElements extends SvgFilterPrimitiveAttributes {
  in?: string;
  operator?: SvgMorphologyOperator;
  radius?: SvgNumberish | string;
}

interface FeOffsetIntrinsicElements extends SvgFilterPrimitiveAttributes {
  dx?: SvgNumberish;
  dy?: SvgNumberish;
  in?: string;
}

interface FePointLightIntrinsicElements extends SvgBaseIntrinsicElements {
  x?: SvgNumberish;
  y?: SvgNumberish;
  z?: SvgNumberish;
}

interface FeSpecularLightingIntrinsicElements extends SvgFilterPrimitiveAttributes {
  in?: string;
  kernelUnitLength?: SvgNumberish | string;
  specularConstant?: SvgNumberish;
  specularExponent?: SvgNumberish;
  surfaceScale?: SvgNumberish;
}

interface FeSpotLightIntrinsicElements extends SvgBaseIntrinsicElements {
  limitingConeAngle?: SvgNumberish;
  pointsAtX?: SvgNumberish;
  pointsAtY?: SvgNumberish;
  pointsAtZ?: SvgNumberish;
  specularExponent?: SvgNumberish;
  x?: SvgNumberish;
  y?: SvgNumberish;
  z?: SvgNumberish;
}

interface FeTileIntrinsicElements extends SvgFilterPrimitiveAttributes {
  in?: string;
}

interface FeTurbulenceIntrinsicElements extends SvgFilterPrimitiveAttributes {
  baseFrequency?: SvgNumberish | string;
  numOctaves?: SvgNumberish;
  seed?: SvgNumberish;
  stitchTiles?: SvgStitchTiles;
  type?: SvgTurbulenceType;
}

interface FilterIntrinsicElements
  extends SvgGraphicsIntrinsicElements, SvgXLinkAttributes {
  filterUnits?: SvgUnits;
  height?: SvgNumberish;
  primitiveUnits?: SvgUnits;
  width?: SvgNumberish;
  x?: SvgNumberish;
  y?: SvgNumberish;
}

interface ForeignObjectIntrinsicElements extends SvgGraphicsIntrinsicElements {
  height?: SvgNumberish;
  width?: SvgNumberish;
  x?: SvgNumberish;
  y?: SvgNumberish;
}

interface GIntrinsicElements extends SvgGraphicsIntrinsicElements {}

interface ImageIntrinsicElements
  extends SvgGraphicsIntrinsicElements, SvgXLinkAttributes {
  crossOrigin?: "anonymous" | "use-credentials";
  crossorigin?: "anonymous" | "use-credentials";
  decoding?: "sync" | "async" | "auto";
  height?: SvgNumberish;
  preserveAspectRatio?: string;
  width?: SvgNumberish;
  x?: SvgNumberish;
  y?: SvgNumberish;
}

interface LineIntrinsicElements extends SvgGraphicsIntrinsicElements {
  pathLength?: SvgNumberish;
  x1?: SvgNumberish;
  x2?: SvgNumberish;
  y1?: SvgNumberish;
  y2?: SvgNumberish;
}

interface LinearGradientIntrinsicElements
  extends SvgGraphicsIntrinsicElements, SvgXLinkAttributes {
  gradientTransform?: string;
  gradientUnits?: SvgUnits;
  spreadMethod?: SvgSpreadMethod;
  x1?: SvgNumberish;
  x2?: SvgNumberish;
  y1?: SvgNumberish;
  y2?: SvgNumberish;
}

interface MarkerIntrinsicElements
  extends SvgGraphicsIntrinsicElements, SvgFitToViewBoxAttributes {
  markerHeight?: SvgNumberish;
  markerUnits?: SvgMarkerUnits;
  markerWidth?: SvgNumberish;
  orient?: SvgOrient;
  refX?: SvgNumberish | (string & {});
  refY?: SvgNumberish | (string & {});
}

interface MaskIntrinsicElements extends SvgGraphicsIntrinsicElements {
  height?: SvgNumberish;
  maskContentUnits?: SvgUnits;
  maskUnits?: SvgUnits;
  width?: SvgNumberish;
  x?: SvgNumberish;
  y?: SvgNumberish;
}

interface MetadataIntrinsicElements extends SvgBaseIntrinsicElements {}

interface MpathIntrinsicElements
  extends SvgBaseIntrinsicElements, SvgXLinkAttributes {}

interface PathIntrinsicElements extends SvgGraphicsIntrinsicElements {
  d?: string;
  pathLength?: SvgNumberish;
}

interface PatternIntrinsicElements
  extends
    SvgGraphicsIntrinsicElements,
    SvgFitToViewBoxAttributes,
    SvgXLinkAttributes {
  height?: SvgNumberish;
  patternContentUnits?: SvgUnits;
  patternTransform?: string;
  patternUnits?: SvgUnits;
  width?: SvgNumberish;
  x?: SvgNumberish;
  y?: SvgNumberish;
}

interface PolygonIntrinsicElements extends SvgGraphicsIntrinsicElements {
  pathLength?: SvgNumberish;
  points?: string;
}

interface PolylineIntrinsicElements extends SvgGraphicsIntrinsicElements {
  pathLength?: SvgNumberish;
  points?: string;
}

interface RadialGradientIntrinsicElements
  extends SvgGraphicsIntrinsicElements, SvgXLinkAttributes {
  cx?: SvgNumberish;
  cy?: SvgNumberish;
  fr?: SvgNumberish;
  fx?: SvgNumberish;
  fy?: SvgNumberish;
  gradientTransform?: string;
  gradientUnits?: SvgUnits;
  r?: SvgNumberish;
  spreadMethod?: SvgSpreadMethod;
}

interface RectIntrinsicElements extends SvgGraphicsIntrinsicElements {
  height?: SvgNumberish;
  pathLength?: SvgNumberish;
  rx?: SvgNumberish;
  ry?: SvgNumberish;
  width?: SvgNumberish;
  x?: SvgNumberish;
  y?: SvgNumberish;
}

interface SetIntrinsicElements
  extends
    SvgBaseIntrinsicElements,
    SvgAnimationTargetAttributes,
    SvgAnimationTimingAttributes {
  to?: SvgNumberish | string;
}

interface StopIntrinsicElements extends SvgGraphicsIntrinsicElements {
  offset?: SvgNumberish | string;
}

interface SwitchIntrinsicElements extends SvgGraphicsIntrinsicElements {}

interface SymbolIntrinsicElements
  extends SvgGraphicsIntrinsicElements, SvgFitToViewBoxAttributes {
  height?: SvgNumberish;
  refX?: SvgNumberish | (string & {});
  refY?: SvgNumberish | (string & {});
  width?: SvgNumberish;
  x?: SvgNumberish;
  y?: SvgNumberish;
}

interface TextIntrinsicElements extends SvgGraphicsIntrinsicElements {
  dx?: SvgCoordinateList;
  dy?: SvgCoordinateList;
  lengthAdjust?: SvgLengthAdjust;
  rotate?: SvgCoordinateList;
  textLength?: SvgNumberish;
  x?: SvgCoordinateList;
  y?: SvgCoordinateList;
}

interface TextPathIntrinsicElements
  extends SvgGraphicsIntrinsicElements, SvgXLinkAttributes {
  lengthAdjust?: SvgLengthAdjust;
  method?: SvgTextPathMethod;
  path?: string;
  side?: "left" | "right" | (string & {});
  spacing?: SvgTextPathSpacing;
  startOffset?: SvgNumberish | string;
  textLength?: SvgNumberish;
}

interface TspanIntrinsicElements extends SvgGraphicsIntrinsicElements {
  dx?: SvgCoordinateList;
  dy?: SvgCoordinateList;
  lengthAdjust?: SvgLengthAdjust;
  rotate?: SvgCoordinateList;
  textLength?: SvgNumberish;
  x?: SvgCoordinateList;
  y?: SvgCoordinateList;
}

interface UseIntrinsicElements
  extends SvgGraphicsIntrinsicElements, SvgXLinkAttributes {
  height?: SvgNumberish;
  width?: SvgNumberish;
  x?: SvgNumberish;
  y?: SvgNumberish;
}

interface ViewIntrinsicElements
  extends SvgBaseIntrinsicElements, SvgFitToViewBoxAttributes {
  zoomAndPan?: "disable" | "magnify" | (string & {});
}

export {
  AnimateIntrinsicElements,
  AnimateMotionIntrinsicElements,
  AnimateTransformIntrinsicElements,
  CircleIntrinsicElements,
  ClipPathIntrinsicElements,
  DefsIntrinsicElements,
  DescIntrinsicElements,
  DiscardIntrinsicElements,
  EllipseIntrinsicElements,
  FeBlendIntrinsicElements,
  FeColorMatrixIntrinsicElements,
  FeComponentTransferIntrinsicElements,
  FeCompositeIntrinsicElements,
  FeConvolveMatrixIntrinsicElements,
  FeDiffuseLightingIntrinsicElements,
  FeDisplacementMapIntrinsicElements,
  FeDistantLightIntrinsicElements,
  FeDropShadowIntrinsicElements,
  FeFloodIntrinsicElements,
  FeFuncAIntrinsicElements,
  FeFuncBIntrinsicElements,
  FeFuncGIntrinsicElements,
  FeFuncRIntrinsicElements,
  FeGaussianBlurIntrinsicElements,
  FeImageIntrinsicElements,
  FeMergeIntrinsicElements,
  FeMergeNodeIntrinsicElements,
  FeMorphologyIntrinsicElements,
  FeOffsetIntrinsicElements,
  FePointLightIntrinsicElements,
  FeSpecularLightingIntrinsicElements,
  FeSpotLightIntrinsicElements,
  FeTileIntrinsicElements,
  FeTurbulenceIntrinsicElements,
  FilterIntrinsicElements,
  ForeignObjectIntrinsicElements,
  GIntrinsicElements,
  ImageIntrinsicElements,
  LinearGradientIntrinsicElements,
  LineIntrinsicElements,
  MarkerIntrinsicElements,
  MaskIntrinsicElements,
  MetadataIntrinsicElements,
  MpathIntrinsicElements,
  PathIntrinsicElements,
  PatternIntrinsicElements,
  PolygonIntrinsicElements,
  PolylineIntrinsicElements,
  RadialGradientIntrinsicElements,
  RectIntrinsicElements,
  SetIntrinsicElements,
  StopIntrinsicElements,
  SvgAAttributes,
  SvgScriptAttributes,
  SvgSvgAttributes,
  SwitchIntrinsicElements,
  SymbolIntrinsicElements,
  TextIntrinsicElements,
  TextPathIntrinsicElements,
  TspanIntrinsicElements,
  UseIntrinsicElements,
  ViewIntrinsicElements,
};
