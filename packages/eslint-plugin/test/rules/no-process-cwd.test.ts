import { describe } from "vitest";

import { createRuleTester } from "../helpers.js";
import rule from "../../src/rules/no-process-cwd.js";

const ruleTester = createRuleTester();

describe("no-process-cwd", () => {
	ruleTester.run("no-process-cwd", rule, {
		valid: [
			{
				name: "process.cwd() outside task action (top-level config code)",
				code: `const root = process.cwd();
tasks.register("build", async () => {});`
			},
			{
				name: "no process.cwd() in task action",
				code: 'tasks.register("build", async (context) => { const dir = context.workingDir; })'
			},
			{
				name: "not a tasks.register call",
				code: 'something.register("x", () => { process.cwd(); })'
			},
			{
				name: "process.cwd() in unrelated function",
				code: "function setup() { return process.cwd(); }"
			}
		],
		invalid: [
			{
				name: "process.cwd() in task action",
				errors: [{ messageId: "noProcessCwd" as const }],
				code: 'tasks.register("build", () => { const dir = process.cwd(); })'
			},
			{
				name: "process.cwd() nested inside task action",
				errors: [{ messageId: "noProcessCwd" as const }],
				code: 'tasks.register("build", () => { function helper() { return process.cwd(); } })'
			},
			{
				name: "process.cwd() in async task action",
				errors: [{ messageId: "noProcessCwd" as const }],
				code: 'tasks.register("test", async (ctx) => { const p = process.cwd(); })'
			}
		]
	});
});
