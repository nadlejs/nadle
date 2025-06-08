import { Nadle } from "./core/index.js";
import { resolveCLIOptions } from "./core/options/shared.js";

export async function runCli(argv: any) {
	await new Nadle(resolveCLIOptions(argv)).execute((argv as any).tasks ?? []);
}
