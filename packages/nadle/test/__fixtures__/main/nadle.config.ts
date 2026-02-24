import { tasks, type Task } from "nadle";

tasks
	.register("hello", async () => {
		await new Promise((r) => setTimeout(r, 100));
	})
	.config({ group: "Greetings", description: "Say hello to nadle!" });

tasks.register("goodbye").config({ group: "Greetings", description: "Say goodbye to nadle!" });

interface CopyOptions {
	to: string;
	from: string;
}

const CopyTask: Task<CopyOptions> = {
	run: () => {}
};
tasks.register("copy", CopyTask, { to: "dist/", from: "assets/" }).config({
	group: "Utils",
	dependsOn: ["hello", "prepare"]
});

tasks.register("prepare", async () => {
	await new Promise((r) => setTimeout(r, 2000));
});

tasks
	.register("throwable", () => {
		throw new Error("This is an error");
	})
	.config({ dependsOn: ["prepare", "hello"] });
