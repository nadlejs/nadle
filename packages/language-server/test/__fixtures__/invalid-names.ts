// @ts-nocheck -- intentional type errors for LSP analyzer testing
import { tasks, ExecTask } from "nadle";

// Starts with number
tasks.register("123build", { run: ExecTask, options: { command: "tsc" } });

// Contains underscore
tasks.register("my_task", { run: ExecTask, options: { command: "echo" } });

// Ends with hyphen
tasks.register("build-", { run: ExecTask, options: { command: "tsc" } });

// Contains space
tasks.register("build task", { run: ExecTask, options: { command: "tsc" } });

// Empty string
tasks.register("", { run: ExecTask, options: { command: "tsc" } });

// Special characters
tasks.register("build@v2", { run: ExecTask, options: { command: "tsc" } });
