import { tasks } from "nadle";

tasks.register("hello", () => {
	console.log(`Hello from ${import.meta.dirname}!`);
});
