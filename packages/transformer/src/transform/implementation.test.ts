import { describe, expect, it } from "vitest";
import { transform } from "../index";

describe("transform", () => {
  it("should transform simple JSX element", () => {
    const code = `
      const element = <div>Hello</div>;
    `;

    const result = transform(code);

    expect(result.code).toContain("fromTree");
    expect(result.code).toContain("div");
    expect(result.code).toContain("Hello");
  });

  it("should transform JSX with static attributes", () => {
    const code = `
      const element = <button class="btn" disabled>Click</button>;
    `;

    const result = transform(code);

    expect(result.code).toContain("class");
    expect(result.code).toContain("btn");
    expect(result.code).toContain("disabled");
    expect(result.code).toContain("true");
  });

  it("should transform JSX with onClick handler", () => {
    const code = `
      const handler = () => {};
      const element = <button onClick={handler}>Click</button>;
    `;

    const result = transform(code);

    expect(result.code).toContain("event");
    expect(result.code).toContain("click");
  });

  it("should transform JSX with dynamic text", () => {
    const code = `
      const count = signal(0);
      const element = <span>Count: {count.value}</span>;
    `;

    const result = transform(code);

    expect(result.code).toContain("templateEffect");
    expect(result.code).toContain("setText");
    expect(result.code).toContain("count.value");
  });

  it("should transform JSX with dynamic attribute", () => {
    const code = `
      const isActive = signal(false);
      const element = <div class={isActive.value ? 'active' : 'inactive'}>Content</div>;
    `;

    const result = transform(code);

    expect(result.code).toContain("templateEffect");
    expect(result.code).toContain("setAttr");
    expect(result.code).toContain("class");
    expect(result.code).toContain("isActive.value");
  });

  it("should add runtime imports", () => {
    const code = `
      const element = <div>Hello</div>;
    `;

    const result = transform(code);

    expect(result.code).toContain("import");
    expect(result.code).toContain("@dathomir/runtime");
    expect(result.code).toContain("fromTree");
  });

  it("should transform nested JSX elements", () => {
    const code = `
      const element = (
        <div>
          <span>Hello</span>
          <span>World</span>
        </div>
      );
    `;

    const result = transform(code);

    expect(result.code).toContain("fromTree");
    expect(result.code).toContain("div");
    expect(result.code).toContain("span");
  });

  it("should transform JSX fragment", () => {
    const code = `
      const element = (
        <>
          <div>First</div>
          <div>Second</div>
        </>
      );
    `;

    const result = transform(code);

    expect(result.code).toContain("fromTree");
    expect(result.code).toContain("div");
  });

  it("should handle multiple event handlers", () => {
    const code = `
      const onClick = () => {};
      const onMouseEnter = () => {};
      const element = <button onClick={onClick} onMouseEnter={onMouseEnter}>Hover</button>;
    `;

    const result = transform(code);

    expect(result.code).toContain("event");
    expect(result.code).toContain("click");
    expect(result.code).toContain("mouseenter");
  });

  it("should generate source map when requested", () => {
    const code = `
      const element = <div>Hello</div>;
    `;

    const result = transform(code, { sourceMap: true, filename: "test.tsx" });

    expect(result.map).toBeDefined();
    expect(typeof result.map).toBe("string");
  });

  it("should not generate source map by default", () => {
    const code = `
      const element = <div>Hello</div>;
    `;

    const result = transform(code);

    expect(result.map).toBeUndefined();
  });

  it("should preserve non-JSX code", () => {
    const code = `
      const count = 0;
      function increment() {
        return count + 1;
      }
      const element = <div>Hello</div>;
    `;

    const result = transform(code);

    expect(result.code).toContain("const count = 0");
    expect(result.code).toContain("function increment");
    expect(result.code).toContain("return count + 1");
  });

  describe("Component elements", () => {
    it("should transform component element to function call in CSR mode", () => {
      const code = `
        const element = <Counter initialCount={5} />;
      `;

      const result = transform(code, { mode: "csr" });

      // Component should be converted to function call
      expect(result.code).toContain("Counter");
      expect(result.code).toContain("initialCount");
      expect(result.code).toContain("5");
      // Should NOT contain fromTree for component
      expect(result.code).not.toContain("fromTree");
    });

    it("should transform component element to function call in SSR mode", () => {
      const code = `
        const element = <Counter initialCount={10} />;
      `;

      const result = transform(code, { mode: "ssr" });

      // Component should be converted to function call
      expect(result.code).toContain("Counter");
      expect(result.code).toContain("initialCount");
      expect(result.code).toContain("10");
      // Should NOT contain renderToString for component-only
      expect(result.code).not.toContain("renderToString");
    });

    it("should handle nested component elements with insert", () => {
      const code = `
        const element = (
          <div>
            <Counter initialCount={5} />
          </div>
        );
      `;

      const result = transform(code);

      // Should contain fromTree for outer div
      expect(result.code).toContain("fromTree");
      expect(result.code).toContain("div");
      // Should contain insert for nested component
      expect(result.code).toContain("insert");
      expect(result.code).toContain("Counter");
      expect(result.code).toContain("initialCount");
      expect(result.code).toContain("templateEffect");
    });

    it("should handle root component element without tree generation", () => {
      const code = `
        function App() {
          return <Counter initialCount={5} />;
        }
      `;

      const result = transform(code);

      // Should be direct function call, no fromTree
      expect(result.code).toContain("Counter");
      expect(result.code).toContain("initialCount");
      expect(result.code).not.toContain("fromTree");
      expect(result.code).not.toContain("templateEffect");
    });

    it("should handle JSXMemberExpression as component", () => {
      const code = `
        const element = <Foo.Bar baz="qux" />;
      `;

      const result = transform(code);

      // Should treat Foo.Bar as component (function call)
      expect(result.code).toContain("Foo");
      expect(result.code).toContain("Bar");
      expect(result.code).toContain("baz");
      expect(result.code).toContain("qux");
      // Should NOT use fromTree for component
      expect(result.code).not.toContain("fromTree");
    });

    it("should distinguish lowercase HTML elements from uppercase components", () => {
      const code = `
        const element = (
          <div>
            <button>Click</button>
            <Counter />
          </div>
        );
      `;

      const result = transform(code);

      // HTML elements should be in tree
      expect(result.code).toContain("fromTree");
      expect(result.code).toContain("div");
      expect(result.code).toContain("button");
      // Component should be inserted
      expect(result.code).toContain("Counter");
      expect(result.code).toContain("insert");
    });

    it("should pass children as children prop to components", () => {
      const code = `
        const element = (
          <Panel title="My Panel">
            <div>Content</div>
          </Panel>
        );
      `;

      const result = transform(code);

      // Component should receive children prop
      expect(result.code).toContain("Panel");
      expect(result.code).toContain("title");
      expect(result.code).toContain("children");
      // Children should still be processed (HTML element)
      expect(result.code).toContain("div");
    });

    it("should handle component with spread props", () => {
      const code = `
        const props = { count: 5, label: "Counter" };
        const element = <Counter {...props} />;
      `;

      const result = transform(code);

      // Should spread props in function call
      expect(result.code).toContain("Counter");
      expect(result.code).toContain("props");
      expect(result.code).toContain("...");
    });
  });
});
