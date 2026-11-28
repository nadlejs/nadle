import Path from "node:path";
import ChildProcess from "node:child_process";

import { it, expect, describe } from "vite-plus/test";

const SERVER_PATH = Path.resolve(import.meta.dirname, "..", "lib", "server.js");

function frame(message: object): string {
	const body = JSON.stringify(message);

	return `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
}

describe("built server", () => {
	it("answers initialize over stdio", async () => {
		const server = ChildProcess.spawn(process.execPath, [SERVER_PATH, "--stdio"], { stdio: "pipe" });

		const reply = new Promise<string>((resolve, reject) => {
			let stdout = "";
			let stderr = "";

			server.stderr.on("data", (chunk) => (stderr += chunk));
			server.stdout.on("data", (chunk) => {
				stdout += chunk;

				if (stdout.includes('"id":1')) {
					resolve(stdout);
				}
			});
			server.on("exit", (code) => reject(new Error(`server exited with code ${code}: ${stderr}`)));
		});

		server.stdin.write(frame({ id: 1, jsonrpc: "2.0", method: "initialize", params: { rootUri: null, processId: null, capabilities: {} } }));

		try {
			await expect(reply).resolves.toContain('"capabilities"');
		} finally {
			server.kill();
		}
	});
});
