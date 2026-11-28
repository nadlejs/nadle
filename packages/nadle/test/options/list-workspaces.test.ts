import { exec, expectPass } from "setup";
import { it, describe } from "vite-plus/test";

describe("--list-workspaces", () => {
	it("prints root workspace", async () => {
		await expectPass(exec`--list-workspaces`);
	});
});
