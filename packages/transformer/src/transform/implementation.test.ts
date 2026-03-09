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

  it("should transform spread attributes on HTML element using spread() and templateEffect", () => {
    const code = `
      const props = { class: "foo" };
      const element = <div {...props}>Content</div>;
    `;

    const result = transform(code);

    // Spread on HTML element should use spread() + templateEffect for reactivity
    expect(result.code).toContain("spread");
    expect(result.code).toContain("templateEffect");
    expect(result.code).toContain("props");
  });

  it("should transform conditional rendering (ternary) using insert() and templateEffect", () => {
    const code = `
      const show = signal(true);
      const element = <div>{show.value ? <span>Yes</span> : <span>No</span>}</div>;
    `;

    const result = transform(code);

    // Conditional expression should use insert() wrapped in templateEffect
    expect(result.code).toContain("insert");
    expect(result.code).toContain("templateEffect");
    expect(result.code).toContain("show.value");
  });

  it("should transform list rendering (.map()) using insert() and templateEffect", () => {
    const code = `
      const items = ["a", "b", "c"];
      const element = <ul>{items.map(item => <li>{item}</li>)}</ul>;
    `;

    const result = transform(code);

    // .map() expression should use insert() wrapped in templateEffect
    expect(result.code).toContain("insert");
    expect(result.code).toContain("templateEffect");
    expect(result.code).toContain("items");
    expect(result.code).toContain("map");
  });

  it("should insert runtime imports after existing import declarations", () => {
    const code = `
      import { signal } from "@dathomir/reactivity";
      const element = <div>Hello</div>;
    `;

    const result = transform(code);

    // Runtime imports should appear after the existing import
    const importIndex = result.code.indexOf("@dathomir/reactivity");
    const runtimeIndex = result.code.indexOf("@dathomir/runtime");
    expect(importIndex).toBeGreaterThanOrEqual(0);
    expect(runtimeIndex).toBeGreaterThanOrEqual(0);
    // Both imports should be present
    expect(result.code).toContain("import");
    expect(result.code).toContain("fromTree");
  });

  it("should transform nested Fragment in CSR mode", () => {
    const code = `
      const element = (
        <>
          <div>First</div>
          <>
            <span>Second</span>
            <span>Third</span>
          </>
        </>
      );
    `;

    const result = transform(code);

    // Outer fragment should be transformed, inner Fragment is processed as part of tree
    expect(result.code).toContain("fromTree");
    expect(result.code).toContain("div");
    expect(result.code).toContain("span");
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

    it("should handle nested component elements with insert (no templateEffect)", () => {
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
      // Components are inserted directly (NOT wrapped in templateEffect)
      // to prevent re-creation on every signal change
      expect(result.code).not.toContain("templateEffect");
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

  describe("Fragment dynamic content", () => {
    it("should generate templateEffect and setText for dynamic text inside Fragment", () => {
      const code = `
        const count = signal(0);
        const element = (
          <>
            <span>{count.value}</span>
          </>
        );
      `;

      const result = transform(code);

      // Fragment with dynamic text must produce templateEffect + setText
      expect(result.code).toContain("templateEffect");
      expect(result.code).toContain("setText");
      expect(result.code).toContain("count.value");
    });

    it("should generate insert for component inside Fragment", () => {
      const code = `
        const element = (
          <>
            <Counter initialCount={5} />
          </>
        );
      `;

      const result = transform(code);

      // Fragment with component child must produce insert
      expect(result.code).toContain("insert");
      expect(result.code).toContain("Counter");
      expect(result.code).toContain("initialCount");
    });
  });

  describe("Attribute name edge cases", () => {
    it("should use string literal key for hyphenated attribute names", () => {
      const code = `
        const element = <div data-foo="bar" aria-label="test">Content</div>;
      `;

      const result = transform(code);

      // Hyphenated attribute names must be quoted in the output object
      expect(result.code).toContain('"data-foo"');
      expect(result.code).toContain('"aria-label"');
      expect(result.code).toContain("bar");
      expect(result.code).toContain("test");
    });

    it("should not wrap static expression attribute (no reactive access) in templateEffect", () => {
      const code = `
        function getClass() { return "foo"; }
        const element = <div class={getClass()}>Content</div>;
      `;

      const result = transform(code);

      // Non-reactive expression attribute should NOT produce templateEffect+setAttr
      expect(result.code).not.toContain("templateEffect");
      expect(result.code).not.toContain("setAttr");
      expect(result.code).toContain("getClass");
    });

    it("should support namespaced attributes like xlink:href", () => {
      const code = `
        const element = <use xlink:href="#icon" />;
      `;

      const result = transform(code);

      expect(result.code).toContain('"xlink:href"');
      expect(result.code).toContain("#icon");
    });
  });

  describe("Expression container edge cases", () => {
    it("should transform logical expression rendering using insert() and templateEffect", () => {
      const code = `
        const visible = signal(true);
        const element = <div>{visible.value && <span>Shown</span>}</div>;
      `;

      const result = transform(code);

      expect(result.code).toContain("insert");
      expect(result.code).toContain("templateEffect");
      expect(result.code).toContain("visible.value");
      expect(result.code).toContain("span");
    });

    it("should transform expressions containing nested JSX via insert()", () => {
      const code = `
        const element = <div>{[<em>A</em>, <strong>B</strong>]}</div>;
      `;

      const result = transform(code);

      expect(result.code).toContain("insert");
      expect(result.code).toContain("em");
      expect(result.code).toContain("strong");
    });

    it("should transform JSXSpreadChild as insert dynamic part", () => {
      const code = `
        const items = [<li>A</li>, <li>B</li>];
        const element = <ul>{...items}</ul>;
      `;

      const result = transform(code);

      expect(result.code).toContain("insert");
      expect(result.code).toContain("items");
    });

    it("should transform logical expression JSX branches with renderToString in SSR mode", () => {
      const code = `
        const visible = true;
        const element = <div>{visible && <span>SSR</span>}</div>;
      `;

      const result = transform(code, { mode: "ssr" });

      expect(result.code).not.toContain("fromTree");
      expect(result.code).toContain("renderToString");
    });
  });

  describe("SSR mode conditional rendering", () => {
    it("should transform conditional JSX branches with renderToString in SSR mode (not fromTree)", () => {
      const code = `
        const flag = true;
        const element = <div>{flag ? <span>Yes</span> : <span>No</span>}</div>;
      `;

      const result = transform(code, { mode: "ssr" });

      // SSR mode: no DOM-dependent fromTree must appear
      expect(result.code).not.toContain("fromTree");
      // Both branches must be wrapped in renderToString (SSR)
      expect(result.code).toContain("renderToString");
    });

    it("should not use setText/templateEffect for SSR conditional branches", () => {
      const code = `
        const flag = true;
        const element = <div>{flag ? <em>A</em> : <strong>B</strong>}</div>;
      `;

      const result = transform(code, { mode: "ssr" });

      // SSR mode: no DOM mutation helpers
      expect(result.code).not.toContain("fromTree");
      expect(result.code).not.toContain("firstChild");
      expect(result.code).not.toContain("nextSibling");
      expect(result.code).not.toContain("setText");
    });

    it("should transform .map() JSX branches with renderToString in SSR mode", () => {
      const code = `
        const items = ["a", "b"];
        const element = <ul>{items.map(i => <li>{i}</li>)}</ul>;
      `;

      const result = transform(code, { mode: "ssr" });

      // SSR mode: no DOM-dependent fromTree must appear
      expect(result.code).not.toContain("fromTree");
      expect(result.code).toContain("renderToString");
    });
  });
});
