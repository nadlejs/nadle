/**
 * Error class for Nadle with a typed exit code.
 *
 * @public
 */
export class NadleError extends Error {
	/**
	 * The process exit code to use when this error is caught at the top level.
	 */
	public readonly errorCode: number;

	public constructor(message: string, errorCode: number = 1) {
		super(message);
		this.name = "NadleError";
		this.errorCode = errorCode;
	}
}
