/**
 * SSR utilities for cross-framework Declarative Shadow DOM.
 *
 * - `renderDSD`: Full custom element HTML with DSD
 * - `renderDSDContent`: DSD template only (for dangerouslySetInnerHTML)
 * - `createComponentRenderer`: Callback for Dathomir's renderToString
 *
 * Note: ComponentRenderer is auto-configured when defineComponent() runs in SSR.
 * Manual setup is no longer required.
 *
 * @example
 * ```typescript
 * import './my-counter'; // registers via defineComponent
 * import { renderDSD } from '@dathomir/components/ssr';
 *
 * const html = renderDSD('my-counter', { initial: '10' });
 * ```
 *
 * @module
 */
export {
    createComponentRenderer,
    renderDSD,
    renderDSDContent
} from "./implementation";

