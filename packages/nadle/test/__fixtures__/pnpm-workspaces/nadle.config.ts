import { tasks } from "nadle";

tasks.register("check", () => {
	console.log("Check project successfully!");
});

tasks
	.register("build", () => {
		console.log("Build project successfully!");
	})
	.config({ dependsOn: ["check", "shared:types:build"] });
