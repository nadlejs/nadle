import { tasks, configure } from "nadle";

configure({
	alias: (workspacePath) => {
		if (workspacePath === "shared/api") {
			return "api";
		}
	}
});

tasks.register("check");

tasks.register("build").config({ dependsOn: ["check", "shared:types:build"] });

tasks.register("deploy");
