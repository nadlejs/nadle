import { tasks, ExecTask } from "nadle";

tasks.register("lint", ExecTask, { command: "eslint", args: ["."] });
tasks.register("format", ExecTask, { command: "prettier", args: ["--write", "."] });
