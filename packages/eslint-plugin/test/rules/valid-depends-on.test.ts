import { createRuleTester } from "../helpers.js";
import rule from "../../src/rules/valid-depends-on.js";

const ruleTester = createRuleTester();

ruleTester.run("valid-depends-on", rule, {
	valid: [
		{
			name: "string array of valid task names",
			code: 'tasks.register("build").config({ dependsOn: ["test"] })'
		},
		{
			name: "single string dependency",
			code: 'tasks.register("build").config({ dependsOn: "test" })'
		},
		{
			name: "no dependsOn property",
			code: 'tasks.register("build").config({ description: "desc" })'
		},
		{
			name: "empty config object",
			code: 'tasks.register("build").config({})'
		},
		{
			name: "no config call",
			code: 'tasks.register("build")'
		},
		{
			name: "multiple valid dependencies",
			code: 'tasks.register("build", () => {}).config({ dependsOn: ["lint", "test"] })'
		},
		{
			name: "valid workspace-qualified reference",
			code: 'tasks.register("build").config({ dependsOn: ["shared:build"] })'
		},
		{
			name: "valid workspace-qualified with nested path",
			code: 'tasks.register("build").config({ dependsOn: ["packages:shared:test"] })'
		},
		{
			name: "single workspace-qualified string",
			code: 'tasks.register("build").config({ dependsOn: "lib:compile" })'
		}
	],
	invalid: [
		{
			name: "number value",
			errors: [{ messageId: "invalidDependsOn" }],
			code: 'tasks.register("build").config({ dependsOn: 123 })'
		},
		{
			name: "array with number element",
			errors: [{ messageId: "invalidDependsOn" }],
			code: 'tasks.register("build").config({ dependsOn: [123] })'
		},
		{
			name: "array with boolean element",
			errors: [{ messageId: "invalidDependsOn" }],
			code: 'tasks.register("build").config({ dependsOn: [true] })'
		},
		{
			name: "mixed valid string and number",
			errors: [{ messageId: "invalidDependsOn" }],
			code: 'tasks.register("build").config({ dependsOn: ["test", 123] })'
		},
		{
			name: "invalid task name in dependency",
			errors: [{ messageId: "invalidDependencyName" }],
			code: 'tasks.register("build").config({ dependsOn: ["_invalid"] })'
		},
		{
			name: "invalid task name with trailing dash",
			errors: [{ messageId: "invalidDependencyName" }],
			code: 'tasks.register("build").config({ dependsOn: "build-" })'
		},
		{
			name: "invalid task name starting with number",
			errors: [{ messageId: "invalidDependencyName" }],
			code: 'tasks.register("build").config({ dependsOn: ["123task"] })'
		},
		{
			errors: [{ messageId: "invalidWorkspaceRef" }],
			name: "workspace-qualified with invalid task name",
			code: 'tasks.register("build").config({ dependsOn: ["shared:123bad"] })'
		},
		{
			errors: [{ messageId: "invalidWorkspaceRef" }],
			name: "workspace-qualified with empty task name (trailing colon)",
			code: 'tasks.register("build").config({ dependsOn: ["shared:"] })'
		},
		{
			name: "colon only (empty workspace and task)",
			errors: [{ messageId: "invalidWorkspaceRef" }],
			code: 'tasks.register("build").config({ dependsOn: [":"] })'
		},
		{
			name: "mixed valid and invalid dependency names",
			errors: [{ messageId: "invalidDependencyName" }],
			code: 'tasks.register("build").config({ dependsOn: ["test", "_bad"] })'
		}
	]
});
