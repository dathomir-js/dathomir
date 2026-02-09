/**
 * SSR Web Component Registry.
 *
 * When defineComponent() is called in SSR, it registers the component's
 * setup function, styles, and attribute names here. The SSR renderer
 * queries this registry to generate Declarative Shadow DOM output.
 * @module
 */

import type { SetupFunction } from "@/defineComponent/implementation";

/** Registered component metadata for SSR. */
interface ComponentRegistration {
  /** Tag name of the custom element. */
  readonly tagName: string;
  /** Setup function that builds DOM content. */
  readonly setup: SetupFunction;
  /** Raw CSS text strings for DSD <style> output. */
  readonly cssTexts: readonly string[];
  /** Observed attribute names. */
  readonly attrs: readonly string[];
}

/** Global registry: tagName → ComponentRegistration */
const registry = new Map<string, ComponentRegistration>();

/**
 * Register a Web Component for SSR rendering.
 * @param tagName - Custom element tag name (must contain a hyphen).
 * @param setup - Setup function that creates the component's DOM content.
 * @param cssTexts - Raw CSS text strings for SSR <style> output.
 * @param attrs - Observed attribute names.
 */
function registerComponent(
  tagName: string,
  setup: SetupFunction,
  cssTexts: readonly string[],
  attrs: readonly string[],
): void {
  registry.set(tagName, { tagName, setup, cssTexts, attrs });
}

/**
 * Get a registered component by tag name.
 * @param tagName - Custom element tag name.
 * @returns Component registration or undefined if not registered.
 */
function getComponent(tagName: string): ComponentRegistration | undefined {
  return registry.get(tagName);
}

/**
 * Check if a tag name is a registered Web Component.
 * @param tagName - Tag name to check.
 */
function hasComponent(tagName: string): boolean {
  return registry.has(tagName);
}

/**
 * Clear the registry (useful for testing).
 */
function clearRegistry(): void {
  registry.clear();
}

export { clearRegistry, getComponent, hasComponent, registerComponent };
export type { ComponentRegistration };

