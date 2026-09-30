import { tasks, PnpxTask } from "nadle";

tasks.register("pass", { run: PnpxTask, options: { command: "tsc", args: ["./src/pass.ts", "--noEmit", "--pretty"] } });
tasks.register("fail", { run: PnpxTask, options: { command: "tsc", args: ["./src/nonexistent.ts", "--noEmit", "--pretty"] } });
tasks.register("echo", { run: PnpxTask, options: { command: "echo", args: ["hello"] } });
