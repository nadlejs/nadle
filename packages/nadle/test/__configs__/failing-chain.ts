import { tasks } from "nadle";

tasks.register("flaky", () => {
	throw new Error("boom");
});

tasks.register("after").config({ dependsOn: ["flaky"] });

tasks.register("alsoAfter").config({ dependsOn: ["flaky"] });
