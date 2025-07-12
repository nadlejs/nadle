import { tasks, configure } from "nadle";

configure({
	alias: (workspacePath) => {
		if (workspacePath === "shared/api") {
			return "api";
		}
	}
});

tasks.register("check", () => {
	console.log("Check project successfully!");
});

tasks
	.register("build", () => {
		console.log("Build project successfully!");
	})
	.config({ dependsOn: ["check", "shared:types:build"] });

tasks.register("deploy", () => {
	console.log("Deploy project successfully!");
});
