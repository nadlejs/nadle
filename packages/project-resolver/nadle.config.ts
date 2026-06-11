import { tasks } from "../../node_modules/nadle/lib/index.js";

tasks.register("build").config({
	group: "Building",
	dependsOn: ["root:compile"],
	description: "Compile project package (delegates to root compile)"
});
