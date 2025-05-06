import { tasks } from "../../lib/index.js";

tasks.register("node", () => {
	console.log("Setup node...");
});

tasks
	.register("install", () => {
		console.log("Installing npm...");
	})
	.config({ dependsOn: ["node"] });

tasks
	.register("compileTs", () => {
		console.log("Compiling ts...");
	})
	.config({ dependsOn: ["install"] });

tasks
	.register("compileSvg", () => {
		console.log("Compiling svg...");
	})
	.config({ dependsOn: ["install"] });

tasks
	.register("compile", () => {
		console.log("Compiling...");
	})
	.config({ dependsOn: ["compileSvg", "compileTs"] });

tasks
	.register("test", () => {
		console.log("Running tests...");
	})
	.config({ dependsOn: ["install"] });

tasks
	.register("build", () => {
		console.log("Building...");
	})
	.config({ dependsOn: ["test", "compile"] });
