import { tasks, ExecTask } from "nadle";

tasks.register("pwd-1", { run: ExecTask, options: { args: [], command: "pwd" } });
tasks.register("pwd-2", { run: ExecTask, workingDir: ".", options: { args: [], command: "pwd" } });
tasks.register("pwd-3", { run: ExecTask, workingDir: "..", options: { args: [], command: "pwd" } });
tasks.register("pwd-4", { run: ExecTask, workingDir: "../..", options: { args: [], command: "pwd" } });
tasks.register("pwd-5", { run: ExecTask, workingDir: "main", options: { args: [], command: "pwd" } });
