/**
 * Dathomir Web Components server-side plugin
 * 
 * This plugin imports and registers Dathomir Web Components
 * on the server side for SSR rendering.
 */
import "@/lib/dathomir";

export default defineNuxtPlugin(() => {
  // Components are registered via side effects in the import above
  // This allows renderDSD to find and render them
});
