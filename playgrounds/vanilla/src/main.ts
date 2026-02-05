/**
 * Dathomir Playground - JSX Example
 *
 * This example uses JSX with the jsx-runtime.
 */
import { Counter } from "./Counter";

// Mount the counter component
const app = document.getElementById("app");
if (app) {
  const counterElement = Counter();
  app.appendChild(counterElement);
  console.log("Dathomir playground initialized!");
} else {
  console.error("App element not found");
}
