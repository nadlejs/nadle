import { tasks } from "nadle";

tasks.register("check", () => {
	console.log("Check API successfully!");
});

tasks
	.register("build", () => {
		console.log("Build API successfully!");
	})
	.config({ dependsOn: ["check"] });
