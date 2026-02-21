import { describe } from "vitest";

import { createRuleTester } from "../helpers.js";
import rule from "../../src/rules/require-task-description.js";

const ruleTester = createRuleTester();

describe("require-task-description", () => {
	ruleTester.run("require-task-description", rule, {
		valid: [
			{
				name: "register with config containing description",
				code: 'tasks.register("build").config({ description: "Build the project" })'
			},
			{
				name: "register with action and config containing description",
				code: 'tasks.register("test", () => {}).config({ description: "Run tests" })'
			},
			{
				name: "register with task class, options, and config containing description",
				code: 'tasks.register("build", ExecTask, { command: "tsc" }).config({ description: "Compile", dependsOn: ["lint"] })'
			},
			{
				name: "dynamic name is skipped",
				code: "tasks.register(dynamicName)"
			},
			{
				code: 'other.register("build")',
				name: "non-tasks register call is ignored"
			}
		],
		invalid: [
			{
				code: 'tasks.register("build")',
				name: "register without config call",
				errors: [{ data: { name: "build" }, messageId: "missingConfig" as const }]
			},
			{
				code: 'tasks.register("test", () => {})',
				name: "register with action but no config call",
				errors: [{ data: { name: "test" }, messageId: "missingConfig" as const }]
			},
			{
				name: "config without description property",
				code: 'tasks.register("build").config({ dependsOn: ["lint"] })',
				errors: [{ data: { name: "build" }, messageId: "missingDescription" as const }]
			},
			{
				name: "empty config object",
				code: 'tasks.register("build").config({})',
				errors: [{ data: { name: "build" }, messageId: "missingDescription" as const }]
			}
		]
	});
});
