export class NadleError extends Error {
	public constructor(
		message: string,
		public readonly errorCode: number = 1
	) {
		super(message);
		this.name = "NadleError";
	}
}
