import { createRuleTester } from "../helpers.js";
import rule from "../../src/rules/valid-depends-on.js";

const ruleTester = createRuleTester();

ruleTester.run("valid-depends-on", rule, {
	valid: [
		{
			code: 'tasks.register("build").config({ dependsOn: ["test"] })'
		},
		{
			code: 'tasks.register("build").config({ dependsOn: "test" })'
		},
		{
			code: 'tasks.register("build").config({ description: "desc" })'
		},
		{
			code: 'tasks.register("build").config({})'
		},
		{
			code: 'tasks.register("build")'
		},
		{
			code: 'tasks.register("build", () => {}).config({ dependsOn: ["lint", "test"] })'
		}
	],
	invalid: [
		{
			errors: [{ messageId: "invalidDependsOn" }],
			code: 'tasks.register("build").config({ dependsOn: 123 })'
		},
		{
			errors: [{ messageId: "invalidDependsOn" }],
			code: 'tasks.register("build").config({ dependsOn: [123] })'
		},
		{
			errors: [{ messageId: "invalidDependsOn" }],
			code: 'tasks.register("build").config({ dependsOn: [true] })'
		},
		{
			errors: [{ messageId: "invalidDependsOn" }],
			code: 'tasks.register("build").config({ dependsOn: ["test", 123] })'
		}
	]
});
