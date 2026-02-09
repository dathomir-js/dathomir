/**
 * Tests for SSR markers.
 */

import { describe, expect, it } from "vitest";

import {
  MarkerType,
  createBlockEndMarker,
  createDataMarker,
  createMarker,
  createStateScript,
} from "@/ssr/markers/implementation";

describe("Marker Creation", () => {
  describe("createMarker", () => {
    it("creates text marker with numeric id", () => {
      expect(createMarker(MarkerType.Text, 1)).toBe("<!--dh:t:1-->");
    });

    it("creates text marker with string id", () => {
      expect(createMarker(MarkerType.Text, "abc")).toBe("<!--dh:t:abc-->");
    });

    it("creates insert marker", () => {
      expect(createMarker(MarkerType.Insert, 42)).toBe("<!--dh:i:42-->");
    });

    it("creates block marker", () => {
      expect(createMarker(MarkerType.Block, 99)).toBe("<!--dh:b:99-->");
    });
  });

  describe("createBlockEndMarker", () => {
    it("creates block end marker", () => {
      expect(createBlockEndMarker()).toBe("<!--/dh:b-->");
    });
  });

  describe("createDataMarker", () => {
    it("creates data attribute with numeric id", () => {
      expect(createDataMarker(1)).toBe('data-dh="1"');
    });

    it("creates data attribute with string id", () => {
      expect(createDataMarker("test")).toBe('data-dh="test"');
    });
  });

  describe("createStateScript", () => {
    it("creates state script element", () => {
      const script = createStateScript('{"count":5}');
      expect(script).toBe(
        '<script type="application/json" data-dh-state>{"count":5}</script>',
      );
    });

    it("handles empty state", () => {
      const script = createStateScript("{}");
      expect(script).toBe(
        '<script type="application/json" data-dh-state>{}</script>',
      );
    });
  });
});
