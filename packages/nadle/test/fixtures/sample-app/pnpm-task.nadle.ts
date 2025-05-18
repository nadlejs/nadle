import { tasks, PnpmTask } from "../../../lib/index.js";

tasks.register("pass", PnpmTask, { args: ["exec", "tsc", "./src/pass.ts", "--pretty"] });
tasks.register("fail", PnpmTask, { args: ["exec", "tsc", "./src/fail.ts", "--pretty"] });
tasks.register("echo", PnpmTask, { args: ["exec", "echo", "hello"] });
