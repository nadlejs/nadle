// @ts-nocheck -- LSP fixture; analyzed as AST, not compiled
import { tasks, ExecTask } from "nadle";

tasks.register("lint", { run: ExecTask, options: { command: "eslint", args: ["."] } });
tasks.register("format", { run: ExecTask, options: { command: "prettier", args: ["--write", "."] } });
