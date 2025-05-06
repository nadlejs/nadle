import { tasks } from "../../lib/index.js";

tasks.register("hello", () => {
	console.log("Hi there!");
});

tasks.register("hello", () => {
	console.log("hello");
});
