# nadle

## [0.3.6](https://github.com/nam-hle/nadle/compare/v0.3.5...v0.3.6) (2025-06-20)


### Features

* add projectDir resolution ([#204](https://github.com/nam-hle/nadle/issues/204)) ([c559100](https://github.com/nam-hle/nadle/commit/c5591007d269cd3b48c24f92a7986a8847430d64))
* **caching:** add input and output declarations for tasks ([#184](https://github.com/nam-hle/nadle/issues/184)) ([4cfcaee](https://github.com/nam-hle/nadle/commit/4cfcaee8d516ff47b80c44b23d173cc2b6fbcfd8))
* **caching:** allow task to be up-to-date ([#198](https://github.com/nam-hle/nadle/issues/198)) ([f01d92f](https://github.com/nam-hle/nadle/commit/f01d92f720dc4163af7631ad2aeafaa0b0d2aaee))
* **caching:** cache key/metadata generation and detection ([#194](https://github.com/nam-hle/nadle/issues/194)) ([f93d7f7](https://github.com/nam-hle/nadle/commit/f93d7f76e30d6816ecbfb3ae99439d03ce13f817))
* **caching:** implement CacheManager ([#182](https://github.com/nam-hle/nadle/issues/182)) ([38956cd](https://github.com/nam-hle/nadle/commit/38956cdb98adf6b0007d1752a37043ec74d5206a))
* **caching:** implement output caching and restoration ([#203](https://github.com/nam-hle/nadle/issues/203)) ([f7c34cc](https://github.com/nam-hle/nadle/commit/f7c34ccce8026c34090da0dff7bee5f26e4be10f))
* **caching:** introduce Inputs/Outputs declarations ([#234](https://github.com/nam-hle/nadle/issues/234)) ([fc315a8](https://github.com/nam-hle/nadle/commit/fc315a88e4b413215be305bd2f6e639134fb7a6f))
* **caching:** update output caching to use projectDir for saving and restoring outputs ([#215](https://github.com/nam-hle/nadle/issues/215)) ([7ae1aec](https://github.com/nam-hle/nadle/commit/7ae1aecd7b989e5077470436219096a84adfac3f))
* **caching:** use object-hash instead of self implementing ([3d69c1f](https://github.com/nam-hle/nadle/commit/3d69c1f39e66aaca193480068bc0f08c6733fb9c))
* **reporter:** add support for task status 'up-to-date' and 'from-cache' ([#217](https://github.com/nam-hle/nadle/issues/217)) ([26ad307](https://github.com/nam-hle/nadle/commit/26ad3079c46c38cac4c4ebfe7a041259d4e20a47))

## 0.3.5

### Patch Changes

- 52d11e6: correct workers configurations resolve
- 6e62514: upgrade nadle from 0.3.3 to 0.3.4
- 23036af: remove bin folder
- 65f2924: fix permission error when installing and running test using tsc
- 687a8de: allow configuration file resolution from nested directories
- fbf298b: reduce default render interval and improve duration formatting
- 033d31c: execute task sequentially as default
- df2caeb: bundle index.d.ts only

## 0.3.4

### Patch Changes

- e0c176d: print number of workers will be used
- 795f945: add algolia search
- fc590a4: add DeleteTask
- b799d36: print nadle location
- 97e5a1b: support Node.js 20

## 0.3.3

### Patch Changes

- 7941473: Print resolved tasks when user specifies abbreviations
- 8e1e27a: propagate workingDir config to PnpmTask and ExecTask
- 194cfde: add --stacktrace option
- 7ea8e26: add new lines after task starts and before task done
- f79ef08: pass resolved workingDir as param to task callback
- b4488fc: support passing environment variables to tasks
- f018665: improve in-progress info

## 0.3.2

### Patch Changes

- 13848bf: optimize bundled size
- 2556b60: allow to run specified tasks in order
- 5196558: allow to specify task with abbreviation
- 34e9360: add suggestions when the specified task not exist

## 0.3.1

### Minor Changes

- ee25bfc: add --show-config option
- 6a32bec: allow to specify configuration from config file

## 0.3.0

### Minor Changes

- de5e348: Move CLI to separate package

### Patch Changes

- 6434585: add cycle detection logic

## 0.2.5

### Patch Changes

- 72df2b8: Add welcome message
