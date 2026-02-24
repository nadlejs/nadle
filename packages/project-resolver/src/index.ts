// Types
export type { Project, Workspace, RootWorkspace, PackageJson } from "./types.js";

// Discovery
export { discoverProject, locateConfigFiles, resolveCurrentWorkspaceId } from "./project-discovery.js";

// Helpers
export { getAllWorkspaces, getWorkspaceById, getWorkspaceByLabelOrId, configureProject } from "./project-helpers.js";

// Workspace factories
export { createWorkspace, createRootWorkspace } from "./workspace-factory.js";

// Dependency resolution
export { resolveWorkspaceDependencies } from "./dependency-resolver.js";

// Constants
export { PACKAGE_JSON, DEFAULT_CONFIG_FILE_NAMES, CONFIG_FILE_PATTERN, SUPPORT_EXTENSIONS } from "./constants.js";

// Filesystem utilities
export { readJson, isPathExists } from "./fs.js";

// Re-export kernel utilities used in project context
export { ROOT_WORKSPACE_ID, isRootWorkspaceId } from "@nadle/kernel";
