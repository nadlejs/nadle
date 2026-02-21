import { createRuleTester } from "../helpers.js";
import rule from "../../src/rules/no-sync-in-task-action.js";

const ruleTester = createRuleTester();

ruleTester.run("no-sync-in-task-action", rule, {
	valid: [
		{
			code: 'tasks.register("build", async () => { await fs.readFile("f"); });'
		},
		{
			code: `const data = fs.readFileSync("config.json");
tasks.register("build", async () => {});`
		},
		{
			code: 'tasks.register("build");'
		},
		{
			code: 'readFileSync("file.txt");'
		},
		{
			code: 'tasks.register("build", async () => { await exec("cmd"); });'
		},
		{
			code: 'someOtherThing.register("build", () => { fs.readFileSync("f"); });'
		}
	],
	invalid: [
		{
			errors: [{ messageId: "noSync", data: { name: "readFileSync" } }],
			code: 'tasks.register("build", () => { fs.readFileSync("file.txt"); });'
		},
		{
			errors: [{ messageId: "noSync", data: { name: "execSync" } }],
			code: 'tasks.register("test", () => { execSync("npm test"); });'
		},
		{
			errors: [{ messageId: "noSync", data: { name: "writeFileSync" } }],
			code: `tasks.register("build", () => {
	function helper() { fs.writeFileSync("f", "d"); }
});`
		},
		{
			errors: [{ messageId: "noSync", data: { name: "spawnSync" } }],
			code: 'tasks.register("build", () => { spawnSync("node", ["script.js"]); });'
		},
		{
			errors: [{ messageId: "noSync", data: { name: "execFileSync" } }],
			code: 'tasks.register("build", () => { execFileSync("./run.sh"); });'
		},
		{
			code: `tasks.register("build", () => {
	fs.mkdirSync("dir");
	fs.copyFileSync("a", "b");
});`,
			errors: [
				{ messageId: "noSync", data: { name: "mkdirSync" } },
				{ messageId: "noSync", data: { name: "copyFileSync" } }
			]
		},
		{
			errors: [{ messageId: "noSync", data: { name: "existsSync" } }],
			code: 'tasks.register("build", async () => { fs.existsSync("f"); });'
		}
	]
});
