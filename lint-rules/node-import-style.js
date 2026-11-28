// oxlint has no `no-restricted-syntax`, so the 'node:' import style is enforced by this small plugin.
const NODE_PROTOCOL = /^node:/;

const nodeImportStyle = {
	meta: { type: "problem" },
	create(context) {
		return {
			ImportDeclaration(node) {
				if (!NODE_PROTOCOL.test(node.source.value)) {
					return;
				}

				for (const specifier of node.specifiers) {
					if (specifier.type !== "ImportDefaultSpecifier") {
						context.report({ node: specifier, message: "Only default imports are allowed from 'node:' modules." });
					} else if (/^[a-z]/.test(specifier.local.name)) {
						context.report({ node: specifier, message: "Default imports from 'node:' modules must use PascalCase." });
					}
				}
			}
		};
	}
};

export default {
	meta: { name: "local" },
	rules: { "node-import-style": nodeImportStyle }
};
