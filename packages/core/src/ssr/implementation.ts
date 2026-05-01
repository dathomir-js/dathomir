import { renderDSD } from "@dathra/components/ssr";

/**
 * Render a Dathra component to Declarative Shadow DOM HTML for SSR.
 */
function render(
  ...args: Parameters<typeof renderDSD>
): ReturnType<typeof renderDSD> {
  return renderDSD(...args);
}

export { render };
