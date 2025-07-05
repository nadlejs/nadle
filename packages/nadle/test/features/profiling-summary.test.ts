import { it, expect, describe } from "vitest";

import { renderProfilingSummary } from "../../src/core/reporting/profiling-summary.js";

describe.skip("profiling summary", () => {
	it("should render top 5 slowest tasks descending", async () => {
		expect(
			renderProfilingSummary({
				totalDuration: 20000,
				tasks: [
					{ label: "test", duration: 1234 },
					{ duration: 5678, label: "compile" },
					{ duration: 9111, label: "install" },
					{ label: "node", duration: 1213 },
					{ duration: 1415, label: "compileTs" },
					{ duration: 1617, label: "compileSvg" }
				]
			})
		).toMatchSnapshot();
	});

	it("should render all tasks if less then 5", async () => {
		expect(
			renderProfilingSummary({
				totalDuration: 20000,
				tasks: [
					{ label: "test", duration: 1234 },
					{ duration: 5678, label: "compile" }
				]
			})
		).toMatchSnapshot();
	});

	it("should not render if there is no tasks", async () => {
		expect(renderProfilingSummary({ tasks: [], totalDuration: 20000 })).toMatchSnapshot();
	});
});
