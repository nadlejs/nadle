// @ts-nocheck -- intentional type errors for LSP analyzer testing
import { tasks, ExecTask, PnpmTask } from "nadle";

// First registration (valid)
tasks.register("build", { run: ExecTask, options: { command: "tsc", args: ["--build"] } });

// Duplicate (should be flagged)
tasks.register("build", { run: PnpmTask, options: { args: ["-r", "build"] } });

// Unique task (no issue)
tasks.register("test", { run: ExecTask, options: { command: "vitest" } });
