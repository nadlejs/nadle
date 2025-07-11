import type { AliasOption } from "../../options/index.js";

type AliasResolver = (workspacePath: string) => string | undefined;

export namespace AliasResolver {
	export function create(aliasOption: AliasOption | undefined): AliasResolver {
		if (aliasOption === undefined) {
			return () => undefined;
		}

		if (typeof aliasOption === "function") {
			return aliasOption;
		}

		return (workspacePath) => aliasOption[workspacePath];
	}
}
