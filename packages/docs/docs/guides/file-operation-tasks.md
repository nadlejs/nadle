---
description: Copy, move, sync, zip, unzip, download, and delete files with Nadle's built-in file-operation tasks.
keywords: [nadle, copy, move, sync, zip, unzip, download, delete, file operations, builtin tasks]
---

# File Operation Tasks

Nadle ships built-in tasks for everyday file operations: `CopyTask`, `MoveTask`, `SyncTask`,
`ZipTask`, `UnzipTask`, `DownloadTask`, and `DeleteTask`. They share one source vocabulary and
one rule for destinations, so once you've learned `CopyTask` you know them all.

## File Selections

Every task that reads files accepts the same `from` shapes — a path, a selector, or an array
mixing both:

```ts
tasks.register("collect", CopyTask, {
	from: [
		"README.md", // a single file
		"assets", // a whole directory
		{ dir: "docs", include: "**/*.md", exclude: "**/draft-*.md" } // a selector
	],
	into: "dist"
});
```

- A **string** pointing to a file selects that file; pointing to a directory selects the files
  inside it.
- A **selector** (`{ dir, include?, exclude? }`) filters a directory with glob patterns.
- Task-level `include`/`exclude` act as defaults for directory selections without their own.
- A missing source logs a warning and is skipped — set `strict: true` to fail instead.

The destination (`into`) is **always a directory** and is created if missing.

## CopyTask

```ts
tasks.register("stageConfigs", CopyTask, {
	from: { dir: "configs", include: "*.prod.json" },
	into: "build",
	flatten: true, // drop source directory structure
	rename: { "app.prod.json": "app.json" }, // rename by exact base name
	overwrite: "error", // replace (default) | skip | error
	strict: true // fail on missing source or zero matches
});
```

If two sources map to the same destination (e.g. via `flatten`), the task fails instead of
silently overwriting. Files are copied with bounded concurrency.

## MoveTask

Same options as `CopyTask`; sources are removed after they reach their destination (a
filesystem rename when possible, copy-then-delete across devices). Files skipped by the
`overwrite` policy keep their source.

```ts
tasks.register("archiveLogs", MoveTask, {
	from: { dir: "logs", include: "*.log" },
	into: "logs/archive",
	overwrite: "skip"
});
```

## SyncTask

Makes the destination an exact mirror of the sources: copies everything (always replacing),
then deletes files in `into` that have no corresponding source and prunes empty directories.
Use `preserve` for files that must survive:

```ts
tasks.register("syncPublic", SyncTask, {
	from: "static",
	into: "dist/public",
	preserve: ["cache-manifest.json"]
});
```

## ZipTask and UnzipTask

```ts
tasks.register("bundle", ZipTask, {
	from: "dist",
	archive: "out/bundle.zip",
	prefix: "bundle" // entries stored as bundle/...
});

tasks.register("extract", UnzipTask, {
	archive: "out/bundle.zip",
	into: "extracted",
	include: "bundle/assets/**" // optional entry filter
});
```

Archive entry names are the selection-relative paths (always forward slashes). `UnzipTask`
refuses entries that would escape the destination directory (zip-slip protection).

## DownloadTask

```ts
tasks.register("fetchSchema", DownloadTask, {
	url: "https://example.com/schema.json",
	into: "vendor",
	sha256: "ab12…" // optional integrity check
});
```

- `filename` defaults to the last segment of the URL path.
- With `sha256`, an existing file with a matching digest skips the download entirely — re-runs
  are cheap and offline-safe. A mismatch after download fails the task and removes the file.

## DeleteTask

```ts
tasks.register("clean", DeleteTask, { paths: ["dist", "**/*.tmp"] });
```

Glob patterns are resolved once; the logged list is exactly what gets deleted.

## Caching

All options are plain data, so they participate in the cache key automatically. Declare
`inputs`/`outputs` to make file operations cacheable:

```ts
import { tasks, Inputs, Outputs, CopyTask } from "nadle";

tasks.register("bundleAssets", CopyTask, { from: "assets", into: "dist/assets" }).config({
	inputs: [Inputs.dirs("assets")],
	outputs: [Outputs.dirs("dist/assets")]
});
```
