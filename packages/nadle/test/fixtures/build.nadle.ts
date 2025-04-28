import { task } from "../../lib/index.js";

task("hello", async () => {
	await new Promise((r) => setTimeout(r, 300));
	console.log("Hello from nadle!");
});

task("goodbye", () => {
	console.log("Goodbye, tak!");
});
