import { describe } from "vitest";

import { createRuleTester } from "../helpers.js";
import rule from "../../src/rules/require-task-inputs.js";

const ruleTester = createRuleTester();

describe("require-task-inputs", () => {
	ruleTester.run("require-task-inputs", rule, {
		invalid: [
			{
				name: "outputs without inputs",
				errors: [{ data: { name: "build" }, messageId: "missingInputs" as const }],
				code: `tasks.register("build").config({ outputs: [Outputs.dirs("lib")] });`
			},
			{
				name: "outputs present, inputs missing",
				errors: [{ data: { name: "copy" }, messageId: "missingInputs" as const }],
				code: `tasks.register("copy").config({ outputs: [Outputs.dirs("dist")], description: "Copy files" });`
			}
		],
		valid: [
			{
				name: "both inputs and outputs",
				code: `tasks.register("build").config({ inputs: [Inputs.dirs("src")], outputs: [Outputs.dirs("lib")] });`
			},
			{
				name: "no outputs (no inputs needed)",
				code: `tasks.register("test").config({ description: "Run tests" });`
			},
			{
				name: "only inputs (fine)",
				code: `tasks.register("lint").config({ inputs: [Inputs.dirs("src")] });`
			},
			{
				name: "no config at all",
				code: `tasks.register("clean");`
			},
			{
				name: "dynamic task name is skipped",
				code: `tasks.register(name).config({ outputs: [Outputs.dirs("lib")] });`
			}
		]
	});
});
