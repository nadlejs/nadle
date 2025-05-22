import { tasks } from "nadle";

tasks.register("hello", () => {
	console.log("Hi there!");
});

tasks.register("hello", () => {
	console.log("hello");
});
