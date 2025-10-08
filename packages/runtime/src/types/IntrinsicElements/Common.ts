import { AilurosNode } from "@/jsx-runtime";

/**
 * Common event handler attributes (onXXX) for all HTML elements.
 * These handlers correspond to GlobalEventHandlers in the HTML specification
 * and are available on all HTML elements, Document, and Window objects.
 *
 * @see https://html.spec.whatwg.org/multipage/webappapis.html#globaleventhandlers
 */
interface CommonEventHandlers {
  // Mouse Events
  /** Click event handler */
  onClick?: (event: MouseEvent) => void;
  /** Double click event handler */
  onDblClick?: (event: MouseEvent) => void;
  /** Mouse down event handler */
  onMouseDown?: (event: MouseEvent) => void;
  /** Mouse up event handler */
  onMouseUp?: (event: MouseEvent) => void;
  /** Mouse move event handler */
  onMouseMove?: (event: MouseEvent) => void;
  /** Mouse over event handler */
  onMouseOver?: (event: MouseEvent) => void;
  /** Mouse out event handler */
  onMouseOut?: (event: MouseEvent) => void;
  /** Mouse enter event handler */
  onMouseEnter?: (event: MouseEvent) => void;
  /** Mouse leave event handler */
  onMouseLeave?: (event: MouseEvent) => void;
  /** Auxiliary click event handler (e.g. middle mouse button) */
  onAuxClick?: (event: MouseEvent) => void;
  /** Context menu event handler */
  onContextMenu?: (event: MouseEvent) => void;
  /** Wheel event handler */
  onWheel?: (event: WheelEvent) => void;

  // Keyboard Events
  /** Key down event handler */
  onKeyDown?: (event: KeyboardEvent) => void;
  /** Key up event handler */
  onKeyUp?: (event: KeyboardEvent) => void;
  /** Key press event handler (deprecated but still supported) */
  onKeyPress?: (event: KeyboardEvent) => void;

  // Focus Events
  /** Focus event handler */
  onFocus?: (event: FocusEvent) => void;
  /** Blur event handler */
  onBlur?: (event: FocusEvent) => void;

  // Input Events
  /** Input event handler */
  onInput?: (event: Event) => void;
  /** Change event handler */
  onChange?: (event: Event) => void;
  /** Before input event handler */
  onBeforeInput?: (event: InputEvent) => void;

  // Drag & Drop Events
  /** Drag event handler */
  onDrag?: (event: DragEvent) => void;
  /** Drag start event handler */
  onDragStart?: (event: DragEvent) => void;
  /** Drag end event handler */
  onDragEnd?: (event: DragEvent) => void;
  /** Drag enter event handler */
  onDragEnter?: (event: DragEvent) => void;
  /** Drag leave event handler */
  onDragLeave?: (event: DragEvent) => void;
  /** Drag over event handler */
  onDragOver?: (event: DragEvent) => void;
  /** Drop event handler */
  onDrop?: (event: DragEvent) => void;

  // Clipboard Events
  /** Copy event handler */
  onCopy?: (event: ClipboardEvent) => void;
  /** Cut event handler */
  onCut?: (event: ClipboardEvent) => void;
  /** Paste event handler */
  onPaste?: (event: ClipboardEvent) => void;

  // Scroll Events
  /** Scroll event handler */
  onScroll?: (event: Event) => void;
  /** Scroll end event handler */
  onScrollEnd?: (event: Event) => void;

  // Selection Events
  /** Select event handler */
  onSelect?: (event: Event) => void;

  // Animation Events (CSS Animations)
  /** Animation start event handler */
  onAnimationStart?: (event: AnimationEvent) => void;
  /** Animation end event handler */
  onAnimationEnd?: (event: AnimationEvent) => void;
  /** Animation iteration event handler */
  onAnimationIteration?: (event: AnimationEvent) => void;
  /** Animation cancel event handler */
  onAnimationCancel?: (event: AnimationEvent) => void;

  // Transition Events (CSS Transitions)
  /** Transition start event handler */
  onTransitionStart?: (event: TransitionEvent) => void;
  /** Transition end event handler */
  onTransitionEnd?: (event: TransitionEvent) => void;
  /** Transition run event handler */
  onTransitionRun?: (event: TransitionEvent) => void;
  /** Transition cancel event handler */
  onTransitionCancel?: (event: TransitionEvent) => void;

  // Touch Events
  /** Touch start event handler */
  onTouchStart?: (event: TouchEvent) => void;
  /** Touch move event handler */
  onTouchMove?: (event: TouchEvent) => void;
  /** Touch end event handler */
  onTouchEnd?: (event: TouchEvent) => void;
  /** Touch cancel event handler */
  onTouchCancel?: (event: TouchEvent) => void;

  // Pointer Events
  /** Pointer down event handler */
  onPointerDown?: (event: PointerEvent) => void;
  /** Pointer up event handler */
  onPointerUp?: (event: PointerEvent) => void;
  /** Pointer move event handler */
  onPointerMove?: (event: PointerEvent) => void;
  /** Pointer enter event handler */
  onPointerEnter?: (event: PointerEvent) => void;
  /** Pointer leave event handler */
  onPointerLeave?: (event: PointerEvent) => void;
  /** Pointer over event handler */
  onPointerOver?: (event: PointerEvent) => void;
  /** Pointer out event handler */
  onPointerOut?: (event: PointerEvent) => void;
  /** Pointer cancel event handler */
  onPointerCancel?: (event: PointerEvent) => void;
  /** Got pointer capture event handler */
  onGotPointerCapture?: (event: PointerEvent) => void;
  /** Lost pointer capture event handler */
  onLostPointerCapture?: (event: PointerEvent) => void;

  // Other Common Events
  /** Abort event handler */
  onAbort?: (event: Event) => void;
  /** Cancel event handler */
  onCancel?: (event: Event) => void;
  /** Close event handler */
  onClose?: (event: Event) => void;
  /** Before match event handler (hidden=until-found) */
  onBeforeMatch?: (event: Event) => void;
  /** Command event handler (commandfor attribute) */
  onCommand?: (event: Event) => void;
  /** Security policy violation event handler */
  onSecurityPolicyViolation?: (event: SecurityPolicyViolationEvent) => void;
  /** Slot change event handler */
  onSlotChange?: (event: Event) => void;
  /** Toggle event handler */
  onToggle?: (event: Event) => void;
  /** Before toggle event handler */
  onBeforeToggle?: (event: Event) => void;

  // WebKit-prefixed events (for compatibility)
  /** WebKit animation end event handler */
  onWebkitAnimationEnd?: (event: Event) => void;
  /** WebKit animation iteration event handler */
  onWebkitAnimationIteration?: (event: Event) => void;
  /** WebKit animation start event handler */
  onWebkitAnimationStart?: (event: Event) => void;
  /** WebKit transition end event handler */
  onWebkitTransitionEnd?: (event: Event) => void;
}

/**
 * Common attributes for all HTML elements.
 * These attributes are defined as global attributes in the HTML specification
 * and can be used on all HTML elements.
 *
 * @see https://html.spec.whatwg.org/multipage/dom.html#global-attributes
 */
interface CommonAttributes {
  // Core Attributes
  /** CSS class names (space-separated if multiple) */
  className?: string;
  /** Specifies a unique id for the element */
  id?: string;
  /** Advisory information for the element (tooltip) */
  title?: string;

  // Language and Direction
  /** Primary language for the element's contents */
  lang?: string;
  /** Text directionality */
  dir?: "ltr" | "rtl" | "auto";
  /** Whether element's text should be translated */
  translate?: "yes" | "no";

  // User Interaction
  /** Whether the element should be hidden */
  hidden?: boolean | "until-found";
  /** Whether the element and its descendants are inert */
  inert?: boolean;
  /** Keyboard shortcut to activate or focus the element */
  accessKey?: string;
  /** Whether the element is editable */
  contentEditable?: "true" | "false" | "plaintext-only" | "inherit";
  /** Whether the element is draggable */
  draggable?: boolean;
  /** Whether spelling and grammar should be checked */
  spellcheck?: boolean;
  /** Tab order position */
  tabIndex?: number;
  /** Autocapitalization behavior for text input */
  autocapitalize?: "off" | "none" | "on" | "sentences" | "words" | "characters";
  /** Autocorrect behavior for text input */
  autocorrect?: "on" | "off";
  /** Hint for virtual keyboard enter key label */
  enterkeyhint?:
    | "enter"
    | "done"
    | "go"
    | "next"
    | "previous"
    | "search"
    | "send";
  /** Hint for virtual keyboard type */
  inputmode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
  /** Whether to show writing suggestions */
  writingSuggestions?: "true" | "false";
  /** Whether the element should be automatically focused */
  autofocus?: boolean;

  // Popover API
  /** Popover state */
  popover?: "auto" | "manual";

  // Styling
  /** Inline CSS styles */
  style?: Partial<CSSStyleDeclaration>;
  /** Cryptographic nonce for CSP */
  nonce?: string;

  // Shadow DOM
  /** Assigns a slot in a shadow DOM */
  slot?: string;

  // Custom Elements
  /** Custom element name for customized built-in elements */
  is?: string;

  // Microdata
  /** Microdata item ID */
  itemid?: string;
  /** Microdata item property */
  itemprop?: string;
  /** Microdata item references */
  itemref?: string;
  /** Microdata item scope */
  itemscope?: boolean;
  /** Microdata item type */
  itemtype?: string;

  // ARIA Attributes (all aria-* attributes)
  /** ARIA role */
  role?: string;
  /** Any aria-* attribute */
  [ariaAttr: `aria-${string}`]: string | undefined;

  // Custom Data Attributes (all data-* attributes)
  /** Any data-* attribute */
  [dataAttr: `data-${string}`]: string | undefined;

  // Children
  /** Children nodes */
  children?: AilurosNode;
}

interface CommonIntrinsicElements
  extends CommonAttributes,
    CommonEventHandlers {}

export { CommonEventHandlers, CommonAttributes, CommonIntrinsicElements };
