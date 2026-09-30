import { describe } from "vitest";

import { createRuleTester } from "../helpers.js";
import rule from "../../src/rules/require-task-description.js";

const ruleTester = createRuleTester();

describe("require-task-description", () => {
	ruleTester.run("require-task-description", rule, {
		valid: [
			{
				name: "register with spec containing description",
				code: 'tasks.register("build", { description: "Build the project" })'
			},
			{
				name: "register with run action and description",
				code: 'tasks.register("test", { run: () => {}, description: "Run tests" })'
			},
			{
				name: "register with task class, options, and description",
				code: 'tasks.register("build", { run: ExecTask, options: { command: "tsc" }, description: "Compile", dependsOn: ["lint"] })'
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
				name: "register without spec",
				code: 'tasks.register("build")',
				errors: [{ data: { name: "build" }, messageId: "missingConfig" as const }]
			},
			{
				code: 'tasks.register("test", () => {})',
				name: "register with fn shorthand but no spec",
				errors: [{ data: { name: "test" }, messageId: "missingConfig" as const }]
			},
			{
				name: "spec without description property",
				code: 'tasks.register("build", { dependsOn: ["lint"] })',
				errors: [{ data: { name: "build" }, messageId: "missingDescription" as const }]
			},
			{
				name: "empty spec object",
				code: 'tasks.register("build", {})',
				errors: [{ data: { name: "build" }, messageId: "missingDescription" as const }]
			}
		]
	});
});
