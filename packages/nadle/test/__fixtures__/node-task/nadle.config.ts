import { tasks, NodeTask } from "nadle";

tasks.register("pass", NodeTask, { script: "./src/pass.mjs" });
tasks.register("fail", NodeTask, { script: "./src/fail.mjs" });
tasks.register("echo", NodeTask, { args: "hello", script: "./src/echo.mjs" });
