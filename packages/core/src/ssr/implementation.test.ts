import { describe, expect, it, vi } from "vitest";

import { renderDSD } from "@dathra/components/ssr";
import { render } from "./implementation";

vi.mock("@dathra/components/ssr", () => ({
  renderDSD: vi.fn(() => "<my-app></my-app>"),
}));

describe("core ssr", () => {
  it("passes arguments through to renderDSD", () => {
    const options = { store: undefined };

    render("my-app", { title: "Hello" }, options);

    expect(renderDSD).toHaveBeenCalledWith(
      "my-app",
      { title: "Hello" },
      options,
    );
  });

  it("returns the renderDSD result", () => {
    expect(render("my-app")).toBe("<my-app></my-app>");
  });
});
