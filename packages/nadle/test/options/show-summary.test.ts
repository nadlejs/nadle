import { it, expect, describe } from "vitest";

import { exec, createExec } from "../utils.js";
import { serializeANSI } from "../snapshot-serializers.js";

describe("--show-summary", () => {
	it("should show in-progress summary when enable explicitly", async () => {
		const { stdout, exitCode } = await exec`copy --show-summary`;

		expect(exitCode).toBe(0);

		const blurStdout = serializeANSI(stdout as string);

		expect(blurStdout).contain(`<Dim>Start at   </BoldDim>`);
		expect(blurStdout).contain(`<Dim>Duration   </BoldDim> 0ms`);
		expect(blurStdout).contain(
			`<Dim>Tasks      </BoldDim> <Bold><Blue>1 queued</Blue></BoldDim>, <Bold><Yellow>0 running</Yellow></BoldDim>, <Bold><Green>0 finished</Green></BoldDim>`
		);
		expect(blurStdout).contain(
			`<Dim>Tasks      </BoldDim> <Bold><Blue>1 queued</Blue></BoldDim>, <Bold><Yellow>1 running</Yellow></BoldDim>, <Bold><Green>0 finished</Green></BoldDim>`
		);
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
		const { stdout, exitCode } = await createExec({
			autoDisabledSummary: false,
			env: { CI: "false", GITHUB_ACTIONS: undefined }
		})`copy`;

		expect(exitCode).toBe(0);
		expect(serializeANSI(stdout as string)).contain(`<Dim>Tasks      </BoldDim>`);
	});
});
