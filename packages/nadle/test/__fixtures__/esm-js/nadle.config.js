import Url from "node:url";

import { tasks } from "nadle";

tasks.register("hello", () => {
	console.log(`Hello from ${Url.fileURLToPath(import.meta.url)}!`);
});
