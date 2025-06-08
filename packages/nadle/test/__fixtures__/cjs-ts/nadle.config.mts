import { fileURLToPath } from "node:url";

import { tasks } from "nadle";

tasks.register("hello-cjs-ts", () => {
	console.log(`Hello from ${fileURLToPath(import.meta.url)}!`);
});
