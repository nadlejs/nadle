// @ts-nocheck -- LSP fixture; analyzed as AST, not compiled
import { tasks, Inputs, Outputs, ExecTask, PnpmTask, DeleteTask } from "nadle";

// No-op form (1 arg)
tasks.register("clean-cache");

// Typed form (keyed spec, run: Task) with full config
tasks.register("compile", {
	run: ExecTask,
	group: "build",
	outputs: [Outputs.dirs("lib")],
	description: "Compile TypeScript",
	options: { command: "tsc", args: ["--build"] },
	inputs: [Inputs.files("src/**/*.ts", "tsconfig.json")]
});

// Function form (keyed spec, run: function)
tasks.register("deploy", {
	run: async ({ context }) => {
		context.logger.info("Deploying...");
	}
});

// Typed form without config (keyed spec, run: Task, options only)
tasks.register("lint", { run: PnpmTask, options: { args: ["-r", "exec", "eslint", "."] } });

// No-op with dependsOn chain (config-only aggregator, no run)
tasks.register("build", {
	description: "Run full build",
	dependsOn: ["compile", "lint"]
});

// Typed form with single dependsOn string
tasks.register("release", {
	run: ExecTask,
	group: "publish",
	dependsOn: "build",
	options: { command: "npm", args: ["publish"] }
});

// Delete task
tasks.register("clean", { run: DeleteTask, options: { paths: ["lib/**", "build/**"] } });
