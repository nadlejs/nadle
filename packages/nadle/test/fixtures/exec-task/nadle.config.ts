import { tasks, ExecTask } from "nadle";

tasks.register("pwd-1", ExecTask, { args: [], command: "pwd" });
tasks.register("pwd-2", ExecTask, { args: [], command: "pwd" }).config({ workingDir: "." });
tasks.register("pwd-3", ExecTask, { args: [], command: "pwd" }).config({ workingDir: ".." });
tasks.register("pwd-4", ExecTask, { args: [], command: "pwd" }).config({ workingDir: "../.." });
tasks.register("pwd-5", ExecTask, { args: [], command: "pwd" }).config({ workingDir: "../main" });
