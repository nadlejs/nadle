import { tasks, type TaskFn } from "nadle";

tasks.register("hello", async () => {
	await new Promise((r) => setTimeout(r, 300));
	console.log("Hello from nadle!");
});

tasks
	.register("goodbye", () => {
		console.log("Goodbye, tak!");
	})
	.meta((context) => {
		context.configure({ meta: { dependsOn: ["hello"] } });
	});

function copyTask(): TaskFn {
	return async (context) => {
		const { to, from } = context.options;
		console.log(`Copying from ${from} to ${to}`);
	};
}

tasks.register("copy", copyTask()).meta((context) => {
	context.configure({
		meta: {
			dependsOn: ["prepare"]
		},
		options: {
			to: "dist/",
			from: "assets/"
		}
	});
});

tasks.register("prepare", async () => {
	console.log("Preparing...");
});

tasks.register("node", async () => {
	console.log("Setup node...");
});

tasks
	.register("install", async () => {
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
		ctx.configure({ meta: { dependsOn: ["compile"] } });
	});

tasks
	.register("build", () => {
		console.log("Building...");
	})
	.meta((ctx) => {
		ctx.configure({ meta: { dependsOn: ["test", "compile"] } });
	});
