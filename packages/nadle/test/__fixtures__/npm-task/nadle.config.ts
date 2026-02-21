import { tasks, NpmTask } from "nadle";

tasks.register("pass", NpmTask, { args: ["exec", "--", "tsc", "./src/pass.ts", "--noEmit", "--pretty"] });
tasks.register("fail", NpmTask, { args: ["exec", "--", "tsc", "./src/nonexistent.ts", "--noEmit", "--pretty"] });
tasks.register("echo", NpmTask, { args: ["exec", "--", "echo", "hello"] });
