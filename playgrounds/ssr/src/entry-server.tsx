/**
 * Server entry point for SSR.
 * Renders the App component to HTML string with Declarative Shadow DOM.
 *
 * Note: This file runs on the server, so no DOM APIs are available.
 * The transformer generates SSR-compatible code when mode is 'ssr'.
 */

import { App } from "./App";

/**
 * Render the application to HTML string for SSR.
 * The App component is automatically transformed for SSR by the plugin.
 */
export function render(): string {
  // App() is transformed to return HTML string in SSR mode
  const html = App() as unknown as string;
  return html;
}

export { render as default };
