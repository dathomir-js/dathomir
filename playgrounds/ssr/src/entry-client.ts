/**
 * Client entry point for Hydration.
 * Hydrates the server-rendered content.
 */

import { createRoot } from "@dathomir/core";
import { App } from "./App";

/**
 * Hydrate the server-rendered application.
 */
function hydrate(): void {
  const container = document.getElementById("app");
  if (!container) {
    console.error("App container not found");
    return;
  }

  // Check if SSR content exists
  const ssrContent = container.innerHTML.trim();
  if (!ssrContent || ssrContent === "<!--ssr-outlet-->") {
    // No SSR content - do CSR rendering
    console.log("[dathomir] No SSR content found, performing CSR");
    createRoot(() => {
      const appContent = App();
      if (appContent instanceof DocumentFragment || appContent instanceof Node) {
        container.innerHTML = "";
        container.appendChild(appContent);
      }
    });
    return;
  }

  // SSR content exists - perform hydration
  console.log("[dathomir] SSR content found, performing hydration");

  // For Phase 2 demo, we'll do CSR for now
  // Full hydration will be connected in next iteration
  createRoot(() => {
    const appContent = App();
    if (appContent instanceof DocumentFragment || appContent instanceof Node) {
      container.innerHTML = "";
      container.appendChild(appContent);
    }
  });
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", hydrate);
} else {
  hydrate();
}
