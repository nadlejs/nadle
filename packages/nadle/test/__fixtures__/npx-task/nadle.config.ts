import { tasks, NpxTask } from "nadle";

tasks.register("pass", { run: NpxTask, options: { command: "tsc", args: ["./src/pass.ts", "--noEmit", "--pretty"] } });
tasks.register("fail", { run: NpxTask, options: { command: "tsc", args: ["./src/nonexistent.ts", "--noEmit", "--pretty"] } });
tasks.register("echo", { run: NpxTask, options: { command: "echo", args: ["hello"] } });
