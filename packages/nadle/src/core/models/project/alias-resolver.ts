import { createAliasResolver } from "@nadle/kernel";

import type { AliasOption } from "../../options/index.js";

type AliasResolver = (workspacePath: string) => string | undefined;

export namespace AliasResolver {
	export function create(aliasOption: AliasOption | undefined): AliasResolver {
		return createAliasResolver(aliasOption);
	}
}
