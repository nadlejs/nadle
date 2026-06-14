import { tasks, type Task } from "nadle";

tasks.register("hello", { run: async () => {
		await new Promise((r) => setTimeout(r, 100));
	}, group: "Greetings", description: "Say hello to nadle!" });

tasks.register("goodbye", { group: "Greetings", description: "Say goodbye to nadle!" });

interface CopyOptions {
	to: string;
	from: string;
}

const CopyTask: Task<CopyOptions> = {
	run: () => {}
};
tasks.register("copy", { run: CopyTask, options: { to: "dist/", from: "assets/" }, group: "Utils",
	dependsOn: ["hello", "prepare"] });

tasks.register("prepare", async () => {
	await new Promise((r) => setTimeout(r, 2000));
});

tasks.register("throwable", { run: () => {
		throw new Error("This is an error");
	}, dependsOn: ["prepare", "hello"] });
