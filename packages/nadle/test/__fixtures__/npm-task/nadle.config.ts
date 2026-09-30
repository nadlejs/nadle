import { tasks, NpmTask } from "nadle";

tasks.register("pass", { run: NpmTask, options: { args: ["exec", "--", "tsc", "./src/pass.ts", "--noEmit", "--pretty"] } });
tasks.register("fail", { run: NpmTask, options: { args: ["exec", "--", "tsc", "./src/nonexistent.ts", "--noEmit", "--pretty"] } });
tasks.register("echo", { run: NpmTask, options: { args: ["exec", "--", "echo", "hello"] } });
