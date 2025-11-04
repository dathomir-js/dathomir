import { describe, expect, it } from "vitest";
import { transform } from "../src";

describe("traverseToReactive", () => {
  it("wraps jsx() props values with computed calls", () => {
    const source = `
			import { signal, computed } from "@dathomir/core/reactivity";

			const count = signal(0);

			const Component = () => jsx("div", { children: count.value });
		`;

    const output = transform(source);

    expect(output.code).toContain(
      'import { signal, computed } from "@dathomir/core/reactivity";'
    );
    expect(output.code).toContain("computed(() => count.value)");
    expect(output.code.match(/computed\(\(\) => count\.value\)/g)?.length).toBe(
      1
    );
  });

  it("adds computed import when only signal is present and wraps prop expressions", () => {
    const source = `
			import { signal } from "@dathomir/core/reactivity";

			const count = signal(0);

			const Component = () => jsx("button", { disabled: count.value === 0, children: "Increment" });
		`;

    const output = transform(source);

    expect(output.code).toContain(
      'import { signal, computed } from "@dathomir/core/reactivity";'
    );
    expect(output.code).toContain(
      "disabled: computed(() => count.value === 0)"
    );
  });

  it("reuses namespace imports for computed and avoids double wrapping", () => {
    const source = `
			import * as reactivity from "@dathomir/core/reactivity";

			const count = reactivity.signal(0);
			const handleClick = reactivity.computed(() => count.set((value) => value + 1));
			const isOdd = reactivity.computed(() => count.value % 2 === 1);

			const Component = () => jsx("div", { children: [
        jsx("button", { onClick: handleClick, children: "Inc" }),
        isOdd.value ? jsx("span", { children: "Odd" }) : jsx("span", { children: "Even" }),
        reactivity.computed(() => count.value)
      ]});
		`;

    const output = transform(source);

    expect(output.code).toContain(
      'import * as reactivity from "@dathomir/core/reactivity";'
    );
    expect(output.code).toContain(
      "onClick: reactivity.computed(() => handleClick)"
    );
    // children配列の各要素が個別にラップされる
    expect(output.code).toContain("children: [");
    expect(output.code).toContain("reactivity.computed(() => jsx(");
    expect(
      output.code.includes(
        "reactivity.computed(() => reactivity.computed(() =>"
      )
    ).toBe(false);
  });

  it("wraps all prop values regardless of signal dependency", () => {
    const source = `
			import * as reactivity from "@dathomir/core/reactivity";

			const count = reactivity.signal(0);
      const double = reactivity.computed(() => count.value * 2);
			const handleClick = reactivity.computed(() => count.set((value) => value + 1));
			const isOdd = reactivity.computed(() => count.value % 2 === 1);
      const constantText = "Hello, World!";
      const constantNumber = 42;
      const objSignal = {
        firstName: reactivity.signal("John"),
        lastName: reactivity.signal("Doe"),
        fullName: reactivity.computed(() => objSignal.firstName.value + " " + objSignal.lastName.value)
      }

			const Component = () => jsx("div", { children: [
        jsx("button", { onClick: handleClick, children: "Inc" }),
        isOdd.value ? jsx("span", { children: "Odd" }) : jsx("span", { children: "Even" }),
        reactivity.computed(() => count.value),
        double.value,
        constantText,
        constantNumber,
        objSignal.fullName.value
      ]});
		`;

    const output = transform(source);

    expect(output.code).toContain(
      'import * as reactivity from "@dathomir/core/reactivity";'
    );
    expect(output.code).toContain(
      "onClick: reactivity.computed(() => handleClick)"
    );
    // children配列の各要素が個別にラップされる
    expect(output.code).toContain("children: [");
    expect(
      output.code.includes(
        "reactivity.computed(() => reactivity.computed(() =>"
      )
    ).toBe(false);
    // 配列内の各要素が個別にラップされる
    expect(output.code).toContain("reactivity.computed(() => jsx(");
    expect(output.code).toContain("reactivity.computed(() => double.value)");
    expect(output.code).toContain("reactivity.computed(() => constantText)");
    expect(output.code).toContain("reactivity.computed(() => constantNumber)");
    expect(output.code).toContain(
      "reactivity.computed(() => objSignal.fullName.value)"
    );
  });

  // === Additional coverage merged ===
  it("adds computed import with renamed local when 'computed' identifier already exists", () => {
    const source = `
			import { signal } from "@dathomir/core/reactivity";
			const computed = "shadow";
			const count = signal(0);
			const C = () => jsx("div", { children: count.value });
		`;
    const out = transform(source).code;
    expect(out).toMatch(/import { signal, computed as _computed\b/);
    expect(out).toContain("_computed(() => count.value)");
  });

  it("uses namespace import member when already imported as namespace", () => {
    const source = `
			import * as reactivity from "@dathomir/core/reactivity";
			const count = reactivity.signal(0);
			const C = () => jsx("div", { children: count.value });
		`;
    const out = transform(source).code;
    expect(out).toContain("reactivity.computed(() => count.value)");
    expect(out).not.toMatch(/computed as _computed/);
  });

  it("uses default import member when default import exists and no namespace", () => {
    const source = `
			import reactivity from "@dathomir/core/reactivity";
			const count = reactivity.signal(0);
			const C = () => jsx("div", { children: count.value });
		`;
    const out = transform(source).code;
    expect(out).toContain("reactivity.computed(() => count.value)");
    expect(out).not.toMatch(/computed as _computed/);
    expect(out).not.toMatch(/import { computed /);
  });

  it("does not double wrap when direct imported computed call already present", () => {
    const source = `
			import { computed } from "@dathomir/core/reactivity";
			const C = () => jsx("div", { children: computed(() => 1) });
		`;
    const out = transform(source).code;
    const matches = out.match(/computed\(\(\) => 1\)/g) || [];
    expect(matches.length).toBe(1);
  });

  it("does not double wrap when namespace/default member computed call already present", () => {
    const sourceNs = `
			import * as reactivity from "@dathomir/core/reactivity";
			const C = () => jsx("div", { children: reactivity.computed(() => 1) });
		`;
    const outNs = transform(sourceNs).code;
    expect(outNs.match(/reactivity\.computed\(\(\) => 1\)/g)?.length).toBe(1);

    const sourceDef = `
			import reactivity from "@dathomir/core/reactivity";
			const C = () => jsx("div", { children: reactivity.computed(() => 1) });
		`;
    const outDef = transform(sourceDef).code;
    expect(outDef.match(/reactivity\.computed\(\(\) => 1\)/g)?.length).toBe(1);
  });

  it("handles jsx() calls with no props argument", () => {
    const source = `
			const C = () => jsx("div");
		`;
    const out = transform(source).code;
    expect(out).toContain('jsx("div")');
  });

  it("handles jsx() calls with null props", () => {
    const source = `
			const C = () => jsx("div", null);
		`;
    const out = transform(source).code;
    expect(out).toContain("jsx(");
  });

  it("handles jsx() calls with non-object props", () => {
    const source = `
			const C = () => jsx("div", someVariable);
		`;
    const out = transform(source).code;
    expect(out).toContain("jsx(");
  });

  it("skips computed properties in props object", () => {
    const source = `
			const key = "dynamic";
			const C = () => jsx("div", { [key]: "value" });
		`;
    const out = transform(source).code;
    // computed properties should not be wrapped
    expect(out).toContain("[key]");
  });

  it("skips non-expression values in props", () => {
    const source = `
			const C = () => jsx("div", { ...spread });
		`;
    const out = transform(source).code;
    expect(out).toContain("...spread");
  });

  it("handles non-jsx function calls without modification", () => {
    const source = `
			import { signal } from "@dathomir/core/reactivity";
			const count = signal(0);
			const notJsx = someFunction("div", { value: count.value });
		`;
    const out = transform(source).code;
    // Non-jsx function calls should not be wrapped
    expect(out).toContain("someFunction");
    expect(out).toContain("count.value");
    // Should not add computed wrapper for non-jsx calls
    expect(out.match(/computed/g)?.length || 0).toBe(0);
  });

  it("handles jsxDEV() calls (development mode)", () => {
    const source = `
			import { signal } from "@dathomir/core/reactivity";
			const count = signal(0);
			const C = () => jsxDEV("div", { children: count.value }, "key");
		`;
    const out = transform(source).code;
    expect(out).toContain("jsxDEV");
    expect(out).toContain("computed(() => count.value)");
  });

  it("handles imported computed with string literal (not identifier)", () => {
    const source = `
			import { "computed" as myComputed } from "@dathomir/core/reactivity";
			const C = () => jsx("div", { children: myComputed(() => 1) });
		`;
    const out = transform(source).code;
    expect(out.match(/myComputed\(\(\) => 1\)/g)?.length).toBe(1);
  });

  it("creates import when no reactivity import exists", () => {
    const source = `
			const C = () => jsx("div", { children: "hello" });
		`;
    const out = transform(source).code;
    expect(out).toContain(
      'import { computed } from "@dathomir/core/reactivity"'
    );
    expect(out).toContain("computed(() => ");
  });

  it("handles multiple jsx() calls in the same file", () => {
    const source = `
			import { signal } from "@dathomir/core/reactivity";
			const count = signal(0);
			const A = () => jsx("div", { children: count.value });
			const B = () => jsx("span", { children: count.value });
		`;
    const out = transform(source).code;
    const matches = out.match(/computed\(\(\) => count\.value\)/g);
    expect(matches?.length).toBe(2);
  });

  it("preserves other imports from different modules", () => {
    const source = `
			import React from "react";
			import { signal } from "@dathomir/core/reactivity";
			const count = signal(0);
			const C = () => jsx("div", { children: count.value });
		`;
    const out = transform(source).code;
    expect(out).toContain('import React from "react"');
    expect(out).toContain('from "@dathomir/core/reactivity"');
  });

  it("handles complex nested object expressions", () => {
    const source = `
			import { signal } from "@dathomir/core/reactivity";
			const user = { name: signal("John") };
			const C = () => jsx("div", { title: user.name.value, children: "Hello" });
		`;
    const out = transform(source).code;
    expect(out).toContain("computed(() => user.name.value)");
    expect(out).toContain('computed(() => "Hello")');
  });

  it("handles props with method shorthand should be wrapped", () => {
    const source = `
			import { signal } from "@dathomir/core/reactivity";
			const handler = signal(() => {});
			const C = () => jsx("div", { onClick: handler.value });
		`;
    const out = transform(source).code;
    expect(out).toContain("computed(() => handler.value)");
  });

  it("handles empty props object", () => {
    const source = `
			const C = () => jsx("div", {});
		`;
    const out = transform(source).code;
    expect(out).toContain("jsx(");
  });

  it("adds computed to existing reactivity import without computed", () => {
    const source = `
			import { signal, effect } from "@dathomir/core/reactivity";
			const count = signal(0);
			const C = () => jsx("div", { children: count.value });
		`;
    const out = transform(source).code;
    // Should add computed to the existing import
    expect(out).toContain(
      'import { signal, effect, computed } from "@dathomir/core/reactivity"'
    );
    expect(out).toContain("computed(() => count.value)");
  });

  it("does not add duplicate computed import when already present in existing import", () => {
    const source = `
			import { signal, computed } from "@dathomir/core/reactivity";
			const count = signal(0);
			const C = () => jsx("div", { children: count.value });
		`;
    const out = transform(source).code;
    // Should not duplicate computed in import
    const importMatches = out.match(
      /import.*computed.*from "@dathomir\/core\/reactivity"/g
    );
    expect(importMatches?.length).toBe(1);
    expect(out).toContain("computed(() => count.value)");
  });

  it("handles binding that is not an import specifier", () => {
    const source = `
			import { signal } from "@dathomir/core/reactivity";
			const count = signal(0);
			function computed() { return "not reactivity computed"; }
			const C = () => jsx("div", { children: count.value });
		`;
    const out = transform(source).code;
    // Should create a renamed computed import
    expect(out).toMatch(/computed as _computed/);
    expect(out).toContain("_computed(() => count.value)");
  });

  it("handles CallExpression value that is not a computed call", () => {
    const source = `
			import { signal } from "@dathomir/core/reactivity";
			const count = signal(0);
			const C = () => jsx("div", { children: someFunction() });
		`;
    const out = transform(source).code;
    // someFunction() should be wrapped with computed
    expect(out).toContain("computed(() => someFunction())");
  });

  it("verifies isComputedCallExpression returns false for non-call expressions", () => {
    const source = `
			import { signal } from "@dathomir/core/reactivity";
			const count = signal(0);
			const value = count.value;
			const C = () => jsx("div", { children: value });
		`;
    const out = transform(source).code;
    // value (identifier) should be wrapped with computed
    expect(out).toContain("computed(() => value)");
  });

  it("handles complex import scenario with both namespace and named imports", () => {
    const source = `
			import * as R from "@dathomir/core/reactivity";
			import { signal as sig } from "@dathomir/core/reactivity";
			const count = sig(0);
			const C = () => jsx("div", { children: count.value });
		`;
    const out = transform(source).code;
    // Should use namespace import for computed
    expect(out).toContain("R.computed(() => count.value)");
  });

  it("ensures correct handling when reactivityImportPaths exists but no computed", () => {
    const source = `
			import { signal } from "@dathomir/core/reactivity";
			const count = signal(0);
			// Force a scenario where we add computed to existing import
			const C = () => jsx("button", { onClick: count.value });
		`;
    const out = transform(source).code;
    expect(out).toContain(
      'import { signal, computed } from "@dathomir/core/reactivity"'
    );
    expect(out).toContain("computed(() => count.value)");
  });

  it("handles identifier that references imported computed from different module", () => {
    const source = `
			import { computed } from "some-other-library";
			import { signal } from "@dathomir/core/reactivity";
			const count = signal(0);
			const C = () => jsx("div", { children: computed(() => count.value) });
		`;
    const out = transform(source).code;
    // Should add reactivity computed with renamed identifier
    expect(out).toContain("import { signal, computed as");
    // Original computed from other library should remain
    expect(out).toContain('import { computed } from "some-other-library"');
  });

  it("handles member expression with computed property from non-reactivity namespace", () => {
    const source = `
			import * as other from "other-library";
			import { signal } from "@dathomir/core/reactivity";
			const count = signal(0);
			const C = () => jsx("div", { children: other.computed(() => 1) });
		`;
    const out = transform(source).code;
    // other.computed should be wrapped because it's not from reactivity module
    expect(out).toContain(
      'import { signal, computed } from "@dathomir/core/reactivity"'
    );
    expect(out).toContain("computed(() => other.computed(() => 1))");
  });

  it("validates that computed already exists in specifiers is not added again", () => {
    const source = `
			import { signal, effect, computed } from "@dathomir/core/reactivity";
			const count = signal(0);
			// Even if we try to use default import path, computed already exists
			const C = () => jsx("div", { children: count.value });
		`;
    const out = transform(source).code;
    // Count occurrences of "computed" in the import statement
    const importLine = out.split("\n")[0];
    const computedCount = (importLine.match(/\bcomputed\b/g) || []).length;
    expect(computedCount).toBe(1); // Should appear only once
  });

  it("handles edge case where binding exists but is not from reactivity module", () => {
    const source = `
			import { computed as localComputed } from "other-module";
			import { signal } from "@dathomir/core/reactivity";
			const count = signal(0);
			const C = () => jsx("div", { children: localComputed(() => count.value) });
		`;
    const out = transform(source).code;
    // Should add new computed from reactivity with different name
    expect(out).toContain(
      'import { signal, computed } from "@dathomir/core/reactivity"'
    );
    expect(out).toContain(
      'import { computed as localComputed } from "other-module"'
    );
    // The localComputed call should be wrapped
    expect(out).toContain("computed(() => localComputed(() => count.value))");
  });
});
