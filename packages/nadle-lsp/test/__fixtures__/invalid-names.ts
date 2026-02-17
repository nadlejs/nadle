// eslint-disable-next-line n/no-extraneous-import
import { tasks, ExecTask } from "nadle";

// Starts with number
tasks.register("123build", ExecTask, { command: "tsc" });

// Contains underscore
tasks.register("my_task", ExecTask, { command: "echo" });

// Ends with hyphen
tasks.register("build-", ExecTask, { command: "tsc" });

// Contains space
tasks.register("build task", ExecTask, { command: "tsc" });

// Empty string
tasks.register("", ExecTask, { command: "tsc" });

// Special characters
tasks.register("build@v2", ExecTask, { command: "tsc" });
