import { tasks } from "../../node_modules/nadle/lib/index.js";

tasks.register("build").config({
	group: "Building",
	dependsOn: ["root:compile"],
	description: "Compile eslint-plugin (delegates to root compile)"
});
