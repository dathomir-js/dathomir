import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ComponentClass,
  ComponentContext,
} from "@/defineComponent/implementation";
import {
  clearRegistry,
  registerComponent,
} from "@/registry/implementation";
import {
  _resetRendererState,
  ensureComponentRenderer,
  renderDSD,
  renderDSDContent,
} from "./implementation";

describe("ssr", () => {
  beforeEach(() => {
    clearRegistry();
    _resetRendererState();
  });

  describe("renderDSD", () => {
    it("should render complete custom element with DSD", () => {
      const setup = () => "<div>Hello World</div>";
      registerComponent("test-element", setup, [], []);

      const html = renderDSD("test-element", {});

      expect(html).toContain("<test-element");
      expect(html).toContain("<template shadowrootmode=\"open\">");
      expect(html).toContain("<div>Hello World</div>");
      expect(html).toContain("</template>");
      expect(html).toContain("</test-element>");
    });

    it("should accept Component Class as first argument", () => {
      const setup = () => "<div>Component Class Test</div>";
      registerComponent("class-test", setup, [], []);

      const ComponentClass = {
        __tagName__: "class-test",
      } as ComponentClass;

      const html = renderDSD(ComponentClass, {});

      expect(html).toContain("<class-test");
      expect(html).toContain("<div>Component Class Test</div>");
    });

    it("should accept tag name string as first argument (legacy)", () => {
      const setup = () => "<div>String Test</div>";
      registerComponent("string-test", setup, [], []);

      const html = renderDSD("string-test", {});

      expect(html).toContain("<string-test");
      expect(html).toContain("<div>String Test</div>");
    });

    it("should escape attribute values", () => {
      const setup = () => "<div>Escape Test</div>";
      registerComponent("escape-test", setup, [], []);

      const html = renderDSD("escape-test", {
        value: '<script>alert("xss")</script>',
        quote: 'test"value"here',
      });

      expect(html).toContain("value=\"&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;\"");
      expect(html).toContain("quote=\"test&quot;value&quot;here\"");
    });

    it("should include CSS as <style> tags", () => {
      const setup = () => "<div>Styled</div>";
      const cssTexts = [
        ":host { display: block; }",
        "div { color: red; }",
      ];
      registerComponent("styled-element", setup, cssTexts, []);

      const html = renderDSD("styled-element", {});

      expect(html).toContain("<style>:host { display: block; }</style>");
      expect(html).toContain("<style>div { color: red; }</style>");
    });

    it("should throw error for unregistered component", () => {
      expect(() => {
        renderDSD("non-existent", {});
      }).toThrow('Component "non-existent" is not registered');
    });

    it("should handle empty attributes", () => {
      const setup = () => "<div>No Attrs</div>";
      registerComponent("no-attrs", setup, [], []);

      const html = renderDSD("no-attrs", {});

      expect(html).toBe(
        "<no-attrs><template shadowrootmode=\"open\"><div>No Attrs</div></template></no-attrs>"
      );
    });

    it("should handle multiple attributes", () => {
      const setup = () => "<div>Multi Attrs</div>";
      registerComponent("multi-attrs", setup, [], ["name", "value", "disabled"]);

      const html = renderDSD("multi-attrs", {
        name: "test",
        value: "123",
        disabled: "true",
      });

      expect(html).toContain('name="test"');
      expect(html).toContain('value="123"');
      expect(html).toContain('disabled="true"');
    });
  });

  describe("renderDSDContent", () => {
    it("should render DSD template only", () => {
      const setup = () => "<div>Template Only</div>";
      registerComponent("template-test", setup, [], []);

      const html = renderDSDContent("template-test", {});

      expect(html).toBe(
        "<template shadowrootmode=\"open\"><div>Template Only</div></template>"
      );
      expect(html).not.toContain("<template-test");
    });

    it("should accept Component Class", () => {
      const setup = () => "<div>Class Template</div>";
      registerComponent("class-template", setup, [], []);

      const ComponentClass = {
        __tagName__: "class-template",
      } as ComponentClass;

      const html = renderDSDContent(ComponentClass, {});

      expect(html).toContain("<template shadowrootmode=\"open\">");
      expect(html).toContain("<div>Class Template</div>");
    });

    it("should include CSS in template", () => {
      const setup = () => "<div>Styled Template</div>";
      const cssTexts = [":host { padding: 10px; }"];
      registerComponent("template-styled", setup, cssTexts, []);

      const html = renderDSDContent("template-styled", {});

      expect(html).toContain("<style>:host { padding: 10px; }</style>");
      expect(html).toContain("<div>Styled Template</div>");
    });

    it("should throw error for unregistered component", () => {
      expect(() => {
        renderDSDContent("non-existent", {});
      }).toThrow('Component "non-existent" is not registered');
    });
  });

  describe("ensureComponentRenderer", () => {
    it("should be idempotent", () => {
      // Call multiple times
      ensureComponentRenderer();
      ensureComponentRenderer();
      ensureComponentRenderer();

      // Should not throw
      expect(true).toBe(true);
    });

    it("should set up ComponentRenderer", () => {
      const setup = () => "<div>Renderer Test</div>";
      registerComponent("renderer-test", setup, [], []);

      ensureComponentRenderer();

      // renderDSD should work after setup
      const html = renderDSD("renderer-test", {});
      expect(html).toContain("<div>Renderer Test</div>");
    });
  });

  describe("attribute signal handling", () => {
    it("should pass attributes to setup function", () => {
      const setupSpy = vi.fn(() => "<div>Attr Test</div>");
      registerComponent("attr-component", setupSpy, [], ["name", "value"]);

      renderDSD("attr-component", { name: "test", value: "123" });

      expect(setupSpy).toHaveBeenCalled();
      const [, ctx] = setupSpy.mock.calls[0] as unknown as [
        HTMLElement,
        ComponentContext,
      ];
      expect(ctx.attrs.name.value).toBe("test");
      expect(ctx.attrs.value.value).toBe("123");
    });

    it("should handle missing attributes as null", () => {
      const setupSpy = vi.fn(() => "<div>Missing Attr</div>");
      registerComponent("missing-attr", setupSpy, [], ["name", "value"]);

      renderDSD("missing-attr", { name: "test" });

      const [, ctx] = setupSpy.mock.calls[0] as unknown as [
        HTMLElement,
        ComponentContext,
      ];
      expect(ctx.attrs.name.value).toBe("test");
      expect(ctx.attrs.value.value).toBeNull();
    });

    it("should convert non-string values to strings", () => {
      const setupSpy = vi.fn(() => "<div>Convert Test</div>");
      registerComponent("convert-test", setupSpy, [], ["count", "enabled"]);

      renderDSD("convert-test", { count: "42", enabled: "true" });

      const [, ctx] = setupSpy.mock.calls[0] as unknown as [
        HTMLElement,
        ComponentContext,
      ];
      expect(ctx.attrs.count.value).toBe("42");
      expect(ctx.attrs.enabled.value).toBe("true");
    });
  });

  describe("edge cases", () => {
    it("should handle component with no CSS", () => {
      const setup = () => "<div>No CSS</div>";
      registerComponent("no-css", setup, [], []);

      const html = renderDSD("no-css", {});

      expect(html).not.toContain("<style>");
      expect(html).toContain("<div>No CSS</div>");
    });

    it("should handle empty setup return value", () => {
      const setup = () => "";
      registerComponent("empty-setup", setup, [], []);

      const html = renderDSD("empty-setup", {});

      expect(html).toBe(
        "<empty-setup><template shadowrootmode=\"open\"></template></empty-setup>"
      );
    });

    it("should handle special characters in CSS", () => {
      const setup = () => "<div>Special CSS</div>";
      const cssTexts = [":host::before { content: '<>'; }"];
      registerComponent("special-css", setup, cssTexts, []);

      const html = renderDSD("special-css", {});

      expect(html).toContain("<style>:host::before { content: '<>'; }</style>");
    });
  });
});
