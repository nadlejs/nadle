import { tasks } from "./lib/index.js";

tasks
	.register("hello", async () => {
		await new Promise((r) => setTimeout(r, 100));
		console.log("Hello from nadle!");
	})
	.config({ group: "Greetings", description: "Say hello to nadle!" });
