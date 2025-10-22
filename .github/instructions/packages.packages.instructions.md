---
applyTo: '**/packages/**'
priority: 0
---

# dathomir Project Packages Instructions

# Overview
The dathomir project stores its packages under `/packages/**`.
Each package is independent and can be built, tested, and deployed individually.
For the purpose and contents of each package, refer to the package's `<package-name>.instructions.md` file.

# Main Instructions
- When generating responses, use `use context7` to understand the latest specifications and usage of dependent packages before replying.

## Test
- Do not generate tests until explicitly instructed to do so.
- If you intend to generate tests, first confirm with a human.
- Use vitest to create and run tests.
- For how to use vitest, obtain the latest information via `use context7`.
- Aim for 100% test coverage whenever possible.

## Documentation
- Do not generate new documentation in Markdown or similar formats.
- Add explanations in the code using JSDoc comments. Write them in English.
- Avoid excessive commenting; include only the minimum necessary comments such as function descriptions and parameter explanations.