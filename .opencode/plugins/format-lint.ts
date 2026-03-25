import type { Plugin } from "@opencode-ai/plugin";

export const FormatLintPlugin: Plugin = async ({ $, directory }) => {
  return {
    event: async ({ event }) => {
      if (event.type !== "session.idle") return;

      // Run formatter via config package where oxfmt is installed
      // await $`pnpm `.catch(() => {})
      // Run linter via config package where oxlint is installed
      await $`cd ${directory} && pnpm lint`.catch(() => {});
    },
  };
};
