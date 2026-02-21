import { tasks, PnpmTask } from "nadle";

tasks.register("pass", PnpmTask, { args: ["exec", "tsc", "./src/pass.ts", "--noEmit", "--pretty"] });
tasks.register("fail", PnpmTask, { args: ["exec", "tsc", "./src/nonexistent.ts", "--noEmit", "--pretty"] });
tasks.register("echo", PnpmTask, { args: ["exec", "echo", "hello"] });
