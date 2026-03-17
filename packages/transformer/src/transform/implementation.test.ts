import { describe, expect, it } from "vitest";
import { COLOCATED_CLIENT_STRATEGIES } from "@dathomir/shared";
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

    it("should normalize client:visible directive into island metadata", () => {
      const code = `
        const element = <Counter client:visible initialCount={5} />;
      `;

      const result = transform(code, { mode: "csr" });

      expect(result.code).toContain('"data-dh-island": "visible"');
      expect(result.code).not.toContain("client:visible");
    });

    it("should preserve client:interaction values as island metadata", () => {
      const code = `
        const element = <Counter client:interaction="mouseenter" />;
      `;

      const result = transform(code, { mode: "ssr" });

      expect(result.code).toContain('"data-dh-island": "interaction"');
      expect(result.code).toContain('"data-dh-island-value": "mouseenter"');
    });

    it("should default bare client:interaction to click metadata", () => {
      const code = `
        const element = <Counter client:interaction />;
      `;

      const result = transform(code, { mode: "csr" });

      expect(result.code).toContain('"data-dh-island": "interaction"');
      expect(result.code).toContain('"data-dh-island-value": "click"');
    });

    it("should preserve the canonical host metadata contract keys", () => {
      const code = `
        const element = <Counter client:media="(max-width: 720px)" />;
      `;

      const result = transform(code, { mode: "ssr" });

      expect(result.code).toContain('"data-dh-island"');
      expect(result.code).toContain('"data-dh-island-value"');
      expect(result.code).toContain('"media"');
      expect(result.code).toContain('"(max-width: 720px)"');
    });

    it("should throw when client:media is missing a string literal value", () => {
      const code = `
        const element = <Counter client:media />;
      `;

      expect(() => transform(code)).toThrow(
        "client:media requires a string literal media query",
      );
    });

    it("should throw when valueless directives receive a value", () => {
      const code = `
        const element = <Counter client:visible="later" />;
      `;

      expect(() => transform(code)).toThrow(
        "client:visible does not accept a value",
      );
    });

    it("should throw for client directives on html elements", () => {
      const code = `
        const element = <div client:visible>bad</div>;
      `;

      expect(() => transform(code)).toThrow(
        "client:* directives are only supported on component elements",
      );
    });

    it("should throw for multiple client directives on one component", () => {
      const code = `
        const element = <Counter client:visible client:idle />;
      `;

      expect(() => transform(code)).toThrow(
        "Multiple client:* directives are not allowed",
      );
    });

    it("should throw for unknown client directives", () => {
      const code = `
        const element = <Counter client:visibile />;
      `;

      expect(() => transform(code)).toThrow("Unknown client:* directive");
    });

    it("should throw when client directives collide with reserved island metadata props", () => {
      const code = `
        const element = <Counter client:visible data-dh-island="manual" />;
      `;

      expect(() => transform(code)).toThrow(
        "client:* directives cannot be combined with explicit data-dh-island metadata",
      );
    });

    it("should transform load:onClick on html elements into client target metadata plus click binding", () => {
      const code = `
        const element = <button load:onClick={() => doThing()}>Run</button>;
      `;

      const result = transform(code, { mode: "csr" });

      expect(result.code).toContain('"data-dh-client-target"');
      expect(result.code).toContain('"data-dh-client-strategy"');
      expect(result.code).toContain('"load"');
      expect(result.code).toContain("event");
      expect(result.code).toContain('"click"');
    });

    it("should transform interaction:onClick on html elements into interaction target metadata plus click binding", () => {
      const code = `
        const element = <button interaction:onClick={() => doThing()}>Run</button>;
      `;

      const result = transform(code, { mode: "ssr" });

      expect(result.code).toContain('"data-dh-client-target"');
      expect(result.code).toContain('"data-dh-client-strategy"');
      expect(result.code).toContain('"interaction"');
    });

    it("should transform visible:onClick on html elements into visible target metadata plus click binding", () => {
      const code = `
        const element = <button visible:onClick={() => doThing()}>Run</button>;
      `;

      const result = transform(code, { mode: "csr" });

      expect(result.code).toContain('"data-dh-client-target"');
      expect(result.code).toContain('"data-dh-client-strategy"');
      expect(result.code).toContain('"visible"');
      expect(result.code).toContain('"click"');
      expect(result.code).not.toContain("visible:onClick");
    });

    it("should transform idle:onClick on html elements into idle target metadata plus click binding", () => {
      const code = `
        const element = <button idle:onClick={() => doThing()}>Run</button>;
      `;

      const result = transform(code, { mode: "ssr" });

      expect(result.code).toContain('"data-dh-client-target"');
      expect(result.code).toContain('"data-dh-client-strategy"');
      expect(result.code).toContain('"idle"');
      expect(result.code).not.toContain("idle:onClick");
    });

    it("should preserve the canonical colocated metadata contract keys", () => {
      const code = `
        const element = <button idle:onClick={() => doThing()}>Run</button>;
      `;

      const result = transform(code, { mode: "csr" });

      expect(result.code).toContain('"data-dh-client-target"');
      expect(result.code).toContain('"data-dh-client-strategy"');
      expect(result.code).toContain('"idle"');
    });

    it("should support all canonical colocated strategies for onClick", () => {
      for (const strategy of COLOCATED_CLIENT_STRATEGIES) {
        const code = `
          const element = <button ${strategy}:onClick={() => doThing()}>Run</button>;
        `;

        const result = transform(code, { mode: "csr" });

        expect(result.code).toContain('"data-dh-client-target"');
        expect(result.code).toContain('"data-dh-client-strategy"');
        expect(result.code).toContain(`"${strategy}"`);
        expect(result.code).toContain('"click"');
      }
    });

    it("should throw when load:onClick and interaction:onClick are mixed in one jsx root", () => {
      const code = `
        const element = (
          <div>
            <button load:onClick={() => a()} />
            <button interaction:onClick={() => b()} />
          </div>
        );
      `;

      expect(() => transform(code)).toThrow(
        "Mixed colocated client strategies are not supported in one JSX root",
      );
    });

    it("should throw when visible:onClick and idle:onClick are mixed in one jsx root", () => {
      const code = `
        const element = (
          <div>
            <button visible:onClick={() => a()} />
            <button idle:onClick={() => b()} />
          </div>
        );
      `;

      expect(() => transform(code)).toThrow(
        "Mixed colocated client strategies are not supported in one JSX root",
      );
    });

    it("should throw when visible:onClick and load:onClick are mixed in one jsx root", () => {
      const code = `
        const element = (
          <div>
            <button visible:onClick={() => a()} />
            <button load:onClick={() => b()} />
          </div>
        );
      `;

      expect(() => transform(code)).toThrow(
        "Mixed colocated client strategies are not supported in one JSX root",
      );
    });

    it("should throw when idle:onClick and interaction:onClick are mixed in one jsx root", () => {
      const code = `
        const element = (
          <div>
            <button idle:onClick={() => a()} />
            <button interaction:onClick={() => b()} />
          </div>
        );
      `;

      expect(() => transform(code)).toThrow(
        "Mixed colocated client strategies are not supported in one JSX root",
      );
    });

    it("should throw when host level client directives mix with colocated client directives in one component render subtree", () => {
      const clientDirectiveCode = `
        const element = (
          <Panel client:load>
            <button visible:onClick={() => doThing()}>Run</button>
          </Panel>
        );
      `;
      const explicitMetadataCode = `
        const element = (
          <Panel data-dh-island="load">
            <button idle:onClick={() => doThing()}>Run</button>
          </Panel>
        );
      `;

      expect(() => transform(clientDirectiveCode)).toThrow(
        "host-level client:* directives or data-dh-island metadata cannot be combined with colocated client directives in the same component render subtree",
      );
      expect(() => transform(explicitMetadataCode)).toThrow(
        "host-level client:* directives or data-dh-island metadata cannot be combined with colocated client directives in the same component render subtree",
      );
    });

    it("should throw when author supplies compiler reserved client metadata", () => {
      const targetCode = `
        const element = <button data-dh-client-target="author" load:onClick={() => doThing()}>Run</button>;
      `;
      const strategyCode = `
        const element = <button data-dh-client-strategy="idle" idle:onClick={() => doThing()}>Run</button>;
      `;

      expect(() => transform(targetCode)).toThrow(
        "data-dh-client-target is compiler-reserved metadata and cannot be authored directly",
      );
      expect(() => transform(strategyCode)).toThrow(
        "data-dh-client-strategy is compiler-reserved metadata and cannot be authored directly",
      );
    });

    it("should throw when colocated directives are used on svg elements", () => {
      const code = `
        const element = <svg visible:onClick={() => doThing()}><circle /></svg>;
      `;

      expect(() => transform(code)).toThrow(
        "visible:onClick is only supported on HTML elements",
      );
    });

    it("should throw for unsupported colocated directives on html elements", () => {
      const code = `
        const element = <button load:onMouseEnter={() => doThing()}>Run</button>;
      `;

      expect(() => transform(code)).toThrow(
        "Unsupported colocated client directive: load:onMouseEnter",
      );
    });

    it("should throw for unsupported visible and idle colocated directives on html elements", () => {
      const visibleCode = `
        const element = <button visible:onMouseEnter={() => doThing()}>Run</button>;
      `;
      const idleCode = `
        const element = <button idle:onFocus={() => doThing()}>Run</button>;
      `;

      expect(() => transform(visibleCode)).toThrow(
        "Unsupported colocated client directive: visible:onMouseEnter",
      );
      expect(() => transform(idleCode)).toThrow(
        "Unsupported colocated client directive: idle:onFocus",
      );
    });

    it("should throw when colocated directives are used on component elements", () => {
      const code = `
        const element = <Counter load:onClick={() => doThing()} />;
      `;

      expect(() => transform(code)).toThrow(
        "Unsupported colocated client directive: load:onClick",
      );
    });

    it("should throw when mixed colocated strategies appear across nested jsx transforms", () => {
      const code = `
        const element = (
          <div>
            <button load:onClick={() => a()} />
            {condition ? <button interaction:onClick={() => b()} /> : null}
          </div>
        );
      `;

      expect(() => transform(code)).toThrow(
        "Mixed colocated client strategies are not supported in one JSX root",
      );
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

      // Non-reactive expression attribute should avoid templateEffect and use one-time setAttr
      expect(result.code).not.toContain("templateEffect");
      expect(result.code).toContain("setAttr");
      expect(result.code).toContain("getClass");
    });

    it("should preserve local identifiers used by static expression attributes", () => {
      const code = `
        function App() {
          const modeLabel = typeof document === "undefined" ? "SSR" : "CSR";
          return <p data-render-mode={modeLabel}>Current render mode</p>;
        }
      `;

      const result = transform(code);

      expect(result.code).toContain("setAttr");
      expect(result.code).toContain("modeLabel");
      expect(result.code).not.toContain('{ ["data-render-mode"]: modeLabel }');
      expect(result.code).not.toContain("templateEffect");
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
