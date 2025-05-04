import { execa } from "execa";
import { it, expect, describe } from "vitest";

import { cliPath, fixturesDir } from "./utils.js";

describe("dependsOn", () => {
	const exec = execa({ cwd: fixturesDir });

	it("should run dependent tasks first", async () => {
		const { stdout } = await exec`${cliPath} --config depends-on.nadle.ts compileTs`;
		expect(stdout).toMatchSnapshot();
	});

	it("should run shared dependent tasks", async () => {
		const { stdout } = await exec`${cliPath} --config depends-on.nadle.ts compile test`;
		expect(stdout).toMatchSnapshot();
	});

	it("should run shared dependent tasks 2", async () => {
		const { stdout } = await exec`${cliPath} --config depends-on.nadle.ts test compile`;
		expect(stdout).toMatchSnapshot();
	});
});
