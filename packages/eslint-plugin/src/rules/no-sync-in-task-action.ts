import { ESLintUtils } from "@typescript-eslint/utils";
import { type TSESTree } from "@typescript-eslint/utils";

import { isInTaskAction } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/nadlejs/nadle/blob/main/packages/eslint-plugin/docs/rules/${name}.md`);

const SYNC_FS_APIS = new Set([
	"readFileSync",
	"writeFileSync",
	"mkdirSync",
	"readdirSync",
	"statSync",
	"existsSync",
	"copyFileSync",
	"renameSync",
	"unlinkSync",
	"rmdirSync",
	"rmSync",
	"accessSync",
	"chmodSync",
	"chownSync",
	"linkSync",
	"lstatSync",
	"realpathSync",
	"appendFileSync"
]);

const SYNC_CHILD_PROCESS_APIS = new Set(["execSync", "spawnSync", "execFileSync"]);

const ALL_SYNC_APIS = new Set([...SYNC_FS_APIS, ...SYNC_CHILD_PROCESS_APIS]);

/** Extract the called function name from a CallExpression callee. */
function getCalledName(callee: TSESTree.CallExpression["callee"]): string | undefined {
	// Direct call: readFileSync(...)
	if (callee.type === "Identifier") {
		return callee.name;
	}

	// Member call: fs.readFileSync(...)
	if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
		return callee.property.name;
	}

	return undefined;
}

export default createRule({
	name: "no-sync-in-task-action",
	meta: {
		schema: [],
		defaultOptions: [],
		type: "suggestion",
		docs: {
			description: "Disallow synchronous APIs in task actions"
		},
		messages: {
			noSync: "Avoid '{{name}}' in task actions. Use the async equivalent instead."
		}
	},
	create(context) {
		return {
			CallExpression(node) {
				const name = getCalledName(node.callee);

				if (!name || !ALL_SYNC_APIS.has(name)) {
					return;
				}

				if (!isInTaskAction(node)) {
					return;
				}

				context.report({ node, data: { name }, messageId: "noSync" });
			}
		};
	}
});
