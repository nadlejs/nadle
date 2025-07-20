# nadle

## [0.5.1](https://github.com/nadlejs/nadle/compare/v0.5.0...v0.5.1) (2025-07-20)


### Features

* Add --list-workspaces option to list all available workspaces ([#361](https://github.com/nadlejs/nadle/issues/361)) ([a66d665](https://github.com/nadlejs/nadle/commit/a66d665c7e33d8bf3bd7be59f7ff8da635d230e3))
* Add optional --config-key to specify which config should be shown when using --show-config ([#364](https://github.com/nadlejs/nadle/issues/364)) ([145a2b5](https://github.com/nadlejs/nadle/commit/145a2b57c27b47bc38bccd64d6cffbf9618b2485))
* Compute workspace dependencies ([#365](https://github.com/nadlejs/nadle/issues/365)) ([f55cb0e](https://github.com/nadlejs/nadle/commit/f55cb0efb4e13fae6789f8fd48b2975ef11e8195))
* Order tasks by workspaces when listing tasks ([#371](https://github.com/nadlejs/nadle/issues/371)) ([2ad717b](https://github.com/nadlejs/nadle/commit/2ad717b1f2665f5331679df8579c3c3eb3d761e0))
* Print configuration only when using --show-config option ([#372](https://github.com/nadlejs/nadle/issues/372)) ([6a65ec9](https://github.com/nadlejs/nadle/commit/6a65ec929a17655059190ff3619d6d3436068ca5))


### Bug Fixes

* Footer is hidden after choosing task in interaction mode ([#359](https://github.com/nadlejs/nadle/issues/359)) ([3388989](https://github.com/nadlejs/nadle/commit/33889898d96bd6b2012fa54ef5223b173b68a76e))
* Update task selection to use task IDs in interaction mode ([#358](https://github.com/nadlejs/nadle/issues/358)) ([40b822e](https://github.com/nadlejs/nadle/commit/40b822e4e6072390057b63b43fe33316e03ffe70))


### Internal

* Drop internal isWorkerThread option ([#369](https://github.com/nadlejs/nadle/issues/369)) ([cd2255a](https://github.com/nadlejs/nadle/commit/cd2255ad0932aa4d419a9784bb72f59080a129b2))


### Miscellaneous

* Add ESLint rules for complexity and line limits ([5b54afe](https://github.com/nadlejs/nadle/commit/5b54afeb15896a64e45d04ac71e7bdb5635a30eb))

## [0.5.0](https://github.com/nadlejs/nadle/compare/v0.4.0...v0.5.0) (2025-07-16)


### ⚠ BREAKING CHANGES

* rename configurations to options ([#296](https://github.com/nadlejs/nadle/issues/296))

### Features

* Add --summary to show top slowest tasks after execution ([#291](https://github.com/nadlejs/nadle/issues/291)) ([b646351](https://github.com/nadlejs/nadle/commit/b646351b09d5e303370043230af4175a01f59723))
* Add AliasOption type ([73041a5](https://github.com/nadlejs/nadle/commit/73041a5927ec55873d42178594b0c4b8f67dc8b4))
* Add cross-workspace task dependency ([#315](https://github.com/nadlejs/nadle/issues/315)) ([2938327](https://github.com/nadlejs/nadle/commit/29383270be732b97d577bf771ebc4add6a3a4515))
* Add task name validation ([#288](https://github.com/nadlejs/nadle/issues/288)) ([f1ef008](https://github.com/nadlejs/nadle/commit/f1ef0083ed97edbf498e35ee77a7df26ef971f2b))
* Enhance task timing with performance.now() and improve time formatting ([#330](https://github.com/nadlejs/nadle/issues/330)) ([c70958f](https://github.com/nadlejs/nadle/commit/c70958fb2d0ac4886fde20c71aafc549797eafa9))
* Implement graceful cancellation of other tasks on failure ([#305](https://github.com/nadlejs/nadle/issues/305)) ([36ea609](https://github.com/nadlejs/nadle/commit/36ea609aef834c5e8c4a90a5c8937855c869d05f))
* Inject workspace tasks when running tasks from root workspace ([#319](https://github.com/nadlejs/nadle/issues/319)) ([57a3ee4](https://github.com/nadlejs/nadle/commit/57a3ee4a310d4ac832294336cb75c5eebac0cd98))
* Introduce defineTask factory ([#294](https://github.com/nadlejs/nadle/issues/294)) ([a25bd37](https://github.com/nadlejs/nadle/commit/a25bd3731570241d7d6987abfa3c6e36be67e785))
* Introduce fuzzy sort for task selection ([#299](https://github.com/nadlejs/nadle/issues/299)) ([27e61c8](https://github.com/nadlejs/nadle/commit/27e61c862dd7be987d23e69803141bbdc4e0543e))
* Introduce interactive mode ([#286](https://github.com/nadlejs/nadle/issues/286)) ([70898de](https://github.com/nadlejs/nadle/commit/70898de3c61aa42d8bf5fee361123bc6ee51101b))
* Restrict configure() usage to root config file only ([#327](https://github.com/nadlejs/nadle/issues/327)) ([1c38d44](https://github.com/nadlejs/nadle/commit/1c38d441e15c542a1edae8c8c61e47cd9eef255f))
* Support aliasing workspace names ([#321](https://github.com/nadlejs/nadle/issues/321)) ([80d5adc](https://github.com/nadlejs/nadle/commit/80d5adc368fc8cb9d7c596f20ce232fa70f7ea49))
* Support project-scoped task execution based on current working directory ([#336](https://github.com/nadlejs/nadle/issues/336)) ([113e423](https://github.com/nadlejs/nadle/commit/113e423cab24f5929305bf3476a3fcb874bb41c1))
* Update task options to use MaybeArray for improved flexibility ([#333](https://github.com/nadlejs/nadle/issues/333)) ([a5279dd](https://github.com/nadlejs/nadle/commit/a5279dddd5b9a14fd76d00ffbfc9dc9d85f06165))
* Update task suggestion/auto-correct logic for workspaces ([#339](https://github.com/nadlejs/nadle/issues/339)) ([b1858ca](https://github.com/nadlejs/nadle/commit/b1858cabe307e7ed37ff24dee4f4f54620d3eacf))
* Workspaced task detection ([#313](https://github.com/nadlejs/nadle/issues/313)) ([835648f](https://github.com/nadlejs/nadle/commit/835648f8d250be3adbd187aef63e78394c529ca4))
* Workspaces detection ([#310](https://github.com/nadlejs/nadle/issues/310)) ([ec84a8a](https://github.com/nadlejs/nadle/commit/ec84a8a058943a1078d83426fed2f7ccedccef8f))


### Bug Fixes

* Do not traverse up to find the closest config file ([#349](https://github.com/nadlejs/nadle/issues/349)) ([0b9f8e2](https://github.com/nadlejs/nadle/commit/0b9f8e2e880e0eaeae185c2d370ff9d7256199ef))
* Footer should not show when choosing task ([#302](https://github.com/nadlejs/nadle/issues/302)) ([5394e67](https://github.com/nadlejs/nadle/commit/5394e671f5d10ad2aec77b609f81e329bc536d25))
* Normalize Workspace's relativePath for Windows compatibility ([#322](https://github.com/nadlejs/nadle/issues/322)) ([442b042](https://github.com/nadlejs/nadle/commit/442b042034fb5b6c03e53337e541c15294869014))
* Resolved tasks should be printed after welcome line ([#353](https://github.com/nadlejs/nadle/issues/353)) ([c7202cd](https://github.com/nadlejs/nadle/commit/c7202cda592b55b9f5249241517f2f3fe14bb89e))


### Documentation

* Add API reference ([#304](https://github.com/nadlejs/nadle/issues/304)) ([21bf680](https://github.com/nadlejs/nadle/commit/21bf680c9cf5c6e55c161d30d71a25275cc28630))
* Add JSDoc comments for public APIs ([#332](https://github.com/nadlejs/nadle/issues/332)) ([7214137](https://github.com/nadlejs/nadle/commit/721413734a7f50e395033760b6a9deca369fd205))


### Internal

* Add buffering mechanism for delayed task registration ([#325](https://github.com/nadlejs/nadle/issues/325)) ([4d80ed5](https://github.com/nadlejs/nadle/commit/4d80ed55e723caa9e68e13f197b3d415cbf6a4da))
* Add more workspaces tests ([#350](https://github.com/nadlejs/nadle/issues/350)) ([e63b3a5](https://github.com/nadlejs/nadle/commit/e63b3a5bfc42b797d9ec1e321a97366a24b16704))
* Drop top-level configFile field ([#348](https://github.com/nadlejs/nadle/issues/348)) ([8173ba4](https://github.com/nadlejs/nadle/commit/8173ba425c6e6b56cd7d25db30d697855f452353))
* Enhance task state management with thread ID and default state ([#343](https://github.com/nadlejs/nadle/issues/343)) ([fcfc1d3](https://github.com/nadlejs/nadle/commit/fcfc1d3a2a132f52e994e4ccd094542a678a2d71))
* Extract option resolution logic from Nadle class ([#345](https://github.com/nadlejs/nadle/issues/345)) ([c2fa8a9](https://github.com/nadlejs/nadle/commit/c2fa8a949707532867c14dd9a66aebc5be30d85d))
* Fix Sonarqube issues ([#301](https://github.com/nadlejs/nadle/issues/301)) ([c6c9dc8](https://github.com/nadlejs/nadle/commit/c6c9dc84539d5baad774793f436960869b719999))
* Improve error handling and logging messages ([#344](https://github.com/nadlejs/nadle/issues/344)) ([616472b](https://github.com/nadlejs/nadle/commit/616472bcc8b6a01a0db178ee69363646397a30f9))
* Improve profiling summary rendering ([#292](https://github.com/nadlejs/nadle/issues/292)) ([9735fb9](https://github.com/nadlejs/nadle/commit/9735fb9d9b29cb22d9ba75dce52738730d49c07c))
* Increase test timeout for Windows ([04cb76c](https://github.com/nadlejs/nadle/commit/04cb76cfeb7aaf3cde6abd3d084b294e6674bff7))
* Increase timeout for --clean-cache tests ([ec3a4d0](https://github.com/nadlejs/nadle/commit/ec3a4d07588156fe052bad9a5d5e0dd77345a213))
* Introduce event emitter/listener system for internal event handling ([#341](https://github.com/nadlejs/nadle/issues/341)) ([d7ae0bd](https://github.com/nadlejs/nadle/commit/d7ae0bdcac4c45261a50d2b452c0ec8a4c4b8a26))
* Introduce executionTracker for future public APIs ([#342](https://github.com/nadlejs/nadle/issues/342)) ([2ba6402](https://github.com/nadlejs/nadle/commit/2ba64029a090c97af45cdf77446a64dd28c27a48))
* Monorepo setup ([0b9f8e2](https://github.com/nadlejs/nadle/commit/0b9f8e2e880e0eaeae185c2d370ff9d7256199ef))
* Re-organize internal structure ([#338](https://github.com/nadlejs/nadle/issues/338)) ([01c7ce9](https://github.com/nadlejs/nadle/commit/01c7ce9fb2feb006ef3ea7db633689c4c6fd47ce))
* Rename configurations to options ([#296](https://github.com/nadlejs/nadle/issues/296)) ([35533f0](https://github.com/nadlejs/nadle/commit/35533f0358a462abdff616bda975c6e5630536f0))
* Rename registry references to taskRegistry for clarity ([#328](https://github.com/nadlejs/nadle/issues/328)) ([72e5a5c](https://github.com/nadlejs/nadle/commit/72e5a5c7bf2611237319e3947478ee66ed19fe66))
* Stabilize error pointing snapshot ([8173ba4](https://github.com/nadlejs/nadle/commit/8173ba425c6e6b56cd7d25db30d697855f452353))
* Streamline task status updates with a new updateTask method ([#329](https://github.com/nadlejs/nadle/issues/329)) ([50f4045](https://github.com/nadlejs/nadle/commit/50f4045c0766b7b2c7d0da6061793bcda8e5aec5))
* Unify task execution logic using handler pattern ([#340](https://github.com/nadlejs/nadle/issues/340)) ([51559d0](https://github.com/nadlejs/nadle/commit/51559d0951e109aeeebc349853ef90403e7dba00))


### Miscellaneous

* Add DeepWiki badge to README ([259c584](https://github.com/nadlejs/nadle/commit/259c5841151682085dee8a3d7f0f0be8099de5c2))
* **deps-dev:** Bump the minor-updates for eslint, typescript-eslint, cspell, @types/node ([#347](https://github.com/nadlejs/nadle/issues/347)) ([f2a03eb](https://github.com/nadlejs/nadle/commit/f2a03ebf7f6ad22792e4d6ad17e750c4e38494ac))
* **deps-dev:** Bump the minor-updates group with 5 updates ([#303](https://github.com/nadlejs/nadle/issues/303)) ([64c36e8](https://github.com/nadlejs/nadle/commit/64c36e8a2eec6dc9439439b66e341e0343a089fc))
* **deps-dev:** Bump the minor-updates group with 6 updates ([#297](https://github.com/nadlejs/nadle/issues/297)) ([bcaebe8](https://github.com/nadlejs/nadle/commit/bcaebe8ac601c887f343f3290ecd58a482512f94))
* Enable thread pool for vitest ([#354](https://github.com/nadlejs/nadle/issues/354)) ([9ffab6c](https://github.com/nadlejs/nadle/commit/9ffab6c69a72d0567cf8c195044dbe98fa0df221))
* Enforce node builtin module import restrictions ([#324](https://github.com/nadlejs/nadle/issues/324)) ([1017714](https://github.com/nadlejs/nadle/commit/1017714ef6be45651c7ead579b168daf3c358501))
* Throw error when API documentation contains warnings ([73041a5](https://github.com/nadlejs/nadle/commit/73041a5927ec55873d42178594b0c4b8f67dc8b4))
* Update package description and keywords for clarity ([a9640ee](https://github.com/nadlejs/nadle/commit/a9640ee52cc5b83970a160c0e9232dfe9d6fefbe))
* Update README ([ed72c43](https://github.com/nadlejs/nadle/commit/ed72c4383d8a5524b77c8602efc00bc2024febe6))
* Use task identifier everywhere ([#317](https://github.com/nadlejs/nadle/issues/317)) ([68c002d](https://github.com/nadlejs/nadle/commit/68c002dfe875ad799ecb583d79e0dfbe7c78e93c))

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
