# Research: Shared Kernel Package

## 1. Extractable Code Inventory

### Tier 1: Pure Logic, Zero External Dependencies

| Item                                            | Source File                             | Lines                       | Notes                             |
| ----------------------------------------------- | --------------------------------------- | --------------------------- | --------------------------------- |
| `COLON`, `SLASH`, `BACKSLASH`, `DOT`            | `core/utilities/constants.ts`           | 8-11                        | Path/separator constants          |
| `TaskIdentifier` type + `create()` + `parser()` | `core/models/task-identifier.ts`        | 1-42                        | Entire file                       |
| `deriveWorkspaceId()`                           | `core/models/project/workspace.ts`      | 37-38                       | Extract from `Workspace.create()` |
| `RootWorkspace.ID` + `isRootWorkspaceId()`      | `core/models/project/root-workspace.ts` | 21, 39-41                   | Constant + predicate              |
| `AliasOption` type                              | `core/options/types.ts`                 | 73                          | Type definition                   |
| `AliasResolver.create()`                        | `core/models/project/alias-resolver.ts` | 1-17                        | Entire file                       |
| Task name validation regex                      | `core/registration/api.ts` line 114     | Duplicated in eslint-plugin | Deduplicate                       |

### Tier 2: Pure Logic, Depends on Workspace Types

| Item                                 | Source File                                   | Notes                          |
| ------------------------------------ | --------------------------------------------- | ------------------------------ |
| `Project.getWorkspaceByLabelOrId()`  | `core/models/project/project.ts` lines 39-54  | Pure lookup                    |
| `Project.getWorkspaceById()`         | `core/models/project/project.ts` lines 56-71  | Pure lookup                    |
| `Project.configure()` + `validate()` | `core/models/project/project.ts` lines 73-111 | Alias application + validation |

### Not Extractable (stay in nadle core)

| Item                     | Reason                                                |
| ------------------------ | ----------------------------------------------------- |
| `Project.create()`       | Depends on `@manypkg/tools`, `DependencyResolver`     |
| `RootWorkspace.create()` | Filesystem I/O (`readJson`)                           |
| `Workspace.create()`     | Depends on `@manypkg/tools` Package type              |
| `ProjectResolver`        | Heavy I/O: `find-up`, `@manypkg/find-root`            |
| `TaskRegistry` class     | Stateful registry with lifecycle                      |
| `TaskInputResolver`      | Depends on `fastest-levenshtein`, `lodash-es`, Logger |

## 2. Cross-Package Duplication

| Duplication                         | Location A                                                      | Location B                                                                       | Kernel Fix                                |
| ----------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------- |
| Task name regex                     | `nadle/registration/api.ts` `/^[a-z](?:[a-z0-9-]*[a-z0-9])?$/i` | `eslint-plugin/rules/valid-task-name.ts` `/^[a-z][a-zA-Z0-9]*(-[a-zA-Z0-9]+)*$/` | Single `VALID_TASK_NAME_PATTERN` constant |
| Colon check for workspace-qualified | `TaskIdentifier.parser()`                                       | `language-server/analyzer.ts` line 73 `node.text.includes(":")`                  | Shared `isWorkspaceQualified()` function  |
| Root workspace ID                   | `RootWorkspace.ID = "root"`                                     | Would be duplicated by future consumers                                          | Shared `ROOT_WORKSPACE_ID` constant       |

## 3. Decision: Scope Boundary

**Decision**: Extract only Tier 1 items plus workspace resolution functions from Tier 2 that operate on minimal `WorkspaceIdentity` types. Do NOT extract full `Workspace`/`Project` interfaces (they carry `packageJson`, `absolutePath`, etc. which are consumer-specific).

**Rationale**: The kernel should be the thinnest possible layer — just the resolution rules and identity types. Consumers define their own richer types that extend `WorkspaceIdentity`.

**Alternatives considered**:

- Extract full `Project`/`Workspace` types: Rejected because it pulls in `PackageJson` interface which references `@manypkg/tools` types in its factory.
- Extract `TaskInputResolver` with fuzzy matching: Rejected because it depends on `fastest-levenshtein` and `lodash-es`, violating zero-dependency constraint.

## 4. Decision: Package Name

**Decision**: `@nadle/kernel`

**Rationale**: "Kernel" conveys the minimal shared core that other packages build on. Future-proof for constants, types, and validation rules beyond just workspace resolution.

**Alternatives considered**:

- `@nadle/core-utils`: Too generic, suggests a grab-bag utility package.
- `@nadle/project`: Too narrow, implies only project/workspace concerns.
- `@nadle/shared`: Vague, no semantic meaning.

## 5. Decision: Build Tooling

**Decision**: Use `tsup` (same as nadle core) with a single ESM entry point.

**Rationale**: Consistency with existing packages. Single entry point sufficient for ~150 lines.

## 6. Decision: Error Handling Strategy

**Decision**: Resolution functions that fail (e.g., workspace not found) throw plain `Error` with descriptive messages. No dependency on nadle's `Messages` utility or `NadleError` class.

**Rationale**: The kernel cannot depend on nadle core's error infrastructure. Consumers catch and re-wrap errors with their own error types (e.g., `NadleError` in core, diagnostic messages in LSP).

**Alternatives considered**:

- Return `Result<T, E>` type: Over-engineering for this scope.
- Return `undefined` on failure: Loses error context, forces consumers to construct their own messages.
