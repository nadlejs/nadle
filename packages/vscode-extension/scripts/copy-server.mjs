import Url from "node:url";
import Path from "node:path";
import Fs from "node:fs/promises";

const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));
const serverDir = Path.resolve(__dirname, "..", "server");
const lspLib = Path.resolve(__dirname, "..", "..", "language-server", "lib");

await Fs.mkdir(serverDir, { recursive: true });

for (const file of await Fs.readdir(lspLib)) {
	// Chunk names follow the bundler, so take every module except the library entry.
	if (file.endsWith(".js") && file !== "index.js") {
		await Fs.copyFile(Path.join(lspLib, file), Path.join(serverDir, file));
	}
}

await Fs.writeFile(Path.join(serverDir, "package.json"), JSON.stringify({ type: "module" }));
