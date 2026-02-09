import { describe, expect, it } from "vitest";

import { css } from "./implementation";

describe("css", () => {
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
});
