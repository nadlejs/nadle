import { createRuleTester } from "../helpers.js";
import rule from "../../src/rules/valid-task-name.js";

const ruleTester = createRuleTester();

ruleTester.run("valid-task-name", rule, {
	valid: [
		{
			code: 'tasks.register("build")'
		},
		{
			code: 'tasks.register("build-js")'
		},
		{
			code: 'tasks.register("a")'
		},
		{
			code: 'tasks.register("task123")'
		},
		{
			code: "tasks.register(dynamicName)"
		},
		{
			code: 'tasks.register("buildJs")'
		},
		{
			code: 'tasks.register("testNoWarningsAndUndocumentedAPI")'
		},
		{
			code: 'tasks.register("Build")'
		}
	],
	invalid: [
		{
			code: 'tasks.register("build-")',
			errors: [{ messageId: "invalidName" }]
		},
		{
			code: 'tasks.register("-build")',
			errors: [{ messageId: "invalidName" }]
		},
		{
			code: 'tasks.register("build_js")',
			errors: [{ messageId: "invalidName" }]
		},
		{
			code: 'tasks.register("123build")',
			errors: [{ messageId: "invalidName" }]
		},
		{
			code: 'tasks.register("Build-All!")',
			errors: [{ messageId: "invalidName" }]
		}
	]
});
