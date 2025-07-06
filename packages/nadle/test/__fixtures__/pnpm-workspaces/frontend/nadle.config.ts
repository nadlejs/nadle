import { tasks } from "nadle";

tasks.register("check", () => {
	console.log("Check frontend successfully!");
});

tasks
	.register("build", () => {
		console.log("Build frontend successfully!");
	})
	.config({ dependsOn: ["check", "api:check", "shared:types:check"] });
