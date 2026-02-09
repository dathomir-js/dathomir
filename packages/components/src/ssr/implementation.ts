/**
 * SSR DSD renderer for Web Components.
 *
 * Provides renderDSD/renderDSDContent for cross-framework SSR,
 * and auto-setup of ComponentRenderer for Dathomir SSR.
 * @module
 */

import type {
  ComponentClass,
  ComponentContext,
} from "@/defineComponent/implementation";
import { getComponent } from "@/registry/implementation";
import { signal } from "@dathomir/reactivity";
import { setComponentRenderer } from "@dathomir/runtime/ssr";

/**
 * Render DSD inner content for a registered component.
 * Returns `<style>` tags + component HTML, or null if not registered.
 * @internal
 */
function renderComponentContent(
  tagName: string,
  attrs: Record<string, unknown>,
): string | null {
  const registration = getComponent(tagName);
  if (!registration) return null;

  // Build ComponentContext from attributes
  const attrSignals: Record<string, ReturnType<typeof signal<string | null>>> =
    {};
  for (const name of registration.attrs) {
    const value = attrs[name];
    attrSignals[name] = signal(
      value != null ? String(value) : null,
    );
  }
  const ctx: ComponentContext = { attrs: attrSignals };

  // Call setup function (in SSR mode, returns HTML string)
  const mockHost = {} as HTMLElement;
  const result = registration.setup(mockHost, ctx);

  // In SSR mode, the setup function returns an HTML string
  const contentHtml = typeof result === "string" ? result : "";

  // Build DSD content: <style> tags + component HTML
  let dsdContent = "";

  // Add CSS as <style> tags inside DSD
  for (const cssText of registration.cssTexts) {
    dsdContent += `<style>${cssText}</style>`;
  }

  // Add component content
  dsdContent += contentHtml;

  return dsdContent;
}

/**
 * Escape an attribute value for safe HTML output.
 */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Render Declarative Shadow DOM content (inner template only).
 *
 * Returns `<template shadowrootmode="open">...</template>` for a registered component.
 * Useful with `dangerouslySetInnerHTML` in React or similar patterns.
 *
 * @param target - The custom element tag name or component class.
 * @param attrs - Attribute values to pass to the component.
 * @returns The DSD template HTML string.
 * @throws If the component is not registered.
 *
 * @example
 * ```tsx
 * // With component class
 * const Counter = defineComponent('my-counter', ...);
 * const dsd = renderDSDContent(Counter, { initial: '10' });
 * <my-counter initial="10" dangerouslySetInnerHTML={{ __html: dsd }} />
 *
 * // With tag name (legacy)
 * const dsd = renderDSDContent('my-counter', { initial: '10' });
 * ```
 */
function renderDSDContent(
  target: string | ComponentClass,
  attrs: Record<string, string> = {},
): string {
  const tagName = typeof target === "string" ? target : target.__tagName__;
  const content = renderComponentContent(tagName, attrs);
  if (content == null) {
    throw new Error(
      `[dathomir] Component "${tagName}" is not registered. Call defineComponent() first.`,
    );
  }
  return `<template shadowrootmode="open">${content}</template>`;
}

/**
 * Render a complete custom element with Declarative Shadow DOM.
 *
 * Returns the full element HTML including the DSD template.
 * Can be directly inserted into any SSR output (React, Vue, etc.).
 *
 * @param target - The custom element tag name or component class.
 * @param attrs - Attribute values to pass to the component.
 * @returns The full custom element HTML with DSD.
 * @throws If the component is not registered.
 *
 * @example
 * ```typescript
 * // With component class (recommended)
 * const Counter = defineComponent('my-counter', ...);
 * const html = renderDSD(Counter, { initial: '10' });
 * // → '<my-counter initial="10"><template shadowrootmode="open">...</template></my-counter>'
 *
 * // With tag name (legacy)
 * const html = renderDSD('my-counter', { initial: '10' });
 * ```
 */
function renderDSD(
  target: string | ComponentClass,
  attrs: Record<string, string> = {},
): string {
  const tagName = typeof target === "string" ? target : target.__tagName__;
  const dsdTemplate = renderDSDContent(tagName, attrs);

  // Build attribute string
  let attrStr = "";
  for (const [key, value] of Object.entries(attrs)) {
    attrStr += ` ${key}="${escapeAttr(value)}"`;
  }

  return `<${tagName}${attrStr}>${dsdTemplate}</${tagName}>`;
}

/**
 * Create a component renderer callback for Dathomir's renderToString.
 *
 * Uses the component registry to resolve custom element tags
 * and render their content with Declarative Shadow DOM.
 *
 * @returns A function that takes (tagName, attrs) and returns DSD HTML or null.
 */
function createComponentRenderer(): (
  tagName: string,
  attrs: Record<string, unknown>,
) => string | null {
  return renderComponentContent;
}

/** Whether the global ComponentRenderer has been initialized. */
let _rendererInitialized = false;

/**
 * Ensure the global ComponentRenderer is set up for Dathomir SSR.
 * Called automatically by defineComponent in SSR mode.
 * Safe to call multiple times (idempotent).
 * @internal
 */
function ensureComponentRenderer(): void {
  if (_rendererInitialized) return;
  _rendererInitialized = true;
  setComponentRenderer(renderComponentContent);
}

/**
 * Reset the SSR renderer initialization state.
 * @internal - For testing only.
 */
function _resetRendererState(): void {
  _rendererInitialized = false;
}

export {
  _resetRendererState, createComponentRenderer,
  ensureComponentRenderer,
  renderDSD,
  renderDSDContent
};

