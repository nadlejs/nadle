import { test } from "vitest";

import { exec, expectPass } from "../utils.js";

test("shows info log when passing --log-level=info", async () => {
	await expectPass(exec`hello --log-level=info`);
});

test("shows debug log when passing --log-level=debug", async () => {
	await expectPass(exec`hello --log-level=debug`);
});

test("shows error log only when passing --log-level=error", async () => {
	await expectPass(exec`hello --log-level=error`);
});
