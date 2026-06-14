import { tasks } from "nadle";

tasks.register("node");

tasks.register("install", { dependsOn: ["node"] });

tasks.register("compileTs", { dependsOn: ["install"] });

tasks.register("compileSvg", { dependsOn: ["install"] });

tasks.register("compile", { dependsOn: ["compileSvg", "compileTs"] });

tasks.register("test", { dependsOn: ["install"] });

tasks.register("build", { dependsOn: ["test", "compile"] });

tasks.register("base");
tasks.register("fast", {
	run: async () => {
		await new Promise((r) => setTimeout(r, 1000));
	},
	dependsOn: ["base"]
});
tasks.register("slow", {
	run: async () => {
		await new Promise((r) => setTimeout(r, 2000));
	},
	dependsOn: ["base"]
});

tasks.register("keyed", {
	run: () => console.log("keyed ran"),
	group: "New",
	description: "keyed-spec task"
});
