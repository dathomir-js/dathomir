import { beforeEach, describe, expect, it } from "vitest";

import {
  adoptGlobalStyles,
  clearGlobalStyles,
  css,
  getCssText,
  getGlobalStyleCssTexts,
} from "./implementation";

describe("css", () => {
  beforeEach(() => {
    clearGlobalStyles();
  });

  it("should return a CSSStyleSheet instance", () => {
    const sheet = css`
      :host {
        display: block;
      }
    `;
    expect(sheet).toBeInstanceOf(CSSStyleSheet);
  });

  it("should interpolate values correctly", () => {
    const color = "red";
    const size = 16;
    const sheet = css`
      :host {
        color: ${color};
        font-size: ${size}px;
      }
    `;
    expect(sheet).toBeInstanceOf(CSSStyleSheet);
  });

  it("should handle empty styles", () => {
    const sheet = css``;
    expect(sheet).toBeInstanceOf(CSSStyleSheet);
  });

  it("should handle multiple interpolations", () => {
    const a = "flex";
    const b = "center";
    const c = "10px";
    const sheet = css`
      :host {
        display: ${a};
        align-items: ${b};
        padding: ${c};
      }
    `;
    expect(sheet).toBeInstanceOf(CSSStyleSheet);
  });

  // Test case #5: getCssText() returns __cssText from a CSSStyleSheet
  it("getCssText() should return __cssText from a css sheet", () => {
    const sheet = css`
      :host {
        color: blue;
      }
    `;
    const text = getCssText(sheet);
    expect(text).toBe(`
      :host {
        color: blue;
      }
    `);
  });

  // Test case #6: getCssText() returns string argument as-is
  it("getCssText() should return a plain string as-is", () => {
    const rawCss = ":host { display: block; }";
    expect(getCssText(rawCss)).toBe(rawCss);
  });

  it("adoptGlobalStyles() should register string and CSSStyleSheet inputs", () => {
    const sheet = css`
      :host {
        color: green;
      }
    `;

    adoptGlobalStyles(":host { display: block; }", sheet);

    expect(getGlobalStyleCssTexts()).toEqual([
      ":host { display: block; }",
      `
      :host {
        color: green;
      }
    `,
    ]);
  });

  it("adoptGlobalStyles() should register native CSSStyleSheet inputs", () => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(":host { color: olive; }");

    adoptGlobalStyles(sheet);

    expect(getGlobalStyleCssTexts()).toEqual([":host { color: olive; }"]);
  });

  it("adoptGlobalStyles() should dedupe duplicate css text", () => {
    const a = ":host { color: tomato; }";
    const b = css`:host { color: tomato; }`;

    adoptGlobalStyles(a, b, a);

    expect(getGlobalStyleCssTexts()).toEqual([a]);
  });

  it("adoptGlobalStyles() should dedupe duplicate native sheet identity", () => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(":host { color: slateblue; }");

    adoptGlobalStyles(sheet, sheet);

    expect(getGlobalStyleCssTexts()).toEqual([":host { color: slateblue; }"]);
  });
});
