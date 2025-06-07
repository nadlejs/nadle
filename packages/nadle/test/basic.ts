import stdMocks from "std-mocks";

import { runCli, setupCli } from "../lib/run.js";
import { serializeANSI } from "./__setup__/serialize.js";

stdMocks.use();

process.chdir(`/Users/nhle/dev/open/nadle/packages/nadle/test/__fixtures__/main`);
const argv = await setupCli().parseAsync("hello --no-show-summary");
await runCli(argv);

const { stdout } = stdMocks.flush();
stdMocks.restore();
console.log(
	stdout
		.map((e) => (Buffer.isBuffer(e) ? e.toString() : e))
		.map(serializeANSI)
		.join("")
);
