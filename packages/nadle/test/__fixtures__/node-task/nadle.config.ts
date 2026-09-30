import { tasks, NodeTask } from "nadle";

tasks.register("pass", { run: NodeTask, options: { script: "./src/pass.js" } });
tasks.register("fail", { run: NodeTask, options: { script: "./src/fail.js" } });
tasks.register("echo", { run: NodeTask, options: { args: "hello", script: "./src/echo.js" } });
