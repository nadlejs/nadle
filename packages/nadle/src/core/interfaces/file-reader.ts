export interface FileReader {
	read(filePath: string): Promise<void>;
}
