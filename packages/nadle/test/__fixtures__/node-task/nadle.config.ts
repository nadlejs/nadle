import { tasks, NodeTask } from "nadle";

tasks.register("pass", NodeTask, { script: "./src/pass.js" });
tasks.register("fail", NodeTask, { script: "./src/fail.js" });
tasks.register("echo", NodeTask, { args: "hello", script: "./src/echo.js" });
