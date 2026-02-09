/**
 * JSX type definitions for Dathomir.
 * Enables TypeScript support for JSX elements.
 */
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>;
  }

  interface Element extends Node {}

  interface ElementAttributesProperty {
    props: Record<string, unknown>;
  }

  interface ElementChildrenAttribute {
    children: unknown;
  }
}
