import { createRuleTester } from "../helpers.js";
import rule from "../../src/rules/padding-between-tasks.js";

const ruleTester = createRuleTester();

ruleTester.run("padding-between-tasks", rule, {
	valid: [
		{
			name: "empty line between consecutive tasks",
			code: `
tasks.register("build").config({ description: "Build" });

tasks.register("test").config({ description: "Test" });
			`.trim()
		},
		{
			code: `tasks.register("build");`,
			name: "single task (nothing to pad)"
		},
		{
			name: "non-task statement between tasks resets tracking",
			code: `
tasks.register("build");
const x = 1;
tasks.register("test");
			`.trim()
		},
		{
			name: "empty line between plain register calls",
			code: `
tasks.register("build");

tasks.register("test");
			`.trim()
		},
		{
			name: "multiple blank lines between tasks",
			code: `
tasks.register("build");


tasks.register("test");
			`.trim()
		},
		{
			name: "unrelated call expressions are ignored",
			code: `
something.register("a");
something.register("b");
			`.trim()
		}
	],
	invalid: [
		{
			errors: [{ messageId: "needsPadding" as const }],
			name: "no empty line between consecutive plain tasks",
			code: `
tasks.register("build");
tasks.register("test");
			`.trim(),
			output: `
tasks.register("build");

tasks.register("test");
			`.trim()
		},
		{
			errors: [{ messageId: "needsPadding" as const }],
			name: "no empty line between chained config tasks",
			code: `
tasks.register("build").config({ description: "Build" });
tasks.register("test").config({ description: "Test" });
			`.trim(),
			output: `
tasks.register("build").config({ description: "Build" });

tasks.register("test").config({ description: "Test" });
			`.trim()
		},
		{
			name: "three consecutive tasks missing padding",
			errors: [{ messageId: "needsPadding" as const }, { messageId: "needsPadding" as const }],
			code: `
tasks.register("build");
tasks.register("test");
tasks.register("lint");
			`.trim(),
			output: `
tasks.register("build");

tasks.register("test");

tasks.register("lint");
			`.trim()
		},
		{
			errors: [{ messageId: "needsPadding" as const }],
			name: "mixed chained and plain tasks without padding",
			code: `
tasks.register("build").config({ description: "Build" });
tasks.register("test");
			`.trim(),
			output: `
tasks.register("build").config({ description: "Build" });

tasks.register("test");
			`.trim()
		}
	]
});
