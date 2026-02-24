import { createRuleTester } from "../helpers.js";
import rule from "../../src/rules/no-circular-dependencies.js";

const ruleTester = createRuleTester();

ruleTester.run("no-circular-dependencies", rule, {
	invalid: [
		{
			name: "direct cycle (a -> b -> a)",
			errors: [{ messageId: "circular", data: { cycle: "a -> b -> a" } }],
			code: `
				tasks.register("a").config({ dependsOn: ["b"] });
				tasks.register("b").config({ dependsOn: ["a"] });
			`
		},
		{
			name: "self-reference (a -> a)",
			errors: [{ messageId: "circular", data: { cycle: "a -> a" } }],
			code: `
				tasks.register("a").config({ dependsOn: ["a"] });
			`
		},
		{
			name: "transitive cycle (a -> b -> c -> a)",
			errors: [{ messageId: "circular", data: { cycle: "a -> b -> c -> a" } }],
			code: `
				tasks.register("a").config({ dependsOn: ["b"] });
				tasks.register("b").config({ dependsOn: ["c"] });
				tasks.register("c").config({ dependsOn: ["a"] });
			`
		}
	],
	valid: [
		{
			name: "linear chain",
			code: `
				tasks.register("a").config({ dependsOn: ["b"] });
				tasks.register("b").config({ dependsOn: ["c"] });
				tasks.register("c");
			`
		},
		{
			name: "independent tasks",
			code: `
				tasks.register("build");
				tasks.register("test");
			`
		},
		{
			name: "diamond shape (no cycle)",
			code: `
				tasks.register("a").config({ dependsOn: ["b", "c"] });
				tasks.register("b").config({ dependsOn: ["d"] });
				tasks.register("c").config({ dependsOn: ["d"] });
				tasks.register("d");
			`
		},
		{
			name: "depends on unknown task (not a cycle)",
			code: `
				tasks.register("a").config({ dependsOn: ["external"] });
			`
		},
		{
			name: "no dependsOn property",
			code: `
				tasks.register("a").config({ description: "builds stuff" });
			`
		},
		{
			name: "workspace-qualified deps are excluded from cycle detection",
			code: `
				tasks.register("a").config({ dependsOn: ["shared:a"] });
			`
		}
	]
});
