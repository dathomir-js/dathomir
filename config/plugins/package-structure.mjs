import { readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";

/**
 * @typedef {{ excludePaths?: string[] }} FeatureDirectoryFilesOptions
 * @typedef {{ filename?: string; getFilename?: () => string; options: FeatureDirectoryFilesOptions[]; report: (descriptor: { node: unknown; messageId: string; data: { message: string } }) => void }} RuleContext
 */

const requiredFiles = [
  "AGENTS.md",
  "SPEC.typ",
  "implementation.ts",
  "implementation.test.ts",
];
const markerFiles = new Set(requiredFiles);
const scannedDirectories = new Set();

/**
 * @param {string} value
 * @returns {string}
 */
function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

/**
 * @param {string} pattern
 * @returns {RegExp}
 */
function pathPatternToRegExp(pattern) {
  let source = "";
  let needsSeparator = false;

  for (const segment of pattern.split("/")) {
    if (segment === "**") {
      if (needsSeparator) {
        source += "/";
      }

      source += "(?:[^/]+/)*";
      needsSeparator = false;
      continue;
    }

    if (needsSeparator) {
      source += "/";
    }

    source += escapeRegExp(segment).replaceAll("*", "[^/]*");
    needsSeparator = true;
  }

  return new RegExp(`^${source}(?:/.*)?$`);
}

/**
 * @param {string[]} excludePaths
 * @returns {RegExp[]}
 */
function createExcludeMatchers(excludePaths) {
  return excludePaths.map((excludePath) =>
    pathPatternToRegExp(toPosixPath(excludePath).replace(/^\.\//, "")),
  );
}

/**
 * @param {string} root
 * @param {string} directory
 * @param {RegExp[]} excludeMatchers
 * @returns {boolean}
 */
function isExcludedPath(root, directory, excludeMatchers) {
  const relativePath = toPosixPath(path.relative(root, directory));

  return excludeMatchers.some((matcher) => matcher.test(relativePath));
}

/**
 * @param {unknown} value
 * @returns {value is NodeJS.ErrnoException}
 */
function isErrnoException(value) {
  return value instanceof Error && "code" in value;
}

/**
 * @param {string} directory
 * @returns {import("node:fs").Dirent[]}
 */
function readEntries(directory) {
  try {
    return readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    if (isErrnoException(error) && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

/**
 * @param {import("node:fs").Dirent[]} entries
 * @returns {boolean}
 */
function hasStructureMarker(entries) {
  return entries.some((entry) => entry.isFile() && markerFiles.has(entry.name));
}

/**
 * @param {string} root
 * @param {string} directory
 * @param {RegExp[]} excludeMatchers
 * @param {string[]} errors
 * @returns {void}
 */
function lintStructureDirectory(root, directory, excludeMatchers, errors) {
  if (isExcludedPath(root, directory, excludeMatchers)) {
    return;
  }

  const entries = readEntries(directory);
  const names = new Set(entries.map((entry) => entry.name));

  if (hasStructureMarker(entries)) {
    for (const requiredFile of requiredFiles) {
      if (!names.has(requiredFile)) {
        errors.push(
          `${path.relative(root, directory)} is missing ${requiredFile}`,
        );
      }
    }
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    lintStructureDirectory(
      root,
      path.join(directory, entry.name),
      excludeMatchers,
      errors,
    );
  }
}

/**
 * @param {string} root
 * @param {RegExp[]} excludeMatchers
 * @returns {string[]}
 */
function lintPackageStructure(root, excludeMatchers) {
  const srcDir = path.join(root, "src");
  const srcEntries = readEntries(srcDir);
  /** @type {string[]} */
  const errors = [];

  for (const entry of srcEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    lintStructureDirectory(
      root,
      path.join(srcDir, entry.name),
      excludeMatchers,
      errors,
    );
  }

  return errors;
}

const featureDirectoryFiles = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require feature directories to contain AGENTS.md, SPEC.typ, implementation.ts, and implementation.test.ts.",
    },
    messages: {
      missingFiles: "{{message}}",
    },
    schema: [
      {
        type: "object",
        properties: {
          excludePaths: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  /**
   * @param {RuleContext} context
   */
  create(context) {
    return {
      Program(node) {
        const root = process.cwd();
        const filename = context.filename ?? context.getFilename?.() ?? "";
        const srcDir = path.join(root, "src") + path.sep;
        if (!path.resolve(filename).startsWith(srcDir)) {
          return;
        }

        if (scannedDirectories.has(root)) {
          return;
        }

        scannedDirectories.add(root);
        const options = context.options[0] ?? {};
        const excludeMatchers = createExcludeMatchers(options.excludePaths ?? []);
        const errors = lintPackageStructure(root, excludeMatchers);
        if (errors.length === 0) {
          return;
        }

        context.report({
          node,
          messageId: "missingFiles",
          data: {
            message: errors.join("\n"),
          },
        });
      },
    };
  },
};

export default {
  meta: {
    name: "dathra-structure",
  },
  rules: {
    "feature-directory-files": featureDirectoryFiles,
  },
};
