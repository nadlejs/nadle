import { it, describe } from "vite-plus/test";
import { exec, expectPass } from "setup";

describe("--list-workspaces", () => {
	it("prints root workspace", async () => {
		await expectPass(exec`--list-workspaces`);
	});
});
