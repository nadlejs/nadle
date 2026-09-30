import { tasks } from "nadle";

tasks.register("base", () => {
	console.log("BASE RAN");
});

tasks.register("failing", () => {
	throw new Error("boom");
});

tasks.register("secondFailing", () => {
	throw new Error("bang");
});

tasks.register("independent", () => {
	console.log("INDEPENDENT RAN");
});

// Diamond: join depends on both branches; only one branch fails.
tasks.register("goodBranch", { dependsOn: ["base"] });
tasks.register("badBranch", { dependsOn: ["base", "failing"] });
tasks.register("join", { dependsOn: ["goodBranch", "badBranch"] });

// Chain: farDownstream is blocked only via nearDownstream, which itself never failed.
tasks.register("nearDownstream", { dependsOn: ["failing"] });
tasks.register("farDownstream", { dependsOn: ["nearDownstream"] });

// Two independent gates, for sequential main-task advance.
tasks.register("gateA", { dependsOn: ["failing"] });
tasks.register("gateB", { dependsOn: ["independent"] });
