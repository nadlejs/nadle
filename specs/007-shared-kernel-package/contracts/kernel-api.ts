/**
 * @nadle/kernel — Public API Contract
 *
 * This file defines the expected public API surface of the shared kernel package.
 * It serves as a contract between the kernel and its consumers (nadle core, language server, ESLint plugin).
 */

// ─── Constants ───────────────────────────────────────────────────────────────

/** The root workspace always has this ID. */
export const ROOT_WORKSPACE_ID: "root";

/** Colon separator used in task identifiers and workspace IDs. */
export const COLON: ":";

/** Canonical regex pattern for validating task names. */
export const VALID_TASK_NAME_PATTERN: RegExp;

// ─── Types ───────────────────────────────────────────────────────────────────

/** Minimal workspace representation for resolution logic. Consumers extend this. */
export interface WorkspaceIdentity {
	readonly id: string;
	readonly label: string;
	readonly relativePath: string;
}

/** Result of parsing a task reference string. */
export interface TaskReference {
	readonly taskName: string;
	readonly workspaceInput: string | undefined;
}

/** Alias configuration: object map, function, or undefined. */
export type AliasOption = Record<string, string> | ((workspacePath: string) => string | undefined) | undefined;

// ─── Task Identifier Functions ───────────────────────────────────────────────

/**
 * Parse a task reference string into workspace and task name components.
 * The last colon-delimited segment is the task name.
 *
 * @example parseTaskReference("build") => { taskName: "build", workspaceInput: undefined }
 * @example parseTaskReference("shared:build") => { taskName: "build", workspaceInput: "shared" }
 * @example parseTaskReference("apps:web:client:build") => { taskName: "build", workspaceInput: "apps:web:client" }
 */
export function parseTaskReference(input: string): TaskReference;

/**
 * Compose a task identifier from a workspace label and task name.
 * Returns bare task name when workspaceLabel is empty string (root workspace).
 *
 * @example composeTaskIdentifier("shared", "build") => "shared:build"
 * @example composeTaskIdentifier("", "build") => "build"
 */
export function composeTaskIdentifier(workspaceLabel: string, taskName: string): string;

/**
 * Check if a task reference string contains a workspace qualifier (has colons).
 *
 * @example isWorkspaceQualified("build") => false
 * @example isWorkspaceQualified("shared:build") => true
 */
export function isWorkspaceQualified(input: string): boolean;

// ─── Workspace Identity Functions ────────────────────────────────────────────

/**
 * Derive a workspace ID from a relative filesystem path.
 * Normalizes backslashes (Windows) and replaces path separators with colons.
 *
 * @example deriveWorkspaceId("packages/foo") => "packages:foo"
 * @example deriveWorkspaceId("packages\\foo") => "packages:foo"
 * @example deriveWorkspaceId(".") => "root" (special case for root)
 */
export function deriveWorkspaceId(relativePath: string): string;

/**
 * Check if a workspace ID is the root workspace.
 */
export function isRootWorkspaceId(workspaceId: string): boolean;

// ─── Alias Resolution ────────────────────────────────────────────────────────

/**
 * Create an alias resolver function from alias configuration.
 * Returns a function that maps workspace paths to labels.
 */
export function createAliasResolver(aliasOption: AliasOption): (workspacePath: string) => string | undefined;

/**
 * Validate that workspace labels are unique (no alias conflicts with another workspace's label or ID).
 * Throws Error if validation fails.
 */
export function validateWorkspaceLabels(workspaces: readonly WorkspaceIdentity[]): void;

// ─── Workspace Resolution ────────────────────────────────────────────────────

/**
 * Resolve a workspace input (from a parsed task reference) against known workspaces.
 * Matches by ID or label. Throws Error if not found.
 */
export function resolveWorkspace<W extends WorkspaceIdentity>(workspaceInput: string, workspaces: readonly W[]): W;

/**
 * Find a workspace by exact ID. Throws Error if not found.
 */
export function getWorkspaceById<W extends WorkspaceIdentity>(workspaceId: string, workspaces: readonly W[]): W;
