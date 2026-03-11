import "./SSRAppRoot";

/**
 * Hydrate the server-rendered application.
 */
function bootstrap(): void {
  const container = document.getElementById("app");
  if (!container) {
    console.error("App container not found");
    return;
  }

  const hasRoot = container.querySelector("playground-ssr-app") !== null;
  if (!hasRoot) {
    container.appendChild(document.createElement("playground-ssr-app"));
  }
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
