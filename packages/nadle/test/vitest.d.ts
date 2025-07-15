import "vitest";

interface CustomMatchers<R = unknown> {
	toRun: (taskName: string) => R;
	toThrowPlainMessage: (expected: string) => R;
	toRunInOrder: (...tasks: (string[] | string)[]) => R;
	toDoneInOrder: (...taskGroups: (string | string)[]) => R;
	toSettle: (taskName: string, status: "done" | "up-to-date" | "from-cache" | "failed") => R;
}

declare module "vitest" {
	interface Assertion<T = any> extends CustomMatchers<T> {}
}
