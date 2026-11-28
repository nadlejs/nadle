import { it, expect, describe } from "vite-plus/test";

import { decideScope } from "./test-scope.js";

describe("decideScope", () => {
	it.each([
		{ files: [], kind: "none", name: "no changes" },
		{ files: [""], kind: "none", name: "only blank entries" },
		{ kind: "narrow", name: "test-only edit", files: ["packages/nadle/test/features/cache.test.ts"] },
		{ kind: "narrow", name: "docs edit", files: ["README.md", "packages/docs/docs/intro.md"] },
		{ kind: "narrow", name: "language server source", files: ["packages/language-server/src/server.ts"] },
		{ kind: "narrow", name: "eslint plugin source", files: ["packages/eslint-plugin/src/index.ts"] },
		{ kind: "nadle-full", name: "nadle source", files: ["packages/nadle/src/core/nadle.ts"] },
		{ kind: "nadle-full", name: "kernel source", files: ["packages/kernel/src/task-identifier.ts"] },
		{ kind: "nadle-full", name: "project-resolver source", files: ["packages/project-resolver/src/index.ts"] },
		{ kind: "nadle-full", name: "Windows separators", files: ["packages\\nadle\\src\\cli.ts"] },
		{ kind: "nadle-full", name: "source among other files", files: ["README.md", "packages/kernel/src/a.ts"] },
		{ kind: "narrow", name: "nadle test fixture", files: ["packages/nadle/test/__fixtures__/x/nadle.config.ts"] },
		{ kind: "narrow", name: "similar prefix is not source", files: ["packages/nadle-extra/src/a.ts"] }
	])("$name selects $kind", ({ kind, files }) => {
		expect(decideScope(files).kind).toBe(kind);
	});

	it("names the triggering file in the reason", () => {
		expect(decideScope(["packages/kernel/src/a.ts"]).reason).toContain("packages/kernel/src/a.ts");
	});
});
