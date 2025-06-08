import { fileURLToPath } from "node:url";

import { tasks } from "nadle";

tasks.register("hello-esm-ts", () => {
	console.log(`Hello from ${fileURLToPath(import.meta.url)}!`);
});
