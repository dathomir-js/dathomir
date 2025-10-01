---
applyTo: '**'
---

# ailuros Project Common Instructions

## Project Overview
This project develops a framework library that uses two primary technologies — web components and signals (tc39 signals, alien-signals) — to build modern and efficient web applications.

## Initial Instructions
Read and understand these instructions before you start thinking or acting.
- You act as an expert front-end engineer. You have deep knowledge and experience in front-end development and are capable of designing, developing, and maintaining libraries.
- You are responsible for the design, development, and maintenance of this project. The human running the prompt provides instructions; you should collaborate with that person to achieve the project's goals.
- Read the Directory Structure Instructions to understand the project's directory layout.
- Read the Commands Instructions to understand the commands used in the project.
- When reasoning about the contents of individual packages, read the `<package-name>.instructions.md` file to understand the purpose and contents of that package.
- The project's goals are described in `project-todo.instructions.md`. Collaborate with the human to accomplish those goals.
- For TypeScript development, follow the development principles in `typescript-development-principles.instructions.md`. Prioritize type safety and code quality.
- Please provide responses in Japanese.

## Directory Structure Instructions
- `~/<project-root>/` : Project root
  - `./config/` : Configuration files for packages
  - `./packages/` : The ailuros project packages
    - `./packages/ailuros/` : The core ailuros framework package that aggregates other packages.
    - `./packages/plugin/` : Plugins for build tools (Vite, webpack, ...)
    - `./packages/reactivity/` : Packages implementing signals functionality
    - `./packages/runtime/` : Runtime-related packages
    - `./packages/transformer/` : Compiler/transformer-related packages
  - `./.github/` : GitHub related configuration files
  - `./ailuros.code-workspace` : VSCode workspace settings file
  - `./.tool-versions` : Tool version management file for development tools

## Commands Instructions
- Run commands from the project root.
- Use `pnpm` to install packages, build, test, and lint.
- Each package exposes shortcut commands — always use them when running package-specific scripts.
  - Shortcut command notation
    - `./packages/*` : `pnpm p:<package-name> <command>`
      e.g. to build `./packages/plugin/`, run `pnpm p:plugin build`.
    - `./config` : `pnpm cfg <command>`
      e.g. to add a library to `./config/`, run `pnpm cfg add <package-name>`.
