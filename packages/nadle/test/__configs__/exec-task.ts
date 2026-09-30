import { tasks, ExecTask } from "nadle";

tasks.register("pwd-1", { run: ExecTask, options: { args: [], command: "pwd" } });
tasks.register("pwd-2", { run: ExecTask, workingDir: ".", options: { args: [], command: "pwd" } });
tasks.register("pwd-3", { run: ExecTask, workingDir: "..", options: { args: [], command: "pwd" } });
tasks.register("pwd-4", { run: ExecTask, workingDir: "../..", options: { args: [], command: "pwd" } });
tasks.register("pwd-5", { run: ExecTask, workingDir: "main", options: { args: [], command: "pwd" } });

const printColorEnv = ["-e", "console.log(`FORCE_COLOR=${process.env.FORCE_COLOR} NO_COLOR=${process.env.NO_COLOR}`)"];

tasks.register("color-default", { run: ExecTask, options: { command: "node", args: printColorEnv } });
tasks.register("color-force-off", {
	run: ExecTask,
	env: { FORCE_COLOR: "0" },
	options: { command: "node", args: printColorEnv }
});
tasks.register("color-no-color", {
	run: ExecTask,
	env: { NO_COLOR: "1" },
	options: { command: "node", args: printColorEnv }
});

const failColored = ["-e", "console.log(process.env.FORCE_COLOR ? '\\x1b[31m red \\x1b[0m' : 'plain-failure'); process.exit(1)"];

tasks.register("color-fail", { run: ExecTask, options: { command: "node", args: failColored } });
tasks.register("color-fail-forced", {
	run: ExecTask,
	env: { FORCE_COLOR: "1" },
	options: { command: "node", args: failColored }
});
