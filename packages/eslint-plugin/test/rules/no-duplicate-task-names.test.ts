import { describe } from "vitest";

import { createRuleTester } from "../helpers.js";
import rule from "../../src/rules/no-duplicate-task-names.js";

const ruleTester = createRuleTester();

describe("no-duplicate-task-names", () => {
	ruleTester.run("no-duplicate-task-names", rule, {
		valid: [
			{
				name: "two different task names",
				code: `tasks.register("build"); tasks.register("test");`
			},
			{
				name: "single task",
				code: `tasks.register("build");`
			},
			{
				name: "dynamic names are skipped",
				code: `tasks.register(name1); tasks.register(name2);`
			}
		],
		invalid: [
			{
				name: "duplicate task name reports on second occurrence",
				code: `tasks.register("build"); tasks.register("build");`,
				errors: [{ data: { name: "build" }, messageId: "duplicate" as const }]
			},
			{
				name: "duplicate task name reports on third occurrence",
				errors: [{ data: { name: "test" }, messageId: "duplicate" as const }],
				code: `tasks.register("test"); tasks.register("build"); tasks.register("test");`
			}
		]
	});
});
