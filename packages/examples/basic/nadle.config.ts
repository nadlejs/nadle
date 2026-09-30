import { tasks, configure } from "nadle";

configure({
	logLevel: "debug"
});

tasks.register("hello", {
	group: "Greetings",
	description: "Say hello",
	run: async () => {
		console.log("Hello from Nadle!");
	}
});

tasks.register("goodbye", {
	group: "Greetings",
	dependsOn: ["hello"],
	description: "Say goodbye",
	run: () => {
		console.log("Goodbye, Nadle!");
	}
});
