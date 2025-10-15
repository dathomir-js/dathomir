import { describe, expect, it } from "vitest";
import { transform } from "../src";

describe("traverseToReactive", () => {
  it("wraps signal references inside JSX expressions with computed calls", () => {
    const source = `
			import { signal, computed } from "@ailuros/core/reactivity";

			const count = signal(0);

			const Component = () => (
				<div>
					{count.value}
				</div>
			);
		`;

    const output = transform(source);

    expect(output.code).toContain(
      'import { signal, computed } from "@ailuros/core/reactivity";'
    );
    expect(output.code).toContain("computed(() => count.value)");
    expect(output.code.match(/computed\(\(\) => count\.value\)/g)?.length).toBe(
      1
    );
  });

  it("adds computed import when only signal is present and wraps attribute expressions", () => {
    const source = `
			import { signal } from "@ailuros/core/reactivity";

			const count = signal(0);

			const Component = () => (
				<button disabled={count.value === 0}>Increment</button>
			);
		`;

    const output = transform(source);

    expect(output.code).toContain(
      'import { signal, computed } from "@ailuros/core/reactivity";'
    );
    expect(output.code).toContain(
      "disabled={computed(() => count.value === 0)}"
    );
  });

  it("reuses namespace imports for computed and avoids double wrapping", () => {
    const source = `
			import * as reactivity from "@ailuros/core/reactivity";

			const count = reactivity.signal(0);
			const handleClick = reactivity.computed(() => count.set((value) => value + 1));
			const isOdd = reactivity.computed(() => count.value % 2 === 1);

			const Component = () => (
				<div>
					<button onClick={handleClick}>Inc</button>
					{isOdd.value ? <span>Odd</span> : <span>Even</span>}
					{reactivity.computed(() => count.value)}
				</div>
			);
		`;

    const output = transform(source);

    expect(output.code).toContain(
      'import * as reactivity from "@ailuros/core/reactivity";'
    );
    expect(output.code).toContain(
      "onClick={reactivity.computed(() => handleClick)}"
    );
    expect(output.code).toContain(
      "{reactivity.computed(() => isOdd.value ? <span>Odd</span> : <span>Even</span>)}"
    );
    expect(
      output.code.includes(
        "reactivity.computed(() => reactivity.computed(() =>"
      )
    ).toBe(false);
  });

  it("not depends with signal", () => {
    const source = `
			import * as reactivity from "@ailuros/core/reactivity";

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

			const Component = () => (
				<div>
					<button onClick={handleClick}>Inc</button>
					{isOdd.value ? <span>Odd</span> : <span>Even</span>}
					{reactivity.computed(() => count.value)}
          {double.value}
          {constantText}
          {constantNumber}
          {objSignal.fullName.value}
				</div>
			);
		`;

    const output = transform(source);

    expect(output.code).toContain(
      'import * as reactivity from "@ailuros/core/reactivity";'
    );
    expect(output.code).toContain(
      "onClick={reactivity.computed(() => handleClick)}"
    );
    expect(output.code).toContain(
      "{reactivity.computed(() => isOdd.value ? <span>Odd</span> : <span>Even</span>)}"
    );
    expect(
      output.code.includes(
        "reactivity.computed(() => reactivity.computed(() =>"
      )
    ).toBe(false);
    expect(output.code).toContain("{reactivity.computed(() => double.value)}");
    expect(output.code).toContain("{reactivity.computed(() => constantText)}");
    expect(output.code).toContain(
      "{reactivity.computed(() => constantNumber)}"
    );
    expect(output.code).toContain(
      "{reactivity.computed(() => objSignal.fullName.value)}"
    );
  });

  // === Additional coverage merged ===
  it("adds computed import with renamed local when 'computed' identifier already exists", () => {
    const source = `
			import { signal } from "@ailuros/core/reactivity";
			const computed = "shadow";
			const count = signal(0);
			const C = () => (<div>{count.value}</div>);
		`;
    const out = transform(source).code;
    expect(out).toMatch(/import { signal, computed as _computed\b/);
    expect(out).toContain("_computed(() => count.value)");
  });

  it("uses namespace import member when already imported as namespace", () => {
    const source = `
			import * as reactivity from "@ailuros/core/reactivity";
			const count = reactivity.signal(0);
			const C = () => (<div>{count.value}</div>);
		`;
    const out = transform(source).code;
    expect(out).toContain("{reactivity.computed(() => count.value)}");
    expect(out).not.toMatch(/computed as _computed/);
  });

  it("uses default import member when default import exists and no namespace", () => {
    const source = `
			import reactivity from "@ailuros/core/reactivity";
			const count = reactivity.signal(0);
			const C = () => (<div>{count.value}</div>);
		`;
    const out = transform(source).code;
    expect(out).toContain("{reactivity.computed(() => count.value)}");
    expect(out).not.toMatch(/computed as _computed/);
    expect(out).not.toMatch(/import { computed /);
  });

  it("does not double wrap when direct imported computed call already present", () => {
    const source = `
			import { computed } from "@ailuros/core/reactivity";
			const C = () => (<div>{computed(() => 1)}</div>);
		`;
    const out = transform(source).code;
    const matches = out.match(/computed\(\(\) => 1\)/g) || [];
    expect(matches.length).toBe(1);
  });

  it("does not double wrap when namespace/default member computed call already present", () => {
    const sourceNs = `
			import * as reactivity from "@ailuros/core/reactivity";
			const C = () => (<div>{reactivity.computed(() => 1)}</div>);
		`;
    const outNs = transform(sourceNs).code;
    expect(outNs.match(/reactivity\.computed\(\(\) => 1\)/g)?.length).toBe(1);

    const sourceDef = `
			import reactivity from "@ailuros/core/reactivity";
			const C = () => (<div>{reactivity.computed(() => 1)}</div>);
		`;
    const outDef = transform(sourceDef).code;
    expect(outDef.match(/reactivity\.computed\(\(\) => 1\)/g)?.length).toBe(1);
  });
});
