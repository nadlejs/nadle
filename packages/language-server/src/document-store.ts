import { analyzeDocument } from "./analyzer.js";
import type { DocumentAnalysis } from "./analyzer.js";

export class DocumentStore {
	private readonly openDocuments = new Map<string, DocumentAnalysis>();
	private readonly projectDocuments = new Map<string, DocumentAnalysis>();

	public getAnalysis(uri: string): DocumentAnalysis | undefined {
		return this.openDocuments.get(uri) ?? this.projectDocuments.get(uri);
	}

	public updateDocument(uri: string, version: number, content: string, fileName: string): DocumentAnalysis {
		const analysis = analyzeDocument(content, fileName);
		const result: DocumentAnalysis = { ...analysis, uri, version };
		this.openDocuments.set(uri, result);

		return result;
	}

	public updateProjectDocument(uri: string, version: number, content: string, fileName: string): DocumentAnalysis {
		const analysis = analyzeDocument(content, fileName);
		const result: DocumentAnalysis = { ...analysis, uri, version };
		this.projectDocuments.set(uri, result);

		return result;
	}

	public getAllAnalyses(): DocumentAnalysis[] {
		const merged = new Map(this.projectDocuments);

		for (const [uri, analysis] of this.openDocuments) {
			merged.set(uri, analysis);
		}

		return [...merged.values()];
	}

	public removeDocument(uri: string): void {
		this.openDocuments.delete(uri);
	}

	public clearProjectDocuments(): void {
		this.projectDocuments.clear();
	}
}
