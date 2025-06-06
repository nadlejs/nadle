import { tasks } from "nadle";
import { fileURLToPath } from "node:url";

tasks.register("hello", () => {
	console.log(`Hello from ${fileURLToPath(import.meta.url)}!`);
});
