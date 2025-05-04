import { tasks } from "../../lib/index.js";

tasks.register("node", () => {
	console.log("Setup node...");
});

tasks
	.register("install", () => {
		console.log("Installing npm...");
	})
	.meta((ctx) => {
		ctx.configure({ meta: { dependsOn: ["node"] } });
	});

tasks
	.register("compileTs", () => {
		console.log("Compiling ts...");
	})
	.meta((ctx) => {
		ctx.configure({ meta: { dependsOn: ["install"] } });
	});

tasks
	.register("compileSvg", () => {
		console.log("Compiling svg...");
	})
	.meta((ctx) => {
		ctx.configure({ meta: { dependsOn: ["install"] } });
	});

tasks
	.register("compile", () => {
		console.log("Compiling...");
	})
	.meta((ctx) => {
		ctx.configure({ meta: { dependsOn: ["compileSvg", "compileTs"] } });
	});

tasks
	.register("test", () => {
		console.log("Running tests...");
	})
	.meta((ctx) => {
		ctx.configure({ meta: { dependsOn: ["install"] } });
	});

tasks
	.register("build", () => {
		console.log("Building...");
	})
	.meta((ctx) => {
		ctx.configure({ meta: { dependsOn: ["test", "compile"] } });
	});
