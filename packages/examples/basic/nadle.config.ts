import { tasks, configure } from "nadle";

configure({
	logLevel: "debug"
});

tasks.register("hello", { run: async () => {
		console.log("Hello from Nadle!");
	}, group: "Greetings", description: "Say hello" });

tasks.register("goodbye", { run: () => {
		console.log("Goodbye, Nadle!");
	}, group: "Greetings", dependsOn: ["hello"], description: "Say goodbye" });
