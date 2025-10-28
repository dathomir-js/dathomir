---
applyTo: "**/packages/plugin/**"
priority: 0
lastUpdated: "2025-10-28"
---

# @dathomir/plugin Instructions

## Overview
@dathomir/plugin detects file changes during development or build, invokes @dathomir/transformer, and transforms JSX source into code instrumented for reactivity using @dathomir/reactivity (signals/computed), so the resulting output is ready for the runtime to mount or render.

