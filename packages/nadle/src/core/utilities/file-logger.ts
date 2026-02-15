interface LogItem {
	args: unknown[];
	subspace: string;
	namespace: string;
}

const logItems: LogItem[] = [];

export class FileLogger {
	public constructor(
		public namespace: string,
		public options?: { silent?: boolean }
	) {}

	public log(subspace: string, ...args: unknown[]): void {
		if (!this.options?.silent) {
			logItems.push({ args, subspace, namespace: this.namespace });
		}
	}
}
