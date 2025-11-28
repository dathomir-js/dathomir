
import { hydrate } from "@dathomir/core/runtime";
import App from "./app";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("app");
  if (!container) return;
  hydrate(App(), container);
});
