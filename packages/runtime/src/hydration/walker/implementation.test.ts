/**
 * Tests for Hydration walker utilities.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createWalker,
  findMarker,
  findMarkers,
  getTextNodeAfterMarker,
  parseMarker,
} from "@/hydration/walker/implementation";

describe("parseMarker", () => {
  it("parses text marker", () => {
    const comment = document.createComment("dh:t:123");
    const result = parseMarker(comment);

    expect(result).not.toBeNull();
    expect(result?.type).toBe("t");
    expect(result?.id).toBe(123);
  });

  it("parses insert marker", () => {
    const comment = document.createComment("dh:i:42");
    const result = parseMarker(comment);

    expect(result).not.toBeNull();
    expect(result?.type).toBe("i");
    expect(result?.id).toBe(42);
  });

  it("parses block marker", () => {
    const comment = document.createComment("dh:b:1");
    const result = parseMarker(comment);

    expect(result).not.toBeNull();
    expect(result?.type).toBe("b");
    expect(result?.id).toBe(1);
  });

  it("parses block end marker", () => {
    const comment = document.createComment("/dh:b");
    const result = parseMarker(comment);

    expect(result).not.toBeNull();
    expect(result?.type).toBe("/b");
    expect(result?.id).toBe(-1);
  });

  it("returns null for invalid marker", () => {
    expect(parseMarker(document.createComment("not a marker"))).toBeNull();
    expect(parseMarker(document.createComment("dh:x:123"))).toBeNull();
    expect(parseMarker(document.createComment("dh:t:abc"))).toBeNull();
  });

  it("returns null for empty comment", () => {
    expect(parseMarker(document.createComment(""))).toBeNull();
  });

  it("returns null for partial marker", () => {
    expect(parseMarker(document.createComment("dh:"))).toBeNull();
    expect(parseMarker(document.createComment("dh:t"))).toBeNull();
  });
});

describe("createWalker", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("creates a TreeWalker for comment nodes", () => {
    container.innerHTML = "<!--comment--><div>text</div>";
    const walker = createWalker(container);

    expect(walker).toBeInstanceOf(TreeWalker);
    const node = walker.nextNode();
    expect(node?.nodeType).toBe(Node.COMMENT_NODE);
  });
});

describe("findMarkers", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("finds all markers in container", () => {
    container.innerHTML =
      "<!--dh:t:0-->text<!--dh:t:1-->more<!--dh:i:0--><!--/dh:b-->";
    const markers = findMarkers(container);

    expect(markers.length).toBe(4);
    expect(markers[0].type).toBe("t");
    expect(markers[0].id).toBe(0);
    expect(markers[1].type).toBe("t");
    expect(markers[1].id).toBe(1);
    expect(markers[2].type).toBe("i");
    expect(markers[2].id).toBe(0);
    expect(markers[3].type).toBe("/b");
  });

  it("returns empty array when no markers found", () => {
    container.innerHTML = "<div>no markers</div><!--not a marker-->";
    const markers = findMarkers(container);

    expect(markers).toEqual([]);
  });
});

describe("findMarker", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("finds next marker in walker", () => {
    container.innerHTML = "<!--dh:t:0-->text";
    const walker = createWalker(container);
    const marker = findMarker(walker);

    expect(marker).not.toBeNull();
    expect(marker?.type).toBe("t");
    expect(marker?.id).toBe(0);
  });

  it("returns null when no more markers", () => {
    container.innerHTML = "<div>no markers</div>";
    const walker = createWalker(container);
    const marker = findMarker(walker);

    expect(marker).toBeNull();
  });

  it("skips non-marker comments", () => {
    container.innerHTML = "<!--not a marker--><!--dh:t:5-->text";
    const walker = createWalker(container);
    const marker = findMarker(walker);

    expect(marker).not.toBeNull();
    expect(marker?.type).toBe("t");
    expect(marker?.id).toBe(5);
  });
});

describe("getTextNodeAfterMarker", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("returns existing text node after marker", () => {
    container.innerHTML = "<!--dh:t:0-->Hello";
    const marker = container.firstChild as Comment;
    const textNode = getTextNodeAfterMarker(marker);

    expect(textNode).not.toBeNull();
    expect(textNode?.nodeType).toBe(Node.TEXT_NODE);
    expect(textNode?.textContent).toBe("Hello");
  });

  it("creates text node when no text follows", () => {
    container.innerHTML = "<!--dh:t:0--><span>Element</span>";
    const marker = container.firstChild as Comment;
    const textNode = getTextNodeAfterMarker(marker);

    // Creates empty text node
    expect(textNode).not.toBeNull();
    expect(textNode?.nodeType).toBe(Node.TEXT_NODE);
    expect(textNode?.textContent).toBe("");
  });

  it("creates text node when comment is last child", () => {
    container.innerHTML = "<!--dh:t:0-->";
    const marker = container.firstChild as Comment;
    const textNode = getTextNodeAfterMarker(marker);

    expect(textNode).not.toBeNull();
    expect(textNode?.textContent).toBe("");
  });
});
