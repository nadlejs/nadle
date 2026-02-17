// eslint-disable-next-line n/no-extraneous-import
import { tasks, ExecTask, PnpmTask } from "nadle";

// First registration (valid)
tasks.register("build", ExecTask, { command: "tsc", args: ["--build"] });

// Duplicate (should be flagged)
tasks.register("build", PnpmTask, { args: ["-r", "build"] });

// Unique task (no issue)
tasks.register("test", ExecTask, { command: "vitest" });
