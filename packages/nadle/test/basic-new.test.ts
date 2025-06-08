import stdMocks from "std-mocks";
import { test, expect } from "vitest";

import { runCli, setupCli } from "../lib/cli.js";
import { serializeANSI } from "./__setup__/serialize.js";

test("asd", async () => {
	stdMocks.use();

	process.chdir(`/Users/nhle/dev/open/nadle/packages/nadle/test/__fixtures__/main`);

	const argv = await setupCli().parseAsync("hello --no-show-summary --stacktrace");
	await runCli(argv);

	const { stdout } = stdMocks.flush();
	stdMocks.restore();

	expect(
		stdout
			.map((e) => (Buffer.isBuffer(e) ? e.toString() : e))
			.map(serializeANSI)
			.join("")
	).toMatchInlineSnapshot(`
		[log] <Bold><Cyan>🛠️ Welcome to Nadle {version}!</Cyan></BoldDim>
		[log] <Dim>Loading configuration file from: /Users/nhle/dev/open/nadle/packages/nadle/test/__fixtures__/main/nadle.config.ts</BoldDim>
		[log] <Dim>Using 9 workers for task execution</BoldDim>
		[log] <Yellow>></Yellow> Task <Bold>hello</BoldDim> started

		Hello from nadle!
		[log] 
		<Green>✓</Green> Task <Bold>hello</BoldDim> done in {duration}
		[log] 
		<Bold><Green>RUN SUCCESSFUL</Green></BoldDim> in <Bold>{duration}</BoldDim> <Dim>(<Bold>1</BoldDim><Dim> task executed)</BoldDim>
	`);
});
