import { fileURLToPath } from "node:url";

import { tasks } from "nadle";

tasks.register("hello-mixed-ts-mts", () => {
	console.log(`Hello from ${fileURLToPath(import.meta.url)}!`);
});
