---
applyTo: '**'
priority: 9999
---

# dathomir Project Common Instructions

## Project Overview
This project develops a framework library that uses two primary technologies — web components and signals (tc39 signals, alien-signals) — to build modern and efficient web applications.

## Initial Instructions
Read and understand these instructions before you start working.
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
  - `./packages/` : The dathomir project packages
    - `./packages/dathomir/` : The core dathomir framework package that aggregates other packages.
    - `./packages/plugin/` : Plugins for build tools (Vite, webpack, ...)
    - `./packages/reactivity/` : Packages implementing signals functionality
    - `./packages/runtime/` : Runtime-related packages
    - `./packages/transformer/` : Compiler/transformer-related packages
  - `./.github/` : GitHub related configuration files
  - `./dathomir.code-workspace` : VSCode workspace settings file
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

## Priority Instructions
- `*.instructions.md` files may contain `priority: <number>` tags.
- A higher `priority` value indicates a more important instruction. If `priority` is not specified, it is considered `0`.
- The range of `priority` is from `-1` to `9999`.

### Priority Handling Rules
- If two instructions contain overlapping items, compare their `priority` values and follow only the one with the higher priority.
  - example
    ```
    # file A.instructions.md
    priority: 1
    - Do A
      - description of A-A
    - Do B
      - description of A-B

    # file B.instructions.md
    priority: 2
    - Do B
      - description of B-B
    - Do C
      - description of B-C
    ```
    In this example both instruction files mention `Do B`, but you should follow the `B.instructions.md` instruction because it has the higher `priority`, and thus follow `description of B-B`.
- If `priority` values are equal, follow both instructions.
- If `priority` is negative, ignore that instruction.
- If the highest `priority` among instructions is `0` or below, ignore all instructions.

### Project Logic Flow
#### @dathomir/plugin
```mermaid
---
title: "@dathomir/plugin"
---
flowchart TD
  startServer(("Start Server")) --> A["Load source code"]
  A --> B["Transform with @dathomir/transformer"]
  B --> C("Wait until changes are detected")
  C --> A
```

#### @dathomir/transformer
```mermaid
---
title: "@dathomir/transformer"
---
flowchart TD
  parseSourceCode["Parse Source Code"] --> A["Analyze AST"]
  A --> B["Transform AST to Dathomir format"]
  B --> C["Generate Transformed Code"]
```

#### @dathomir/reactivity
```mermaid
---
title: "@dathomir/reactivity"
---
flowchart TD
  subgraph Creation["Creation Phase"]
    A1["signal(initial) call"] --> A2["createSignalNode(initial)"]
    A3["computed(getter) call"] --> A4["createComputedNode(getter)"]
    A5["effect(fn) call"] --> A6["createEffectNode(fn)"]
    A6 --> A7["Initial run: fn() / dependency collection"]
    A8["batch(fn)"] --> A9["startBatch() / run fn / endBatch()"]
  end

  subgraph ReadWrite["Read / Write Operations"]
    S1["signal.value read (get accessor)"] --> S2["signalOper(no args)"]
    S2 -->|If Dirty| S3["updateSignal(previousValue)"]
    S2 --> S4["If activeSub (Effect/Computed) then link()"]
    S5["signal.set(v) / value= / update(fn)"] --> S6["signalOper(v) (write)"]
    S6 -->|Value changed| S7["flags = Mutable | Dirty"]
    S7 --> P1["propagate(subs)"]
    C1["computed.value read"] --> C2["computedOper()"]
    C2 -->|First access| C3["Run getter() & flags=Mutable"]
    C2 -->|Dirty / Pending| C4["updateComputed() recompute"]
    C4 -->|Value changed| P2["shallowPropagate(subs)"]
    C2 --> C5["If activeSub exists link()"]
    P1 --> SCH1["scheduleWatcher()"]
    P2 --> SCH1
  end

  subgraph Scheduler["Scheduler / Execution"]
    SCH1 --> Q1["Push to queuedEffects[] (set QUEUED_FLAG)"]
    Q1 -->|If not batching| F1["flush()"]
    A9 -->|On batch end| F1
    F1 --> LOOP1["for each queuedEffects → runWatcher()"]
    LOOP1 --> RW1["runWatcher(effect/computed)"]
    RW1 -->|Dirty/Pending check| RW2["Execute fn()/getter()"]
    RW2 --> RW3["purgeDeps() optimize relinking"]
    RW1 -->|Recursive dependent watchers| RW4["Run dependent watcher chain"]
  end

  subgraph Cleanup["Cleanup / Teardown"]
    CL1["cleanup() returned from effect()"] --> CL2["effectOper()"]
    CL2 --> CL3["effectScopeOper(): unlink deps & subs"]
    UNW1["unwatched(node) (dependency lost)"] -->|kind = computed| CL4["Loop unlink(deps)"]
    UNW1 -->|kind = effect/scope| CL2
  end

  A2 --> S1
  A2 --> S5
  A4 --> C1
  A6 --> S1
  A6 --> C1
  F1 --> RW1
```

#### @dathomir/runtime
```mermaid
---
title: "@dathomir/runtime"
---
flowchart TD
  subgraph JSXTransform["JSX Transform (Compile Time)"]
    JT1["JSX syntax <div>...</div>"] --> JT2["Compiler transforms to jsx() calls"]
    JT2 --> JT3["jsx(tag, props, key)"]
  end

  subgraph ElementCreation["Element Creation (Runtime)"]
    EC1["jsx(tag, props, key) called"] --> EC2{"Is Fragment?"}
    EC2 -->|Yes| EC3["Create DocumentFragment"]
    EC2 -->|No| EC4["createHostElement(tag)"]
    EC4 --> EC5["document.createElement(tag)"]
    EC3 --> EC6["Process children"]
    EC5 --> EC7["Process props loop"]
  end

  subgraph PropsProcessing["Props Processing"]
    PP1["for propKey in props"] --> PP2{"propKey === 'children'?"}
    PP2 -->|Yes| PP3["appendChild(element, children)"]
    PP2 -->|No| PP4{"isEventProp(propKey)?"}
    PP4 -->|"Yes (on*)"| PP5["addEventListenerFromProp()"]
    PP4 -->|No| PP6["setDomProperty(element, key, value)"]
  end

  subgraph ChildrenHandling["Children Handling"]
    CH1["appendChild(parent, child)"] --> CH2{"child type?"}
    CH2 -->|Array| CH3["Recursive appendChild for each"]
    CH2 -->|isReactiveNode| CH4["mountReactiveChild()"]
    CH2 -->|string/number| CH5["createTextNode & append"]
    CH2 -->|boolean/null/undefined| CH6["Skip (no-op)"]
    CH2 -->|isDomNode| CH7["Direct append"]

    CH4 --> CH8["Create Range placeholder"]
    CH8 --> CH9["effect(() => reactive.value)"]
    CH9 --> CH10["On change: cleanup old nodes"]
    CH10 --> CH11["createNodesFromValue(nextValue)"]
    CH11 --> CH12["insertNodes at placeholder"]
  end

  subgraph PropertyHandling["Property Handling"]
    PH1["setDomProperty(element, key, value)"] --> PH2{"isReactiveNode(value)?"}
    PH2 -->|Yes| PH3["mountReactiveProperty()"]
    PH2 -->|No| PH4["applyPropertyValue()"]

    PH3 --> PH5["effect(() => applyPropertyValue(reactive.value))"]

    PH4 --> PH6{"key type?"}
    PH6 -->|ref| PH7["Call ref function or set ref.current"]
    PH6 -->|class/className| PH8["setAttribute('class', value)"]
    PH6 -->|"style (string)"| PH9["setAttribute('style', value)"]
    PH6 -->|"style (object)"| PH10["applyStyleObject() with kebab-case"]
    PH6 -->|data-*/aria-*| PH11["setAttribute(key, value)"]
    PH6 -->|key in element| PH12["host[key] = value (property assignment)"]
    PH6 -->|Other| PH13["setAttribute(key, value)"]
  end

  subgraph EventHandling["Event Handling"]
    EH1["addEventListenerFromProp(element, propKey, value)"] --> EH2["extractEventName(propKey)"]
    EH2 --> EH3["kebabCase(propKey.slice(2))"]
    EH3 --> EH4{"isReactiveNode(value)?"}
    EH4 -->|Yes| EH5["mountReactiveEvent()"]
    EH4 -->|No| EH6["normalizeEventValue(value)"]

    EH5 --> EH7["effect(() => reactive.value)"]
    EH7 --> EH8["On change: remove old listeners"]
    EH8 --> EH9["Add new listeners"]

    EH6 --> EH10["collectDescriptors()"]
    EH10 --> EH11["unwrapReactive recursively"]
    EH11 --> EH12["createDescriptor (listener + options)"]
    EH12 --> EH13["addEventListener(eventName, listener, options)"]
  end

  subgraph ReactivityIntegration["Reactivity Integration"]
    RI1["isReactiveNode(value)"] --> RI2["Check value.value & value.peek"]
    RI2 --> RI3["effect(() => { read reactive.value })"]
    RI3 --> RI4["Automatic dependency tracking"]
    RI4 --> RI5["Re-run effect when dependency changes"]
    RI5 --> RI6["Update DOM incrementally"]
  end

  JT3 --> EC1
  EC7 --> PP1
  EC6 --> PP1
  PP3 --> CH1
  PP5 --> EH1
  PP6 --> PH1
  PH5 --> RI3
  CH9 --> RI3
  EH7 --> RI3
```

### TODOs Instructions
- The project's overall TODOs are recorded in `project-todo.instructions.md`.
- Each package's TODOs are also listed in `project-todo.instructions.md`.
- In general, `project-todo.instructions.md` is managed by humans and you are responsible for executing items when instructed.
- Do not execute items from `project-todo.instructions.md` without explicit human direction.
- Do not add items to `project-todo.instructions.md` on your own initiative.
- Only execute items from `project-todo.instructions.md` when a human explicitly asks you to do so.
- You will not execute all `project-todo.instructions.md` items at once; a human will specify which items to run.
- If a human does not specify which TODO to run, do nothing.
