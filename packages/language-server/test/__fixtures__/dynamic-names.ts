// @ts-nocheck -- intentional type errors for LSP analyzer testing
import { tasks, ExecTask } from "nadle";

const taskName = "build";

// Variable reference (non-literal, should be skipped)
tasks.register(taskName, { run: ExecTask, options: { command: "tsc" } });

// Template literal (non-literal, should be skipped)
tasks.register(`${taskName}-all`, { run: ExecTask, options: { command: "tsc" } });

// Function call (non-literal, should be skipped)
tasks.register(getTaskName(), { run: ExecTask, options: { command: "tsc" } });

// Valid literal alongside dynamic (should still be analyzed)
tasks.register("lint", { run: ExecTask, options: { command: "eslint" } });

function getTaskName(): string {
	return "dynamic";
}
