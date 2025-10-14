import { describe, expect, it } from "vitest";
import { transform } from "../src";

describe("traverseToReactive", () => {
  it("wraps all JSX expressions with computed calls", () => {
    const source = `
			import { signal, computed } from "@ailuros/core/reactivity";

			const count = signal(0);
			const staticText = "hello";

			const Component = () => (
				<div>
					{count.value}
					{staticText}
				</div>
			);
		`;

    const output = transform(source);

    expect(output.code).toContain(
      'import { signal, computed } from "@ailuros/core/reactivity";'
    );
    expect(output.code).toContain("computed(() => count.value)");
    expect(output.code).toContain("computed(() => staticText)");
    expect(output.code.match(/computed\(\(\) => count\.value\)/g)?.length).toBe(
      1
    );
    expect(output.code.match(/computed\(\(\) => staticText\)/g)?.length).toBe(
      1
    );
  });

  it("adds computed import and wraps all attribute expressions", () => {
    const source = `
			import { signal } from "@ailuros/core/reactivity";

			const count = signal(0);
			const label = "Increment";

			const Component = () => (
				<button disabled={count.value === 0}>{label}</button>
			);
		`;

    const output = transform(source);

    expect(output.code).toContain(
      'import { signal, computed } from "@ailuros/core/reactivity";'
    );
    expect(output.code).toContain(
      "disabled={computed(() => count.value === 0)}"
    );
    expect(output.code).toContain("computed(() => label)");
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

  it("wraps all expressions including props and signals in JSX with computed", () => {
    const source = `
			import { signal, computed } from "@ailuros/core/reactivity";

			const render = (props) => {
				const count = signal(0);
				const staticText = "Count: ";
				
				return (
					<div>
						<div>{staticText}{count.value}</div>
						<div>Prop value: {props.value}</div>
					</div>
				);
			};
		`;

    const output = transform(source);

    expect(output.code).toContain(
      'import { signal, computed } from "@ailuros/core/reactivity";'
    );
    expect(output.code).toContain("computed(() => staticText)");
    expect(output.code).toContain("computed(() => count.value)");
    expect(output.code).toContain("computed(() => props.value)");
  });

  it("wraps all expressions including nested property access with computed", () => {
    const source = `
			import { signal } from "@ailuros/core/reactivity";

			const Component = ({ props }) => {
				const prefix = "Title: ";
				return (
					<div>
						<span>{prefix}</span>
						<span>{props.title}</span>
						<span>{props.nested.value}</span>
					</div>
				);
			};
		`;

    const output = transform(source);

    expect(output.code).toContain(
      'import { signal, computed } from "@ailuros/core/reactivity";'
    );
    expect(output.code).toContain("computed(() => prefix)");
    expect(output.code).toContain("computed(() => props.title)");
    expect(output.code).toContain("computed(() => props.nested.value)");
  });

  it("wraps all expressions including destructured parameters with computed", () => {
    const source = `
			import { signal } from "@ailuros/core/reactivity";

			const Component = ({ value, title }) => {
				const separator = " - ";
				return (
					<div>
						<span>{title}</span>
						<span>{separator}</span>
						<span>{value}</span>
					</div>
				);
			};
		`;

    const output = transform(source);

    expect(output.code).toContain(
      'import { signal, computed } from "@ailuros/core/reactivity";'
    );
    expect(output.code).toContain("computed(() => title)");
    expect(output.code).toContain("computed(() => separator)");
    expect(output.code).toContain("computed(() => value)");
  });
});
