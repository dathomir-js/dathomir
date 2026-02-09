/**
 * Benchmarks for list reconciliation.
 */
import { bench, describe } from "vitest";

import { reconcile } from "@/reconcile/implementation";

/** Create a list item DOM node. */
function createItem(item: { id: number; label: string }): Node {
  const li = document.createElement("li");
  li.textContent = item.label;
  li.setAttribute("data-id", String(item.id));
  return li;
}

/** Update an existing list item node. */
function updateItem(node: Node, item: { id: number; label: string }): void {
  (node as HTMLElement).textContent = item.label;
}

/** Key extractor for keyed reconciliation. */
function keyFn(item: { id: number; label: string }): number {
  return item.id;
}

/** Generate N items starting from a given id. */
function generateItems(
  count: number,
  startId = 0,
): { id: number; label: string }[] {
  const items: { id: number; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    items.push({ id: startId + i, label: `Item ${startId + i}` });
  }
  return items;
}

/** Shuffle an array using Fisher-Yates algorithm (returns new array). */
function shuffle<T>(arr: readonly T[]): T[] {
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}

// --- Pre-computed data ---

const base100 = generateItems(100);
const appendOne = [...base100, { id: 100, label: "Item 100" }];
const prependOne = [{ id: -1, label: "Item -1" }, ...base100];
const removeMiddle = base100.filter((_, i) => i !== 50);
const replaced100 = generateItems(100, 1000);
const shuffled100 = shuffle(base100);
const base1000 = generateItems(1000);
const partialUpdate1000 = base1000.map((item, i) =>
  i % 100 === 0 ? { id: item.id, label: `Updated ${item.id}` } : item,
);

// --- Benchmarks ---

describe("reconcile - keyed list operations", () => {
  bench("append 1 item to 100", () => {
    const parent = document.createElement("ul");
    reconcile(parent, base100, keyFn, createItem, updateItem);
    reconcile(parent, appendOne, keyFn, createItem, updateItem);
  });

  bench("prepend 1 item to 100", () => {
    const parent = document.createElement("ul");
    reconcile(parent, base100, keyFn, createItem, updateItem);
    reconcile(parent, prependOne, keyFn, createItem, updateItem);
  });

  bench("remove 1 item from middle of 100", () => {
    const parent = document.createElement("ul");
    reconcile(parent, base100, keyFn, createItem, updateItem);
    reconcile(parent, removeMiddle, keyFn, createItem, updateItem);
  });

  bench("replace all 100 items", () => {
    const parent = document.createElement("ul");
    reconcile(parent, base100, keyFn, createItem, updateItem);
    reconcile(parent, replaced100, keyFn, createItem, updateItem);
  });

  bench("shuffle 100 items", () => {
    const parent = document.createElement("ul");
    reconcile(parent, base100, keyFn, createItem, updateItem);
    reconcile(parent, shuffled100, keyFn, createItem, updateItem);
  });

  bench("partial update 1000 items (10 changed)", () => {
    const parent = document.createElement("ul");
    reconcile(parent, base1000, keyFn, createItem, updateItem);
    reconcile(parent, partialUpdate1000, keyFn, createItem, updateItem);
  });
});

describe("reconcile - unkeyed list operations", () => {
  bench("append 1 item to 100 (unkeyed)", () => {
    const parent = document.createElement("ul");
    reconcile(parent, base100, undefined, createItem, updateItem);
    reconcile(parent, appendOne, undefined, createItem, updateItem);
  });

  bench("replace all 100 items (unkeyed)", () => {
    const parent = document.createElement("ul");
    reconcile(parent, base100, undefined, createItem, updateItem);
    reconcile(parent, replaced100, undefined, createItem, updateItem);
  });
});
