import { createRuleTester } from "../helpers.js";
import rule from "../../src/rules/valid-depends-on.js";

const ruleTester = createRuleTester();

ruleTester.run("valid-depends-on", rule, {
	valid: [
		{
			name: "string array of valid task names",
			code: 'tasks.register("build", { dependsOn: ["test"] })'
		},
		{
			name: "single string dependency",
			code: 'tasks.register("build", { dependsOn: "test" })'
		},
		{
			name: "no dependsOn property",
			code: 'tasks.register("build", { description: "desc" })'
		},
		{
			name: "empty spec object",
			code: 'tasks.register("build", {})'
		},
		{
			name: "no spec",
			code: 'tasks.register("build")'
		},
		{
			name: "multiple valid dependencies",
			code: 'tasks.register("build", { run: () => {}, dependsOn: ["lint", "test"] })'
		},
		{
			name: "valid workspace-qualified reference",
			code: 'tasks.register("build", { dependsOn: ["shared:build"] })'
		},
		{
			name: "valid workspace-qualified with nested path",
			code: 'tasks.register("build", { dependsOn: ["packages:shared:test"] })'
		},
		{
			name: "single workspace-qualified string",
			code: 'tasks.register("build", { dependsOn: "lib:compile" })'
		}
	],
	invalid: [
		{
			name: "number value",
			errors: [{ messageId: "invalidDependsOn" }],
			code: 'tasks.register("build", { dependsOn: 123 })'
		},
		{
			name: "array with number element",
			errors: [{ messageId: "invalidDependsOn" }],
			code: 'tasks.register("build", { dependsOn: [123] })'
		},
		{
			name: "array with boolean element",
			errors: [{ messageId: "invalidDependsOn" }],
			code: 'tasks.register("build", { dependsOn: [true] })'
		},
		{
			name: "mixed valid string and number",
			errors: [{ messageId: "invalidDependsOn" }],
			code: 'tasks.register("build", { dependsOn: ["test", 123] })'
		},
		{
			name: "invalid task name in dependency",
			errors: [{ messageId: "invalidDependencyName" }],
			code: 'tasks.register("build", { dependsOn: ["_invalid"] })'
		},
		{
			name: "invalid task name with trailing dash",
			errors: [{ messageId: "invalidDependencyName" }],
			code: 'tasks.register("build", { dependsOn: "build-" })'
		},
		{
			name: "invalid task name starting with number",
			errors: [{ messageId: "invalidDependencyName" }],
			code: 'tasks.register("build", { dependsOn: ["123task"] })'
		},
		{
			errors: [{ messageId: "invalidWorkspaceRef" }],
			name: "workspace-qualified with invalid task name",
			code: 'tasks.register("build", { dependsOn: ["shared:123bad"] })'
		},
		{
			errors: [{ messageId: "invalidWorkspaceRef" }],
			code: 'tasks.register("build", { dependsOn: ["shared:"] })',
			name: "workspace-qualified with empty task name (trailing colon)"
		},
		{
			name: "colon only (empty workspace and task)",
			errors: [{ messageId: "invalidWorkspaceRef" }],
			code: 'tasks.register("build", { dependsOn: [":"] })'
		},
		{
			name: "mixed valid and invalid dependency names",
			errors: [{ messageId: "invalidDependencyName" }],
			code: 'tasks.register("build", { dependsOn: ["test", "_bad"] })'
		}
	]
});
