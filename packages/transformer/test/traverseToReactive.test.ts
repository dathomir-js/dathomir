import { describe, expect, it } from "vitest";
import { transform } from "../src";

describe("traverseToReactive", () => {
  it("wraps signal references inside JSX expressions with computed calls", () => {
    const source = `
			import { signal, computed } from "@ailuros/reactivity";

			const count = signal(0);

			const Component = () => (
				<div>
					{count.value}
				</div>
			);
		`;

    const output = transform(source);

    expect(output.code).toContain(
      'import { signal, computed } from "@ailuros/reactivity";'
    );
    expect(output.code).toContain("computed(() => count.value)");
    expect(output.code.match(/computed\(\(\) => count\.value\)/g)?.length).toBe(
      1
    );
  });

  it("adds computed import when only signal is present and wraps attribute expressions", () => {
    const source = `
			import { signal } from "@ailuros/reactivity";

			const count = signal(0);

			const Component = () => (
				<button disabled={count.value === 0}>Increment</button>
			);
		`;

    const output = transform(source);

    expect(output.code).toContain(
      'import { signal, computed } from "@ailuros/reactivity";'
    );
    expect(output.code).toContain(
      "disabled={computed(() => count.value === 0)}"
    );
  });

  it("reuses namespace imports for computed and avoids double wrapping", () => {
    const source = `
			import * as reactivity from "@ailuros/reactivity";

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
      'import * as reactivity from "@ailuros/reactivity";'
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
});
