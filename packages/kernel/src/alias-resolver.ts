export type AliasOption = Record<string, string> | ((workspacePath: string) => string | undefined) | undefined;

export function createAliasResolver(aliasOption: AliasOption): (workspacePath: string) => string | undefined {
	if (aliasOption === undefined) {
		return () => undefined;
	}

	if (typeof aliasOption === "function") {
		return aliasOption;
	}

	return (workspacePath) => aliasOption[workspacePath];
}
