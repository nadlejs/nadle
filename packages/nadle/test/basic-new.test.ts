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
			[info] Initialized logger with consola options: { types:
			   { silent: { level: -1 },
			     fatal: { level: 0 },
			     error: { level: 0 },
			     warn: { level: 1 },
			     log: { level: 2 },
			     info: { level: 3 },
			     success: { level: 3 },
			     fail: { level: 3 },
			     ready: { level: 3 },
			     start: { level: 3 },
			     box: { level: 3 },
			     debug: { level: 4 },
			     trace: { level: 5 },
			     verbose: { level: Infinity } },
			  throttle: 1000,
			  throttleMin: 5,
			  formatOptions: { date: false, colors: false, compact: true },
			  level: 3,
			  defaults: { level: 1 },
			  prompt: [Function: prompt],
			  reporters: [ BasicReporter {} ] }
			[log] <Bold><Cyan>🛠️ Welcome to Nadle {version}!</Cyan></BoldDim>
			[log] <Dim>Loading configuration file from: /Users/nhle/dev/open/nadle/packages/nadle/test/__fixtures__/main/nadle.config.ts</BoldDim>
			[log] <Dim>Using 9 workers for task execution</BoldDim>
			[info] Resolved options: { sequence: false,
			  logLevel: 'info',
			  showConfig: false,
			  showSummary: false,
			  isWorkerThread: false,
			  stacktrace: true,
			  minWorkers: 9,
			  maxWorkers: 9,
			  list: false,
			  dryRun: false,
			  configPath:
			   '/Users/nhle/dev/open/nadle/packages/nadle/test/__fixtures__/main/nadle.config.ts' }
			[info] Detected environments: { CI: false, TEST: true }
			[info] Detected tasks: 
			[info] Execution failed
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
			    at /Users/nhle/dev/open/nadle/packages/nadle/src/core/nadle.ts:144:11
			    at Array.map (<anonymous>)
			    at Nadle.resolveTasks (/Users/nhle/dev/open/nadle/packages/nadle/src/core/nadle.ts:138:31)
			    at Nadle.execute (/Users/nhle/dev/open/nadle/packages/nadle/src/core/nadle.ts:42:31)
			    at runCli (/Users/nhle/dev/open/nadle/packages/nadle/src/run.ts:40:2)
			    at /Users/nhle/dev/open/nadle/packages/nadle/test/basic-new.test.ts:18:3
			    at file:///Users/nhle/dev/open/nadle/node_modules/.pnpm/@vitest+runner{version}/node_modules/@vitest/runner/dist/index.js:596:20
		`);
	}
});
