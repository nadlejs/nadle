import { it, expect, describe } from "vitest";

import { exec, createExec } from "../setup/utils.js";
import { serializeANSI } from "../setup/snapshot-serializers.js";

describe("--show-summary", () => {
	it("should show in-progress summary when enable explicitly", async () => {
		const { stdout, exitCode } = await exec`copy --show-summary`;

		expect(exitCode).toBe(0);

		const blurStdout = serializeANSI(stdout as string);

		expect(blurStdout).contain(`<Dim>Start at   </BoldDim>`);
		expect(blurStdout).contain(`<Dim>Duration   </BoldDim> 0ms`);
		expect(blurStdout).contain(
			`<Dim>Tasks      </BoldDim> <BrightCyan>2 pending</Cyan> <BrightBlack>|</Cyan> <Yellow>0 running</Yellow> <BrightBlack>|</Yellow> <Green>0 finished</Green> <Dim>(2 scheduled)</BoldDim>`
		);
		expect(blurStdout).contain(
			`<Dim>Tasks      </BoldDim> <BrightCyan>1 pending</Yellow> <BrightBlack>|</Yellow> <Yellow>1 running</Yellow> <BrightBlack>|</Yellow> <Green>0 finished</Green> <Dim>(2 scheduled)</BoldDim>`
		);
		expect(blurStdout).contain(`<Yellow>></Yellow> <Dim>IDLE</BoldDim>`);
		expect(blurStdout).contain(`<Yellow>></Yellow> :<Bold>prepare</BoldDim>`);
	});

	it("should not show summary when disabled explicitly", async () => {
		const { stdout, exitCode } = await exec`copy --no-show-summary`;

		expect(exitCode).toBe(0);
		expect(serializeANSI(stdout as string)).not.contain(`<Dim>Tasks      </BoldDim>`);
	});

	it("should not show summary in CI by default", async () => {
		const { stdout, exitCode } = await createExec({ env: { CI: "true" }, autoDisabledSummary: false })`copy`;

		expect(exitCode).toBe(0);
		expect(serializeANSI(stdout as string)).not.contain(`<Dim>Tasks      </BoldDim>`);
	});

	it("should show summary when not in CI by default", async () => {
		const { stdout, exitCode } = await createExec({ env: { CI: "false" }, autoDisabledSummary: false })`copy`;

		expect(exitCode).toBe(0);
		expect(serializeANSI(stdout as string)).contain(`<Dim>Tasks      </BoldDim>`);
	});
});
