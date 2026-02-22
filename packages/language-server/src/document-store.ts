import { analyzeDocument } from "./analyzer.js";
import type { DocumentAnalysis } from "./analyzer.js";

export class DocumentStore {
	private readonly cache = new Map<string, DocumentAnalysis>();

	public getAnalysis(uri: string): DocumentAnalysis | undefined {
		return this.cache.get(uri);
	}

	public updateDocument(uri: string, version: number, content: string, fileName: string): DocumentAnalysis {
		const analysis = analyzeDocument(content, fileName);
		const result: DocumentAnalysis = { ...analysis, uri, version };
		this.cache.set(uri, result);

		return result;
	}

	public getAllAnalyses(): DocumentAnalysis[] {
		return [...this.cache.values()];
	}

	public removeDocument(uri: string): void {
		this.cache.delete(uri);
	}
}
