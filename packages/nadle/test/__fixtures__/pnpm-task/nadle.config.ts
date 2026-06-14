import { tasks, PnpmTask } from "nadle";

tasks.register("pass", { run: PnpmTask, options: { args: ["exec", "tsc", "./src/pass.ts", "--noEmit", "--pretty"] } });
tasks.register("fail", { run: PnpmTask, options: { args: ["exec", "tsc", "./src/nonexistent.ts", "--noEmit", "--pretty"] } });
tasks.register("echo", { run: PnpmTask, options: { args: ["exec", "echo", "hello"] } });
tasks.register("filtered", { run: PnpmTask, options: { args: ["exec", "echo", "hello"],
	filter: "@nadle/internal-nadle-test-fixtures-pnpm-task" } });
