/**
 * Benchmarks for fromTree DOM generation.
 */
import { bench, describe } from "vitest";

import { fromTree } from "@/dom/fromTree/implementation";
import type { Tree } from "@/types/tree";
import { Namespace } from "@/types/tree";

// --- Tree definitions ---

/** Small tree: a single button element. */
const smallTree: readonly Tree[] = [
  ["button", { class: "btn", type: "button" }, "Click me"],
];

/** Medium tree: a table with 10 rows and 5 columns. */
function buildTableTree(): readonly Tree[] {
  const rows: Tree[] = [];
  for (let r = 0; r < 10; r++) {
    const cells: Tree[] = [];
    for (let c = 0; c < 5; c++) {
      cells.push(["td", null, `Cell ${r}-${c}`]);
    }
    rows.push(["tr", null, ...cells]);
  }
  return [["table", { class: "data-table" }, ["tbody", null, ...rows]]];
}
const mediumTree: readonly Tree[] = buildTableTree();

/** Large tree: a list with 100 items. */
function buildListTree(): readonly Tree[] {
  const items: Tree[] = [];
  for (let i = 0; i < 100; i++) {
    items.push(["li", { class: "item" }, `Item ${i}`]);
  }
  return [["ul", { class: "large-list" }, ...items]];
}
const largeTree: readonly Tree[] = buildListTree();

// --- Benchmarks ---

describe("fromTree - DOM generation", () => {
  bench("small tree (single button)", () => {
    const factory = fromTree(smallTree, Namespace.HTML);
    factory();
  });

  bench("medium tree (table 10x5)", () => {
    const factory = fromTree(mediumTree, Namespace.HTML);
    factory();
  });

  bench("large tree (list 100 items)", () => {
    const factory = fromTree(largeTree, Namespace.HTML);
    factory();
  });
});

describe("fromTree - cached template clone", () => {
  // Pre-warm caches
  const cachedSmallFactory = fromTree(smallTree, Namespace.HTML);
  const cachedMediumFactory = fromTree(mediumTree, Namespace.HTML);
  const cachedLargeFactory = fromTree(largeTree, Namespace.HTML);

  bench("clone small (cached)", () => {
    cachedSmallFactory();
  });

  bench("clone medium (cached)", () => {
    cachedMediumFactory();
  });

  bench("clone large (cached)", () => {
    cachedLargeFactory();
  });
});
