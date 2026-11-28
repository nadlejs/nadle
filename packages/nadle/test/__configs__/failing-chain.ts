import { tasks } from "nadle";

tasks.register("flaky", () => {
	throw new Error("boom");
});

tasks.register("after", { dependsOn: ["flaky"] });

tasks.register("alsoAfter", { dependsOn: ["flaky"] });

tasks.register("independent", () => {
	console.log("INDEPENDENT RAN");
});

tasks.register("gate", { dependsOn: ["flaky", "independent"] });
