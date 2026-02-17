import { tasks, ExecTask, PnpmTask, DeleteTask, Inputs, Outputs } from "nadle";

// No-op form (1 arg)
tasks.register("clean-cache");

// Typed form (3 args) with full config
tasks.register("compile", ExecTask, { command: "tsc", args: ["--build"] }).config({
	description: "Compile TypeScript",
	group: "build",
	inputs: [Inputs.files("src/**/*.ts", "tsconfig.json")],
	outputs: [Outputs.dirs("lib")]
});

// Function form (2 args)
tasks.register("deploy", async ({ context }) => {
	context.logger.info("Deploying...");
});

// Typed form with dependsOn
tasks.register("lint", PnpmTask, { args: ["-r", "exec", "eslint", "."] });

// No-op with dependsOn chain
tasks.register("build").config({
	dependsOn: ["compile", "lint"],
	description: "Run full build"
});

// Typed form with single dependsOn string
tasks.register("release", ExecTask, { command: "npm", args: ["publish"] }).config({
	dependsOn: "build",
	group: "publish"
});

// Delete task
tasks.register("clean", DeleteTask, { paths: ["lib/**", "build/**"] });
