import { beforeEach, describe, expect, it } from "vitest";

import {
  clearRegistry,
  getComponent,
  hasComponent,
  registerComponent
} from "./implementation";

describe("registry", () => {
  beforeEach(() => {
    clearRegistry();
  });

  describe("registerComponent", () => {
    it("should register a component", () => {
      const setup = () => document.createTextNode("test");
      const cssTexts = [":host { display: block; }"];
      const propsSchema = { value: { type: String } };

      registerComponent("test-component", setup, cssTexts, propsSchema);

      expect(hasComponent("test-component")).toBe(true);
    });

    it("should overwrite existing registration", () => {
      const setup1 = () => document.createTextNode("first");
      const setup2 = () => document.createTextNode("second");

      registerComponent("test-component", setup1, []);
      registerComponent("test-component", setup2, []);

      const registration = getComponent("test-component");
      expect(registration?.setup).toBe(setup2);
    });
  });

  describe("getComponent", () => {
    it("should return registered component", () => {
      const setup = () => document.createTextNode("test");
      const cssTexts = [":host { color: red; }"];
      const propsSchema = { name: { type: String } };

      registerComponent("my-component", setup, cssTexts, propsSchema);

      const registration = getComponent("my-component");
      expect(registration).toBeDefined();
      expect(registration?.tagName).toBe("my-component");
      expect(registration?.setup).toBe(setup);
      expect(registration?.cssTexts).toEqual(cssTexts);
      expect(registration?.propsSchema).toEqual(propsSchema);
    });

    it("should return undefined for unregistered component", () => {
      const registration = getComponent("non-existent");
      expect(registration).toBeUndefined();
    });

    it("should return ComponentRegistration with correct structure", () => {
      const setup = () => document.createTextNode("test");
      const cssTexts = [":host { display: block; }"];
      const propsSchema = { value: { type: String } };

      registerComponent("structure-test", setup, cssTexts, propsSchema);

      const registration = getComponent("structure-test");
      expect(registration).toHaveProperty("tagName");
      expect(registration).toHaveProperty("setup");
      expect(registration).toHaveProperty("cssTexts");
      expect(registration).toHaveProperty("propsSchema");
    });
  });

  describe("hasComponent", () => {
    it("should return true for registered component", () => {
      const setup = () => document.createTextNode("test");
      registerComponent("existing-component", setup, []);

      expect(hasComponent("existing-component")).toBe(true);
    });

    it("should return false for unregistered component", () => {
      expect(hasComponent("non-existent")).toBe(false);
    });

    it("should return false after clearRegistry", () => {
      const setup = () => document.createTextNode("test");
      registerComponent("temp-component", setup, []);

      expect(hasComponent("temp-component")).toBe(true);

      clearRegistry();

      expect(hasComponent("temp-component")).toBe(false);
    });
  });

  describe("clearRegistry", () => {
    it("should clear all registered components", () => {
      const setup = () => document.createTextNode("test");

      registerComponent("component-1", setup, []);
      registerComponent("component-2", setup, []);
      registerComponent("component-3", setup, []);

      expect(hasComponent("component-1")).toBe(true);
      expect(hasComponent("component-2")).toBe(true);
      expect(hasComponent("component-3")).toBe(true);

      clearRegistry();

      expect(hasComponent("component-1")).toBe(false);
      expect(hasComponent("component-2")).toBe(false);
      expect(hasComponent("component-3")).toBe(false);
    });

    it("should allow re-registration after clear", () => {
      const setup = () => document.createTextNode("test");

      registerComponent("reusable-component", setup, []);
      clearRegistry();
      registerComponent("reusable-component", setup, []);

      expect(hasComponent("reusable-component")).toBe(true);
    });
  });

  describe("ComponentRegistration structure", () => {
    it("should contain all required fields", () => {
      const setup = () => document.createTextNode("test");
      const cssTexts = [
        ":host { display: block; }",
        "div { color: blue; }",
      ];
      const propsSchema = {
        name: { type: String },
        value: { type: String },
        disabled: { type: Boolean },
      };

      registerComponent("full-component", setup, cssTexts, propsSchema);

      const registration = getComponent("full-component");
      expect(registration).toMatchObject({
        tagName: "full-component",
        setup,
        cssTexts,
        propsSchema,
      });
    });

    it("should handle empty cssTexts array", () => {
      const setup = () => document.createTextNode("test");
      registerComponent("no-styles", setup, [], { attr: { type: String } });

      const registration = getComponent("no-styles");
      expect(registration?.cssTexts).toEqual([]);
    });

    it("should handle no propsSchema", () => {
      const setup = () => document.createTextNode("test");
      registerComponent("no-attrs", setup, [":host {}"]);

      const registration = getComponent("no-attrs");
      expect(registration?.propsSchema).toBeUndefined();
    });
  });
});
