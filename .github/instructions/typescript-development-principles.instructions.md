---
applyTo: "**/*.ts,**/*.tsx"
priority: 5
---

# TypeScript Development Principles Instructions

## Rules
- Do not export items on each line; instead, consolidate and export them at the end of the file.
- Follow the oxlint rules.
  Reference files:
  - #file <root>/config/templates/oxlintrc.template.json
  - The `.oxlintrc.json` file located at the root of each package
- Make full use of TypeScript's type safety.
- Avoid using the `any` type.