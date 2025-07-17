import { it, describe } from "vitest";
import { exec, expectPass } from "setup";

describe("--list-workspaces", () => {
	it("prints root workspace", async () => {
		await expectPass(exec`--list-workspaces`);
	});
});
