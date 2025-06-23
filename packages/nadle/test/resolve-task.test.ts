import { it, expect, describe } from "vitest";

import { resolveTask } from "../src/core/resolve-task.js";

const allTasks = ["build", "buildDockerImage", "buildDockerContainer", "publish", "push", "compileTs", "compileJs", "compileCss"];

describe("resolveTask", () => {
	it("resolves exact task names", () => {
		expect(resolveTask("build", allTasks)).toMatchInlineSnapshot(`
			{
			  result: build,
			}
		`);
		expect(resolveTask("publish", allTasks)).toMatchInlineSnapshot(`
			{
			  result: publish,
			}
		`);
	});

	it("resolves initials", () => {
		expect(resolveTask("bdi", allTasks)).toMatchInlineSnapshot(`
			{
			  result: buildDockerImage,
			}
		`);
		expect(resolveTask("bDI", allTasks)).toMatchInlineSnapshot(`
			{
			  result: buildDockerImage,
			}
		`);

		expect(resolveTask("bDI", [...allTasks, "buildDockerIdentity"])).toMatchInlineSnapshot(`
			{
			  result: undefined,
			  suggestions: [],
			}
		`);
		expect(resolveTask("bdx", allTasks)).toMatchInlineSnapshot(`
			{
			  result: undefined,
			  suggestions: [],
			}
		`);
	});

	it("resolves fuzzy", () => {
		expect(resolveTask("publihs", allTasks)).toMatchInlineSnapshot(`
			{
			  result: publish,
			}
		`);
		expect(resolveTask("publis", allTasks)).toMatchInlineSnapshot(`
			{
			  result: publish,
			}
		`);

		expect(resolveTask("compile", allTasks)).toMatchInlineSnapshot(
			`
			{
			  result: undefined,
			  suggestions: [
			    compileTs,
			    compileJs,
			    compileCss,
			  ],
			}
		`
		);
		expect(resolveTask("plish", allTasks)).toMatchInlineSnapshot(`
			{
			  result: undefined,
			  suggestions: [
			    publish,
			    push,
			  ],
			}
		`);
	});

	it("not found", () => {
		expect(resolveTask("compil", allTasks)).toMatchInlineSnapshot(`
			{
			  result: undefined,
			  suggestions: [
			    compileTs,
			    compileJs,
			  ],
			}
		`);
	});
});
