import { describe } from "vitest";

import { createRuleTester } from "../helpers.js";
import rule from "../../src/rules/require-task-inputs.js";

const ruleTester = createRuleTester();

describe("require-task-inputs", () => {
	ruleTester.run("require-task-inputs", rule, {
		invalid: [
			{
				name: "outputs without inputs",
				code: `tasks.register("build", { outputs: [Outputs.dirs("lib")] });`,
				errors: [{ data: { name: "build" }, messageId: "missingInputs" as const }]
			},
			{
				name: "outputs present, inputs missing",
				errors: [{ data: { name: "copy" }, messageId: "missingInputs" as const }],
				code: `tasks.register("copy", { outputs: [Outputs.dirs("dist")], description: "Copy files" });`
			}
		],
		valid: [
			{
				name: "both inputs and outputs",
				code: `tasks.register("build", { inputs: [Inputs.dirs("src")], outputs: [Outputs.dirs("lib")] });`
			},
			{
				name: "no outputs (no inputs needed)",
				code: `tasks.register("test", { description: "Run tests" });`
			},
			{
				name: "only inputs (fine)",
				code: `tasks.register("lint", { inputs: [Inputs.dirs("src")] });`
			},
			{
				name: "no spec at all",
				code: `tasks.register("clean");`
			},
			{
				name: "dynamic task name is skipped",
				code: `tasks.register(name, { outputs: [Outputs.dirs("lib")] });`
			}
		]
	});
});
