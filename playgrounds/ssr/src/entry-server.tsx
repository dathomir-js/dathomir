import { renderDSD } from "@dathomir/components/ssr";

import { SSRAppRoot } from "./SSRAppRoot";

/**
 * Render the application to HTML string for SSR.
 */
export function render(): string {
  return renderDSD(SSRAppRoot, {});
}

export { render as default };
