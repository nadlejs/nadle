import type { DocumentAnalysis } from "./analyzer.js";
import type { ProjectContext } from "./project-context.js";

export interface LspContext {
	readonly allAnalyses: DocumentAnalysis[];
	readonly projectContext: ProjectContext | null;
}
