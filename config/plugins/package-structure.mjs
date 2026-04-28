import { readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const requiredFiles = [
  "AGENTS.md",
  "SPEC.typ",
  "implementation.ts",
  "implementation.test.ts",
];
const markerFiles = new Set(requiredFiles);
const scannedDirectories = new Set();

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function pathPatternToRegExp(pattern) {
  const source = pattern
    .split("/")
    .map((segment) => {
      if (segment === "**") {
        return "(?:[^/]+/)*";
      }

      return escapeRegExp(segment).replaceAll("*", "[^/]*");
    })
    .join("/")
    .replaceAll("*)/", "*)");

  return new RegExp(`^${source}(?:/.*)?$`);
}

function createExcludeMatchers(excludePaths) {
  return excludePaths.map((excludePath) =>
    pathPatternToRegExp(toPosixPath(excludePath).replace(/^\.\//, "")),
  );
}

function isExcludedPath(root, directory, excludeMatchers) {
  const relativePath = toPosixPath(path.relative(root, directory));

  return excludeMatchers.some((matcher) => matcher.test(relativePath));
}

function readEntries(directory) {
  try {
    return readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

function hasStructureMarker(entries) {
  return entries.some((entry) => entry.isFile() && markerFiles.has(entry.name));
}

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

function lintPackageStructure(root, excludeMatchers) {
  const srcDir = path.join(root, "src");
  const srcEntries = readEntries(srcDir);
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
