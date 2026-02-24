import { it, expect, describe } from "vitest";
import { DocumentStore } from "src/document-store.js";

const SIMPLE_CONFIG = `
import { tasks, ExecTask } from "nadle";
tasks.register("build", ExecTask, { command: "tsc" });
`;

describe("DocumentStore", () => {
	describe("two-tier merge", () => {
		it("returns project document when no open document exists", () => {
			const store = new DocumentStore();
			store.updateProjectDocument("file:///a.ts", 0, SIMPLE_CONFIG, "a.ts");

			const analysis = store.getAnalysis("file:///a.ts");
			expect(analysis).toBeDefined();
			expect(analysis!.taskNames.has("build")).toBe(true);
		});

		it("returns open document over project document for same URI", () => {
			const store = new DocumentStore();
			store.updateProjectDocument("file:///a.ts", 0, SIMPLE_CONFIG, "a.ts");

			const updatedConfig = `
import { tasks, ExecTask } from "nadle";
tasks.register("test", ExecTask, { command: "vitest" });
`;
			store.updateDocument("file:///a.ts", 1, updatedConfig, "a.ts");

			const analysis = store.getAnalysis("file:///a.ts");
			expect(analysis).toBeDefined();
			expect(analysis!.taskNames.has("test")).toBe(true);
			expect(analysis!.taskNames.has("build")).toBe(false);
		});

		it("falls back to project document after open document is removed", () => {
			const store = new DocumentStore();
			store.updateProjectDocument("file:///a.ts", 0, SIMPLE_CONFIG, "a.ts");

			const updatedConfig = `
import { tasks, ExecTask } from "nadle";
tasks.register("test", ExecTask, { command: "vitest" });
`;
			store.updateDocument("file:///a.ts", 1, updatedConfig, "a.ts");
			store.removeDocument("file:///a.ts");

			const analysis = store.getAnalysis("file:///a.ts");
			expect(analysis).toBeDefined();
			expect(analysis!.taskNames.has("build")).toBe(true);
		});
	});

	describe("getAllAnalyses", () => {
		it("merges open and project documents with open taking priority", () => {
			const store = new DocumentStore();
			store.updateProjectDocument("file:///a.ts", 0, SIMPLE_CONFIG, "a.ts");

			const otherConfig = `
import { tasks } from "nadle";
tasks.register("lint");
`;
			store.updateProjectDocument("file:///b.ts", 0, otherConfig, "b.ts");

			const updatedConfig = `
import { tasks, ExecTask } from "nadle";
tasks.register("test", ExecTask, { command: "vitest" });
`;
			store.updateDocument("file:///a.ts", 1, updatedConfig, "a.ts");

			const all = store.getAllAnalyses();
			expect(all).toHaveLength(2);

			const aAnalysis = all.find((a) => a.uri === "file:///a.ts");
			expect(aAnalysis!.taskNames.has("test")).toBe(true);
			expect(aAnalysis!.taskNames.has("build")).toBe(false);

			const bAnalysis = all.find((a) => a.uri === "file:///b.ts");
			expect(bAnalysis!.taskNames.has("lint")).toBe(true);
		});
	});

	describe("clearProjectDocuments", () => {
		it("clears all project documents but preserves open documents", () => {
			const store = new DocumentStore();
			store.updateProjectDocument("file:///a.ts", 0, SIMPLE_CONFIG, "a.ts");
			store.updateDocument("file:///b.ts", 1, SIMPLE_CONFIG, "b.ts");

			store.clearProjectDocuments();

			expect(store.getAnalysis("file:///a.ts")).toBeUndefined();
			expect(store.getAnalysis("file:///b.ts")).toBeDefined();
		});
	});
});
