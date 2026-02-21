import type { TSESLint } from "@typescript-eslint/utils";

import noProcessCwd from "./rules/no-process-cwd.js";
import validTaskName from "./rules/valid-task-name.js";
import validDependsOn from "./rules/valid-depends-on.js";
import noAnonymousTasks from "./rules/no-anonymous-tasks.js";
import preferBuiltinTask from "./rules/prefer-builtin-task.js";
import requireTaskInputs from "./rules/require-task-inputs.js";
import noSyncInTaskAction from "./rules/no-sync-in-task-action.js";
import paddingBetweenTasks from "./rules/padding-between-tasks.js";
import noDuplicateTaskNames from "./rules/no-duplicate-task-names.js";
import noCircularDependencies from "./rules/no-circular-dependencies.js";
import requireTaskDescription from "./rules/require-task-description.js";

const rules = {
	"no-process-cwd": noProcessCwd,
	"valid-task-name": validTaskName,
	"valid-depends-on": validDependsOn,
	"no-anonymous-tasks": noAnonymousTasks,
	"prefer-builtin-task": preferBuiltinTask,
	"require-task-inputs": requireTaskInputs,
	"no-sync-in-task-action": noSyncInTaskAction,
	"padding-between-tasks": paddingBetweenTasks,
	"no-duplicate-task-names": noDuplicateTaskNames,
	"no-circular-dependencies": noCircularDependencies,
	"require-task-description": requireTaskDescription
} as const;

const NADLE = "nadle";

const plugin = {
	rules,
	configs: {} as Record<string, TSESLint.FlatConfig.Config>,
	meta: {
		version: "0.0.1",
		name: "eslint-plugin-nadle"
	}
};

const recommendedRules: Record<string, TSESLint.Linter.RuleLevel> = {
	"nadle/no-process-cwd": "warn",
	"nadle/valid-task-name": "error",
	"nadle/valid-depends-on": "error",
	"nadle/no-anonymous-tasks": "error",
	"nadle/require-task-inputs": "warn",
	"nadle/padding-between-tasks": "warn",
	"nadle/no-sync-in-task-action": "warn",
	"nadle/no-duplicate-task-names": "error",
	"nadle/require-task-description": "warn"
};

const allRules: Record<string, TSESLint.Linter.RuleLevel> = Object.fromEntries(Object.keys(rules).map((name) => [`${NADLE}/${name}`, "error"]));

plugin.configs = {
	all: {
		rules: allRules,
		files: ["**/nadle.config.*"],
		plugins: { [NADLE]: plugin }
	},
	recommended: {
		rules: recommendedRules,
		files: ["**/nadle.config.*"],
		plugins: { [NADLE]: plugin }
	}
};

export default plugin;
