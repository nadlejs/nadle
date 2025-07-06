import URL from "node:url";

import { tasks } from "nadle";

tasks.register("hello", () => {
	console.log(`Hello from ${URL.fileURLToPath(import.meta.url)}!`);
});
