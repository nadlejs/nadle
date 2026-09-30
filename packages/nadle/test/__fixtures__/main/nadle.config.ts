import { tasks, type Task } from "nadle";

tasks.register("hello", {
	group: "Greetings",
	description: "Say hello to nadle!",
	run: async () => {
		await new Promise((r) => setTimeout(r, 100));
	}
});

tasks.register("goodbye", { group: "Greetings", description: "Say goodbye to nadle!" });

interface CopyOptions {
	to: string;
	from: string;
}

const CopyTask: Task<CopyOptions> = {
	run: () => {}
};
tasks.register("copy", { run: CopyTask, group: "Utils", dependsOn: ["hello", "prepare"], options: { to: "dist/", from: "assets/" } });

tasks.register("prepare", async () => {
	await new Promise((r) => setTimeout(r, 2000));
});

tasks.register("throwable", {
	dependsOn: ["prepare", "hello"],
	run: () => {
		throw new Error("This is an error");
	}
});
