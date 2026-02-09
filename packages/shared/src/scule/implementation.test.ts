import { describe, expect, it } from "vitest";

import {
  camelCase,
  flatCase,
  isUppercase,
  kebabCase,
  lowerFirst,
  pascalCase,
  snakeCase,
  splitByCase,
  titleCase,
  trainCase,
  upperFirst,
} from "./implementation";

describe("isUppercase", () => {
  it("should return true for uppercase characters", () => {
    expect(isUppercase("A")).toBe(true);
    expect(isUppercase("Z")).toBe(true);
  });

  it("should return false for lowercase characters", () => {
    expect(isUppercase("a")).toBe(false);
    expect(isUppercase("z")).toBe(false);
  });

  it("should return undefined for empty string", () => {
    expect(isUppercase("")).toBe(false);
  });
});

describe("splitByCase", () => {
  it("should split camelCase", () => {
    expect(splitByCase("helloWorld")).toEqual(["hello", "World"]);
  });

  it("should split PascalCase", () => {
    expect(splitByCase("HelloWorld")).toEqual(["Hello", "World"]);
  });

  it("should split kebab-case", () => {
    expect(splitByCase("hello-world")).toEqual(["hello", "world"]);
  });

  it("should split snake_case", () => {
    expect(splitByCase("hello_world")).toEqual(["hello", "world"]);
  });

  it("should handle empty string", () => {
    expect(splitByCase("")).toEqual([]);
  });

  it("should handle single word", () => {
    expect(splitByCase("hello")).toEqual(["hello"]);
  });

  it("should handle consecutive uppercase (acronyms)", () => {
    expect(splitByCase("XMLParser")).toEqual(["XML", "Parser"]);
  });
});

describe("upperFirst", () => {
  it("should capitalize first character", () => {
    expect(upperFirst("hello")).toBe("Hello");
  });

  it("should handle empty string", () => {
    expect(upperFirst("")).toBe("");
  });

  it("should handle already uppercase", () => {
    expect(upperFirst("Hello")).toBe("Hello");
  });
});

describe("lowerFirst", () => {
  it("should lowercase first character", () => {
    expect(lowerFirst("Hello")).toBe("hello");
  });

  it("should handle empty string", () => {
    expect(lowerFirst("")).toBe("");
  });

  it("should handle already lowercase", () => {
    expect(lowerFirst("hello")).toBe("hello");
  });
});

describe("camelCase", () => {
  it("should convert kebab-case", () => {
    expect(camelCase("hello-world")).toBe("helloWorld");
  });

  it("should convert snake_case", () => {
    expect(camelCase("hello_world")).toBe("helloWorld");
  });

  it("should convert PascalCase", () => {
    expect(camelCase("HelloWorld")).toBe("helloWorld");
  });

  it("should handle empty call", () => {
    expect(camelCase()).toBe("");
  });
});

describe("pascalCase", () => {
  it("should convert kebab-case", () => {
    expect(pascalCase("hello-world")).toBe("HelloWorld");
  });

  it("should convert snake_case", () => {
    expect(pascalCase("hello_world")).toBe("HelloWorld");
  });

  it("should convert camelCase", () => {
    expect(pascalCase("helloWorld")).toBe("HelloWorld");
  });

  it("should handle empty call", () => {
    expect(pascalCase()).toBe("");
  });
});

describe("kebabCase", () => {
  it("should convert camelCase", () => {
    expect(kebabCase("helloWorld")).toBe("hello-world");
  });

  it("should convert PascalCase", () => {
    expect(kebabCase("HelloWorld")).toBe("hello-world");
  });

  it("should convert snake_case", () => {
    expect(kebabCase("hello_world")).toBe("hello-world");
  });

  it("should handle empty call", () => {
    expect(kebabCase()).toBe("");
  });
});

describe("snakeCase", () => {
  it("should convert camelCase", () => {
    expect(snakeCase("helloWorld")).toBe("hello_world");
  });

  it("should convert PascalCase", () => {
    expect(snakeCase("HelloWorld")).toBe("hello_world");
  });

  it("should convert kebab-case", () => {
    expect(snakeCase("hello-world")).toBe("hello_world");
  });

  it("should handle empty call", () => {
    expect(snakeCase()).toBe("");
  });
});

describe("flatCase", () => {
  it("should convert camelCase to flat", () => {
    expect(flatCase("helloWorld")).toBe("helloworld");
  });

  it("should convert kebab-case to flat", () => {
    expect(flatCase("hello-world")).toBe("helloworld");
  });

  it("should handle empty call", () => {
    expect(flatCase()).toBe("");
  });
});

describe("trainCase", () => {
  it("should convert camelCase to Train-Case", () => {
    expect(trainCase("helloWorld")).toBe("Hello-World");
  });

  it("should convert snake_case to Train-Case", () => {
    expect(trainCase("hello_world")).toBe("Hello-World");
  });

  it("should handle empty call", () => {
    expect(trainCase()).toBe("");
  });
});

describe("titleCase", () => {
  it("should convert camelCase to Title Case", () => {
    expect(titleCase("helloWorld")).toBe("Hello World");
  });

  it("should convert kebab-case to Title Case", () => {
    expect(titleCase("hello-world")).toBe("Hello World");
  });

  it("should handle empty call", () => {
    expect(titleCase()).toBe("");
  });
});
