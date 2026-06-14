/**
 * JSON Schema for the {@link ./task-configuration.js TaskConfiguration} object accepted in a
 * configuration file. This is hand-maintained and MUST stay in sync with `TaskConfiguration`;
 * there is no generator. When a field is added, changed, or removed on `TaskConfiguration`,
 * update this schema in the same change.
 */
export const TaskConfigurationSchema = {
	type: "object",
	title: "TaskConfiguration",
	additionalProperties: false,
	description: "Configuration for a Nadle task.",
	$schema: "http://json-schema.org/draft-07/schema#",
	properties: {
		description: {
			type: "string",
			description: "The description of the task."
		},
		group: {
			type: "string",
			description: "The group name to which this task belongs."
		},
		workingDir: {
			type: "string",
			description: "Changes the working directory for the task."
		},
		timeout: {
			minimum: 1,
			type: "integer",
			description: "Maximum time in milliseconds a single execution attempt may take."
		},
		retries: {
			minimum: 0,
			type: "integer",
			description: "Number of additional attempts after the first failure (default 0)."
		},
		maxCacheEntries: {
			minimum: 0,
			type: "integer",
			description: "Maximum number of cache entries to keep for this task. Overrides the global setting."
		},
		dependsOn: {
			description: "A task or a list of tasks that this task depends on.",
			anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }]
		},
		env: {
			type: "object",
			additionalProperties: { type: ["string", "number", "boolean"] },
			description: "Environment variables to set when running the task."
		},
		inputs: {
			anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
			description: "Files, directories, or globs the task reads from. Used for cache key generation."
		},
		outputs: {
			anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
			description: "Files or directories the task produces. Used for caching, restoring, and cleanup."
		}
	}
} as const;
