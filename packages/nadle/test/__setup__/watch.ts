import stripAnsi from "strip-ansi";
import { type ResultPromise } from "execa";

/**
 * Drive a long-lived `--watch` process: wait until `marker` appears in stdout
 * (resolving the accumulated output since the last wait), so a test can assert,
 * mutate a file, and wait again.
 */
export function watchSession(child: ResultPromise) {
	let buffer = "";
	const append = (chunk: Buffer) => (buffer += stripAnsi(chunk.toString()));
	child.stdout?.on("data", append);
	child.stderr?.on("data", append);

	async function waitFor(marker: string, timeoutMs = 15000): Promise<string> {
		const start = Date.now();

		while (Date.now() - start < timeoutMs) {
			if (buffer.includes(marker)) {
				const seen = buffer;
				buffer = "";

				return seen;
			}

			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		throw new Error(`Timed out waiting for "${marker}". Saw:\n${buffer}`);
	}

	async function stop(): Promise<number> {
		child.kill("SIGINT");

		try {
			const result = await child;

			return result.exitCode ?? 0;
		} catch (error) {
			return (error as { exitCode?: number }).exitCode ?? 1;
		}
	}

	return { stop, waitFor };
}
