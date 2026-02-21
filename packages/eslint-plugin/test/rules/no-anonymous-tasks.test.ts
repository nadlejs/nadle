import { createRuleTester } from "../helpers.js";
import rule from "../../src/rules/no-anonymous-tasks.js";

const ruleTester = createRuleTester();

ruleTester.run("no-anonymous-tasks", rule, {
	valid: [
		{
			code: 'tasks.register("build", () => {})'
		},
		{
			code: 'tasks.register("test", ExecTask, { command: "vitest" })'
		},
		{
			code: 'tasks.register("deploy")'
		},
		{
			code: "someOtherThing.register()"
		}
	],
	invalid: [
		{
			code: "tasks.register()",
			errors: [{ messageId: "anonymous" }]
		},
		{
			code: "tasks.register(someVariable)",
			errors: [{ messageId: "anonymous" }]
		},
		{
			code: "tasks.register(123)",
			errors: [{ messageId: "anonymous" }]
		}
	]
});
