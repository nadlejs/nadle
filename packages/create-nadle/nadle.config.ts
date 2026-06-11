import { tasks } from "../../node_modules/nadle/lib/index.js";

tasks.register("build").config({
	group: "Building",
	dependsOn: ["root:compile"],
	description: "Compile create-nadle (delegates to root compile)"
});
