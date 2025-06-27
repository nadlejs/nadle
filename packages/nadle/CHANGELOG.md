# nadle

## [0.4.0](https://github.com/nadlejs/nadle/compare/v0.3.7...v0.4.0) (2025-06-27)


### ⚠ BREAKING CHANGES

* rename showSummary option to footer for clarity ([#278](https://github.com/nadlejs/nadle/issues/278))
* simplify public APIs ([#259](https://github.com/nadlejs/nadle/issues/259))

### Features

* Add license field and update package.json exports structure ([#258](https://github.com/nadlejs/nadle/issues/258)) ([b11f429](https://github.com/nadlejs/nadle/commit/b11f429d69555a5214295579c79d310ce923d6d8))
* Add support for cleaning cache directory with --clean-cache option ([#275](https://github.com/nadlejs/nadle/issues/275)) ([1fa301a](https://github.com/nadlejs/nadle/commit/1fa301a09517c317eeac34490b87e1cd0f6da154))
* Allow specifying custom cache directory ([#263](https://github.com/nadlejs/nadle/issues/263)) ([bcf8b8e](https://github.com/nadlejs/nadle/commit/bcf8b8ee9ed756b364536e5454a571e6ede08756))
* Implement Copy Task ([#269](https://github.com/nadlejs/nadle/issues/269)) ([784bb70](https://github.com/nadlejs/nadle/commit/784bb7090334c3bd942c6582b9dbc5fd55f1fdef))
* Include config file into cache input ([#281](https://github.com/nadlejs/nadle/issues/281)) ([3138316](https://github.com/nadlejs/nadle/commit/31383169280bde60199c8b8cd27777b0c6b8d05b))


### Internal

* Avoid using process.cwd() everywhere ([#256](https://github.com/nadlejs/nadle/issues/256)) ([360e85f](https://github.com/nadlejs/nadle/commit/360e85fe9d0966b77d0c28d833b5db10c860482b))
* Fix misc typo ([#270](https://github.com/nadlejs/nadle/issues/270)) ([27ad24f](https://github.com/nadlejs/nadle/commit/27ad24fe6162a20f49881e9120ad6aaf3d04d127))
* Refactor and improve snapshots ([#280](https://github.com/nadlejs/nadle/issues/280)) ([743684b](https://github.com/nadlejs/nadle/commit/743684b607b2968ed87dd6c7961897f24366c6d8))
* Rename showSummary option to footer for clarity ([#278](https://github.com/nadlejs/nadle/issues/278)) ([3861503](https://github.com/nadlejs/nadle/commit/3861503c2d864b1e491b172c705509f61f968712))
* Reorganize structure ([#283](https://github.com/nadlejs/nadle/issues/283)) ([8e86eec](https://github.com/nadlejs/nadle/commit/8e86eecaf167fc27cce561b7e21b5158fefbf05d))
* Simplify options resolution and enhance component initializations ([#279](https://github.com/nadlejs/nadle/issues/279)) ([806622c](https://github.com/nadlejs/nadle/commit/806622c3301b5397b5f25e89b27f708c6538bfce))
* Simplify public APIs ([#259](https://github.com/nadlejs/nadle/issues/259)) ([48672c9](https://github.com/nadlejs/nadle/commit/48672c9e8a595bfdd4bbc3f61cb21b2c9b259e2f))


### Miscellaneous

* Align package names ([#276](https://github.com/nadlejs/nadle/issues/276)) ([02c63e2](https://github.com/nadlejs/nadle/commit/02c63e28dcb5ec316710943a56a5c167fc101714))
* **deps-dev:** Bump the minor-updates group with 5 updates ([#260](https://github.com/nadlejs/nadle/issues/260)) ([44ee0d6](https://github.com/nadlejs/nadle/commit/44ee0d61cf740f190bc8a7dd341d19c6bf660e3c))
* Reorder fields in package.json exports to ensure proper resolution by TypeScript ([#268](https://github.com/nadlejs/nadle/issues/268)) ([e668b60](https://github.com/nadlejs/nadle/commit/e668b60ab63906c00242f91d9cfbff7384b6cad1))
* Update repository links to use the new organization ([#273](https://github.com/nadlejs/nadle/issues/273)) ([5c2ad6c](https://github.com/nadlejs/nadle/commit/5c2ad6cc1cd94467b43b8c5d51f4bc56d211c211))

## [0.3.7](https://github.com/nadlejs/nadle/compare/v0.3.6...v0.3.7) (2025-06-22)


### Features

* Add --exclude option to prevent specified tasks from executing ([#250](https://github.com/nadlejs/nadle/issues/250)) ([88edd7e](https://github.com/nadlejs/nadle/commit/88edd7ee5201d60d57065178ced846a00560a65c))
* Update input handling to use fast-glob's dynamic pattern check ([#253](https://github.com/nadlejs/nadle/issues/253)) ([9b6c86a](https://github.com/nadlejs/nadle/commit/9b6c86a235c00ba9d768fb1b595b47305f542791))


### Bug Fixes

* Resolve working directory relative to project directory instead of cwd ([#252](https://github.com/nadlejs/nadle/issues/252)) ([09aec98](https://github.com/nadlejs/nadle/commit/09aec9807f2664a6d44d8eab20e0f563144aedc5))


### Internal

* Simplify resolveCLIOptions function and extract transformers ([#255](https://github.com/nadlejs/nadle/issues/255)) ([7db6f2b](https://github.com/nadlejs/nadle/commit/7db6f2b8bf3a33a6822a2ce8c1e278492463355d))

## [0.3.6](https://github.com/nadlejs/nadle/compare/v0.3.5...v0.3.6) (2025-06-22)


### Features

* Add projectDir resolution ([#204](https://github.com/nadlejs/nadle/issues/204)) ([c559100](https://github.com/nadlejs/nadle/commit/c5591007d269cd3b48c24f92a7986a8847430d64))
* **caching:** Add --no-cache option to disable task caching ([#240](https://github.com/nadlejs/nadle/issues/240)) ([f4a681f](https://github.com/nadlejs/nadle/commit/f4a681fb9aba496d7c3e26e1c252115b4b167a99))
* **caching:** Add input and output declarations for tasks ([#184](https://github.com/nadlejs/nadle/issues/184)) ([4cfcaee](https://github.com/nadlejs/nadle/commit/4cfcaee8d516ff47b80c44b23d173cc2b6fbcfd8))
* **caching:** Allow task to be up-to-date ([#198](https://github.com/nadlejs/nadle/issues/198)) ([f01d92f](https://github.com/nadlejs/nadle/commit/f01d92f720dc4163af7631ad2aeafaa0b0d2aaee))
* **caching:** Cache key/metadata generation and detection ([#194](https://github.com/nadlejs/nadle/issues/194)) ([f93d7f7](https://github.com/nadlejs/nadle/commit/f93d7f76e30d6816ecbfb3ae99439d03ce13f817))
* **caching:** Implement CacheManager ([#182](https://github.com/nadlejs/nadle/issues/182)) ([38956cd](https://github.com/nadlejs/nadle/commit/38956cdb98adf6b0007d1752a37043ec74d5206a))
* **caching:** Implement output caching and restoration ([#203](https://github.com/nadlejs/nadle/issues/203)) ([f7c34cc](https://github.com/nadlejs/nadle/commit/f7c34ccce8026c34090da0dff7bee5f26e4be10f))
* **caching:** Introduce Inputs/Outputs declarations ([#234](https://github.com/nadlejs/nadle/issues/234)) ([fc315a8](https://github.com/nadlejs/nadle/commit/fc315a88e4b413215be305bd2f6e639134fb7a6f))
* **caching:** Update output caching to use projectDir for saving and restoring outputs ([#215](https://github.com/nadlejs/nadle/issues/215)) ([7ae1aec](https://github.com/nadlejs/nadle/commit/7ae1aecd7b989e5077470436219096a84adfac3f))
* **caching:** Use object-hash instead of self implementing ([3d69c1f](https://github.com/nadlejs/nadle/commit/3d69c1f39e66aaca193480068bc0f08c6733fb9c))
* **reporter:** Add support for task status 'up-to-date' and 'from-cache' ([#217](https://github.com/nadlejs/nadle/issues/217)) ([26ad307](https://github.com/nadlejs/nadle/commit/26ad3079c46c38cac4c4ebfe7a041259d4e20a47))


### Bug Fixes

* Suppress initial logs until loading configuration file ([#238](https://github.com/nadlejs/nadle/issues/238)) ([a9cb70c](https://github.com/nadlejs/nadle/commit/a9cb70c77e864214819d2d64f01e9b9fcda04fa4))


### Internal

* Add project directory test for various package managers ([#226](https://github.com/nadlejs/nadle/issues/226)) ([b350bf1](https://github.com/nadlejs/nadle/commit/b350bf1f98023d418a82d5199a85550f6d645f9c))
* Implement custom Vitest matchers for task order and status assertions ([#243](https://github.com/nadlejs/nadle/issues/243)) ([962ec71](https://github.com/nadlejs/nadle/commit/962ec71ad118880c0f2e39cccb66d7c66bd7eaa0))
* Increase timeout for order execution tests ([391f0d3](https://github.com/nadlejs/nadle/commit/391f0d37d0a9aac5f89e28f0c1a19660846b6e66))
* Increase timeout for order tests in basic.test.ts ([7b1178c](https://github.com/nadlejs/nadle/commit/7b1178c886f96174a00cce5d7992911af5ac5596))
* **reporter:** Improve running tasks section ([#222](https://github.com/nadlejs/nadle/issues/222)) ([a206769](https://github.com/nadlejs/nadle/commit/a206769bf4d632d3b7f077786a07b5416cdb3481))
* Update version handling and display version in navbar ([#235](https://github.com/nadlejs/nadle/issues/235)) ([4a416ec](https://github.com/nadlejs/nadle/commit/4a416ec95579cba1a5ccf35733eae29761b16f96))


### Miscellaneous

* **deps-dev:** Bump @types/node from 20.17.57 to 20.19.0 ([#209](https://github.com/nadlejs/nadle/issues/209)) ([2e7b949](https://github.com/nadlejs/nadle/commit/2e7b9495c9936465f05780e1d39c7bef29655eaf))
* **deps-dev:** Bump knip from 5.60.2 to 5.61.0 ([#192](https://github.com/nadlejs/nadle/issues/192)) ([1ba2dd9](https://github.com/nadlejs/nadle/commit/1ba2dd9a129d43de4d911d9f1449418570a8413f))
* **deps-dev:** Bump vitest from 3.2.2 to 3.2.3 ([#173](https://github.com/nadlejs/nadle/issues/173)) ([277be91](https://github.com/nadlejs/nadle/commit/277be918c551624fc944aa085f52b22570f9e07d))
* **deps:** Bump glob from 11.0.2 to 11.0.3 ([#189](https://github.com/nadlejs/nadle/issues/189)) ([e7ce5e2](https://github.com/nadlejs/nadle/commit/e7ce5e2a99e8ee239e4fbcc9501c8f5a31138bb9))
* **deps:** Bump tinypool from 1.1.0 to 1.1.1 ([#218](https://github.com/nadlejs/nadle/issues/218)) ([414f325](https://github.com/nadlejs/nadle/commit/414f3256259e382965836d72ebfe933392c1d50f))
* Remove other changelog libraries ([962ec71](https://github.com/nadlejs/nadle/commit/962ec71ad118880c0f2e39cccb66d7c66bd7eaa0))
* Remove sourcemap and code splitting options ([#195](https://github.com/nadlejs/nadle/issues/195)) ([9e67378](https://github.com/nadlejs/nadle/commit/9e6737889e7e21edd882373ac899209d69745b10))
* Update release-please configuration and version annotation ([467f3e4](https://github.com/nadlejs/nadle/commit/467f3e492add2bc77821c359278a0a9546f33b40))
* Update release-please version annotation comment ([fb9bebf](https://github.com/nadlejs/nadle/commit/fb9bebf48f937039282a5c3773a000b971ee43a9))
* Use uncompress size ([#201](https://github.com/nadlejs/nadle/issues/201)) ([246334d](https://github.com/nadlejs/nadle/commit/246334d9def34a70dcbbc3ee6647997f8abfe8c5))

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
