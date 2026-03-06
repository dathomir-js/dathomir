import type { Plugin } from "@opencode-ai/plugin"

/**
 * Runs oxfmt and oxlint after each agent response completes.
 * Triggered by the `session.idle` event.
 */
export const FormatLintPlugin: Plugin = async ({ $, directory }) => {
  return {
    event: async ({ event }) => {
      if (event.type !== "session.idle") return

      // Run formatter
      await $`oxfmt ${directory}`.catch(() => {})
      // Run linter
      await $`oxlint ${directory}`.catch(() => {})
    },
  }
}
