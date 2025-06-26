import { tasks, configure } from "nadle";

configure({
	logLevel: "debug"
});

tasks
	.register("hello", async () => {
		console.log("Hello from Nadle!");
	})
	.config({ group: "Greetings", description: "Say hello" });

tasks
	.register("goodbye", () => {
		console.log("Goodbye, Nadle!");
	})
	.config({ group: "Greetings", dependsOn: ["hello"], description: "Say goodbye" });
