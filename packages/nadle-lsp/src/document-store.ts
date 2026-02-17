import { analyzeDocument } from "./analyzer.js";
import type { DocumentAnalysis } from "./analyzer.js";

export class DocumentStore {
	private readonly cache = new Map<string, DocumentAnalysis>();

	getAnalysis(uri: string): DocumentAnalysis | undefined {
		return this.cache.get(uri);
	}

	updateDocument(uri: string, version: number, content: string, fileName: string): DocumentAnalysis {
		const analysis = analyzeDocument(content, fileName);
		const result: DocumentAnalysis = { ...analysis, uri, version };
		this.cache.set(uri, result);
		return result;
	}

	removeDocument(uri: string): void {
		this.cache.delete(uri);
	}
}
