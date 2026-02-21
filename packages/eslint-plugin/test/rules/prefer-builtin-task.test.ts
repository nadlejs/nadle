import { createRuleTester } from "../helpers.js";
import rule from "../../src/rules/prefer-builtin-task.js";

const ruleTester = createRuleTester();

ruleTester.run("prefer-builtin-task", rule, {
	valid: [
		{
			code: 'tasks.register("build", ExecTask, { command: "tsc" });'
		},
		{
			code: 'exec("ls");'
		},
		{
			code: 'tasks.register("build", async () => { console.log("hello"); });'
		},
		{
			code: 'execa("tsc");'
		},
		{
			code: 'rimraf("dist");'
		},
		{
			code: 'fs.cp("src", "dist");'
		},
		{
			code: 'someOtherThing.register("build", () => { execa("tsc"); });'
		},
		{
			code: 'tasks.register("build");'
		}
	],
	invalid: [
		// ExecTask: execa
		{
			errors: [{ messageId: "preferExec", data: { name: "execa" } }],
			code: 'tasks.register("build", async () => { await execa("tsc"); });'
		},
		// ExecTask: exec
		{
			errors: [{ data: { name: "exec" }, messageId: "preferExec" }],
			code: 'tasks.register("build", async () => { exec("npm test"); });'
		},
		// ExecTask: spawn
		{
			errors: [{ messageId: "preferExec", data: { name: "spawn" } }],
			code: 'tasks.register("build", async () => { spawn("node", ["index.js"]); });'
		},
		// ExecTask: execFile
		{
			errors: [{ messageId: "preferExec", data: { name: "execFile" } }],
			code: 'tasks.register("build", async () => { execFile("./run.sh"); });'
		},
		// ExecTask: child_process.exec
		{
			errors: [{ messageId: "preferExec", data: { name: "child_process.exec" } }],
			code: 'tasks.register("build", async () => { child_process.exec("cmd"); });'
		},
		// ExecTask: child_process.spawn
		{
			errors: [{ messageId: "preferExec", data: { name: "child_process.spawn" } }],
			code: 'tasks.register("build", async () => { child_process.spawn("node"); });'
		},
		// ExecTask: child_process.execFile
		{
			code: 'tasks.register("run", () => { child_process.execFile("./run.sh"); });',
			errors: [{ messageId: "preferExec", data: { name: "child_process.execFile" } }]
		},
		// PnpmTask: execa("pnpm", ...)
		{
			errors: [{ messageId: "preferPnpm", data: { name: "execa" } }],
			code: 'tasks.register("install", async () => { await execa("pnpm", ["install"]); });'
		},
		// CopyTask: fs.cp
		{
			errors: [{ messageId: "preferCopy", data: { name: "fs.cp" } }],
			code: 'tasks.register("copy", async () => { await fs.cp("src", "dist"); });'
		},
		// CopyTask: fs.copyFile
		{
			errors: [{ messageId: "preferCopy", data: { name: "fs.copyFile" } }],
			code: 'tasks.register("copy", async () => { await fs.copyFile("a", "b"); });'
		},
		// CopyTask: fsPromises.cp
		{
			errors: [{ messageId: "preferCopy", data: { name: "fsPromises.cp" } }],
			code: 'tasks.register("copy", async () => { await fsPromises.cp("src", "out"); });'
		},
		// CopyTask: fsPromises.copyFile
		{
			code: 'tasks.register("copy", () => { fsPromises.copyFile("a", "b"); });',
			errors: [{ messageId: "preferCopy", data: { name: "fsPromises.copyFile" } }]
		},
		// DeleteTask: rimraf
		{
			errors: [{ data: { name: "rimraf" }, messageId: "preferDelete" }],
			code: 'tasks.register("clean", async () => { await rimraf("dist"); });'
		},
		// DeleteTask: fs.rm
		{
			errors: [{ data: { name: "fs.rm" }, messageId: "preferDelete" }],
			code: 'tasks.register("clean", async () => { await fs.rm("dist"); });'
		},
		// DeleteTask: fs.rmdir
		{
			errors: [{ messageId: "preferDelete", data: { name: "fs.rmdir" } }],
			code: 'tasks.register("clean", async () => { await fs.rmdir("dist"); });'
		},
		// DeleteTask: fs.unlink
		{
			errors: [{ messageId: "preferDelete", data: { name: "fs.unlink" } }],
			code: 'tasks.register("clean", async () => { await fs.unlink("file.txt"); });'
		},
		// DeleteTask: fsPromises.rm
		{
			errors: [{ messageId: "preferDelete", data: { name: "fsPromises.rm" } }],
			code: 'tasks.register("clean", async () => { await fsPromises.rm("dist"); });'
		},
		// DeleteTask: fsPromises.rmdir
		{
			code: 'tasks.register("clean", () => { fsPromises.rmdir("old"); });',
			errors: [{ messageId: "preferDelete", data: { name: "fsPromises.rmdir" } }]
		},
		// DeleteTask: fsPromises.unlink
		{
			code: 'tasks.register("clean", () => { fsPromises.unlink("tmp.txt"); });',
			errors: [{ messageId: "preferDelete", data: { name: "fsPromises.unlink" } }]
		},
		// Nested inside task action
		{
			errors: [{ messageId: "preferExec", data: { name: "execa" } }],
			code: `tasks.register("build", async () => {
	async function helper() { await execa("tsc"); }
});`
		},
		// Multiple detections in one task
		{
			code: `tasks.register("build", async () => {
	await fs.cp("src", "dist");
	await rimraf("tmp");
});`,
			errors: [
				{ messageId: "preferCopy", data: { name: "fs.cp" } },
				{ data: { name: "rimraf" }, messageId: "preferDelete" }
			]
		}
	]
});
