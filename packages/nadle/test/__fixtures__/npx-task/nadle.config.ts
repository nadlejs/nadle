import { tasks, NpxTask } from "nadle";

tasks.register("pass", NpxTask, { command: "tsc", args: ["./src/pass.ts", "--noEmit", "--pretty"] });
tasks.register("fail", NpxTask, { command: "tsc", args: ["./src/fail.ts", "--noEmit", "--pretty"] });
tasks.register("echo", NpxTask, { command: "echo", args: ["hello"] });
