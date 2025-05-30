import "vitest";

interface CustomMatchers<R = unknown> {
	toRunInOrder: (...taskGroups: (string[] | string)[]) => R;
}

declare module "vitest" {
	interface Assertion<T = any> extends CustomMatchers<T> {}
	interface AsymmetricMatchersContaining extends CustomMatchers {}
}
