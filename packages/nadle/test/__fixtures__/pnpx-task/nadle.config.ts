import { tasks, PnpxTask } from "nadle";

tasks.register("pass", PnpxTask, { command: "tsc", args: ["./src/pass.ts", "--noEmit", "--pretty"] });
tasks.register("fail", PnpxTask, { command: "tsc", args: ["./src/fail.ts", "--noEmit", "--pretty"] });
tasks.register("echo", PnpxTask, { command: "echo", args: ["hello"] });
