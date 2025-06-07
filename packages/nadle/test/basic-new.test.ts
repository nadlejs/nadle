import stdMocks from "std-mocks";
import { test, expect } from "vitest";

import { runCli, setupCli } from "../lib/run.js";
import { serializeANSI } from "./__setup__/serialize.js";

// vi.mock("../src/core/import-meta-resolve.ts", () => ({
// 	importMetaResolve: vi.fn().mockImplementation((specifier) => `file://${createRequire(import.meta.url).resolve(specifier)}`)
// }));

test("asd", async () => {
	stdMocks.use();

	process.chdir(`/Users/nhle/dev/open/nadle/packages/nadle/test/__fixtures__/main`);
	const argv = await setupCli().parseAsync("hello --no-show-summary --stacktrace --log-level info");

	try {
		await runCli(argv);
	} catch (e) {
		const { stdout, stderr } = stdMocks.flush();
		stdMocks.restore();
		console.log(
			stdout
				.map((e) => (Buffer.isBuffer(e) ? e.toString() : e))
				.map(serializeANSI)
				.join("")
		);

		expect(
			stdout
				.map((e) => (Buffer.isBuffer(e) ? e.toString() : e))
				.map(serializeANSI)
				.join("")
		).toMatchInlineSnapshot(`
			[log] <Bold><Cyan>🛠️ Welcome to Nadle {version}!</Cyan></BoldDim>
			[log] <Dim>Loading configuration file from: /ROOT/nadle.config.ts</BoldDim>
			[log] <Dim>Using 9 workers for task execution</BoldDim>
			[log] 
			<Bold><Red>RUN FAILED</Red></BoldDim> in <Bold>{duration}</BoldDim> <Dim>(<Bold>0</BoldDim><Dim> task executed, <Bold>0</BoldDim><Dim> task failed)</BoldDim>
		`);
		expect(
			stderr
				.map((e) => (Buffer.isBuffer(e) ? e.toString() : e))
				.map(serializeANSI)
				.join("")
		).toMatchInlineSnapshot(`
			[error] Task <Yellow><Bold>hello</BoldDim></Yellow> not found.
			[error] Error: Task <Yellow><Bold>hello</BoldDim></Yellow> not found.
			    at /Users/nhle/dev/open/nadle/packages/nadle/src/core/nadle.ts:{line}:{column}
			    at {path}
			    at {path}
			    at {path}
			    at {path}
			    at /REPO_ROOT/basic-new.test.ts:{line}:{column}
			    at file:///Users/nhle/dev/open/nadle/node_modules/.pnpm/@vitest+runner{version}/node_modules/@vitest/runner/dist/index.js:{line}:{column}
		`);
	}
});
