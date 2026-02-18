import Path from "node:path";

import { it, expect, describe } from "vitest";
import { fixture, getStdout, createExec, withGeneratedFixture } from "setup";

const helloTask = 'import { tasks } from "nadle";\n\ntasks.register("hello", () => console.log(`Hello from ${process.cwd()}`));\n';

const files = fixture()
	.packageJson("traverse-up")
	.configRaw(helloTask)
	.file("a/a1/a11/nadle.config.mjs", helloTask)
	.file("a/a1/a11/a111/nadle.config.js", helloTask)
	.dir("a/a1/a11/a112")
	.dir("a/a1/a12")
	.build();

describe.concurrent("traverse-up", () => {
	it.each(["a/a1/a11/a112", "a/a1/a12", "a/a1", "a"])("can traverse up to pick the config file from %s", (path) =>
		withGeneratedFixture({
			files,
			testFn: async ({ cwd }) => {
				const stdout = await getStdout(createExec({ cwd: Path.join(cwd, ...path.split("/")) })`hello`);

				expect(stdout).toContain("Hello from");
			}
		})
	);
});
