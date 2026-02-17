// eslint-disable-next-line n/no-extraneous-import
import { tasks, ExecTask } from "nadle";

const taskName = "build";

// Variable reference (non-literal, should be skipped)
tasks.register(taskName, ExecTask, { command: "tsc" });

// Template literal (non-literal, should be skipped)
tasks.register(`${taskName}-all`, ExecTask, { command: "tsc" });

// Function call (non-literal, should be skipped)
tasks.register(getTaskName(), ExecTask, { command: "tsc" });

// Valid literal alongside dynamic (should still be analyzed)
tasks.register("lint", ExecTask, { command: "eslint" });

function getTaskName(): string {
	return "dynamic";
}
