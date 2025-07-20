# nadle

## [0.6.0](https://github.com/nadlejs/nadle/compare/nadle-v0.5.0...nadle-v0.6.0) (2025-07-20)


### ⚠ BREAKING CHANGES

* rename configurations to options ([#296](https://github.com/nadlejs/nadle/issues/296))
* rename showSummary option to footer for clarity ([#278](https://github.com/nadlejs/nadle/issues/278))
* simplify public APIs ([#259](https://github.com/nadlejs/nadle/issues/259))

### Features

* Add --exclude option to prevent specified tasks from executing ([#250](https://github.com/nadlejs/nadle/issues/250)) ([88edd7e](https://github.com/nadlejs/nadle/commit/88edd7ee5201d60d57065178ced846a00560a65c))
* Add --list option ([#4](https://github.com/nadlejs/nadle/issues/4)) ([38821c5](https://github.com/nadlejs/nadle/commit/38821c52aa7963daeab50f529fb6b36cc2963a54))
* Add --list-workspaces option to list all available workspaces ([#361](https://github.com/nadlejs/nadle/issues/361)) ([a66d665](https://github.com/nadlejs/nadle/commit/a66d665c7e33d8bf3bd7be59f7ff8da635d230e3))
* Add --show-config option ([#52](https://github.com/nadlejs/nadle/issues/52)) ([ee25bfc](https://github.com/nadlejs/nadle/commit/ee25bfce833a45ea02847f0220143af9cdfefaaf))
* Add --stacktrace option ([#103](https://github.com/nadlejs/nadle/issues/103)) ([194cfde](https://github.com/nadlejs/nadle/commit/194cfde8f5cecce82c000cbd05714f224ace95dd))
* Add --summary to show top slowest tasks after execution ([#291](https://github.com/nadlejs/nadle/issues/291)) ([b646351](https://github.com/nadlejs/nadle/commit/b646351b09d5e303370043230af4175a01f59723))
* Add AliasOption type ([73041a5](https://github.com/nadlejs/nadle/commit/73041a5927ec55873d42178594b0c4b8f67dc8b4))
* Add banner ([#33](https://github.com/nadlejs/nadle/issues/33)) ([72df2b8](https://github.com/nadlejs/nadle/commit/72df2b877a73e7d0a0c14673fe6c1cc1d2a715d2))
* Add cross-workspace task dependency ([#315](https://github.com/nadlejs/nadle/issues/315)) ([2938327](https://github.com/nadlejs/nadle/commit/29383270be732b97d577bf771ebc4add6a3a4515))
* Add DeleteTask ([#129](https://github.com/nadlejs/nadle/issues/129)) ([fc590a4](https://github.com/nadlejs/nadle/commit/fc590a432cf0386fd43e0141d3d8d40b1a2add7f))
* Add dry run mode ([#17](https://github.com/nadlejs/nadle/issues/17)) ([71b299f](https://github.com/nadlejs/nadle/commit/71b299ff11f245f15dd500b1cc7a5b23057436ba))
* Add exec task ([#19](https://github.com/nadlejs/nadle/issues/19)) ([559bab5](https://github.com/nadlejs/nadle/commit/559bab5e25b4b3c9baddd1836df7179a4bbf3d7a))
* Add license field and update package.json exports structure ([#258](https://github.com/nadlejs/nadle/issues/258)) ([b11f429](https://github.com/nadlejs/nadle/commit/b11f429d69555a5214295579c79d310ce923d6d8))
* Add new lines after task starts and before task done ([#108](https://github.com/nadlejs/nadle/issues/108)) ([7ea8e26](https://github.com/nadlejs/nadle/commit/7ea8e26c5852c944ce22be8b4867ae713ab44ee4))
* Add optional --config-key to specify which config should be shown when using --show-config ([#364](https://github.com/nadlejs/nadle/issues/364)) ([145a2b5](https://github.com/nadlejs/nadle/commit/145a2b57c27b47bc38bccd64d6cffbf9618b2485))
* Add pnpm task and better error handling ([#11](https://github.com/nadlejs/nadle/issues/11)) ([ea1d1f1](https://github.com/nadlejs/nadle/commit/ea1d1f1fce778a5985b2fa23950d02194a83a420))
* Add projectDir resolution ([#204](https://github.com/nadlejs/nadle/issues/204)) ([c559100](https://github.com/nadlejs/nadle/commit/c5591007d269cd3b48c24f92a7986a8847430d64))
* Add reporter ([#8](https://github.com/nadlejs/nadle/issues/8)) ([b0e6e06](https://github.com/nadlejs/nadle/commit/b0e6e06e0a318b6420c608adcee296f425dae2b7))
* Add support for cleaning cache directory with --clean-cache option ([#275](https://github.com/nadlejs/nadle/issues/275)) ([1fa301a](https://github.com/nadlejs/nadle/commit/1fa301a09517c317eeac34490b87e1cd0f6da154))
* Add task group and description ([#9](https://github.com/nadlejs/nadle/issues/9)) ([9caf846](https://github.com/nadlejs/nadle/commit/9caf84603f48622ef2604c0cfd437fc143109090))
* Add task name validation ([#288](https://github.com/nadlejs/nadle/issues/288)) ([f1ef008](https://github.com/nadlejs/nadle/commit/f1ef0083ed97edbf498e35ee77a7df26ef971f2b))
* Allow configuration file resolution from nested directories ([#142](https://github.com/nadlejs/nadle/issues/142)) ([687a8de](https://github.com/nadlejs/nadle/commit/687a8ded8c396753a050e4f53e98273679b8b065))
* Allow specifying custom cache directory ([#263](https://github.com/nadlejs/nadle/issues/263)) ([bcf8b8e](https://github.com/nadlejs/nadle/commit/bcf8b8ee9ed756b364536e5454a571e6ede08756))
* Allow to run specified tasks in order ([#81](https://github.com/nadlejs/nadle/issues/81)) ([9697633](https://github.com/nadlejs/nadle/commit/9697633f4f5401cd48d3e71d0c520037c752981b))
* Allow to specify configuration from config file ([#53](https://github.com/nadlejs/nadle/issues/53)) ([6a32bec](https://github.com/nadlejs/nadle/commit/6a32bec4ac8d99cd3f84f65b1cc8f2b705dcd253))
* Allow to specify task with abbreviation ([#78](https://github.com/nadlejs/nadle/issues/78)) ([5196558](https://github.com/nadlejs/nadle/commit/51965581babf288b77b4ed09ddf1efa20351cafc))
* Better logging in CI ([#26](https://github.com/nadlejs/nadle/issues/26)) ([7a16073](https://github.com/nadlejs/nadle/commit/7a16073d9f5cca27877a2c93eb4088ebf5cb7fa5))
* **caching:** Add --no-cache option to disable task caching ([#240](https://github.com/nadlejs/nadle/issues/240)) ([f4a681f](https://github.com/nadlejs/nadle/commit/f4a681fb9aba496d7c3e26e1c252115b4b167a99))
* **caching:** Add input and output declarations for tasks ([#184](https://github.com/nadlejs/nadle/issues/184)) ([4cfcaee](https://github.com/nadlejs/nadle/commit/4cfcaee8d516ff47b80c44b23d173cc2b6fbcfd8))
* **caching:** Allow task to be up-to-date ([#198](https://github.com/nadlejs/nadle/issues/198)) ([f01d92f](https://github.com/nadlejs/nadle/commit/f01d92f720dc4163af7631ad2aeafaa0b0d2aaee))
* **caching:** Cache key/metadata generation and detection ([#194](https://github.com/nadlejs/nadle/issues/194)) ([f93d7f7](https://github.com/nadlejs/nadle/commit/f93d7f76e30d6816ecbfb3ae99439d03ce13f817))
* **caching:** Implement CacheManager ([#182](https://github.com/nadlejs/nadle/issues/182)) ([38956cd](https://github.com/nadlejs/nadle/commit/38956cdb98adf6b0007d1752a37043ec74d5206a))
* **caching:** Implement output caching and restoration ([#203](https://github.com/nadlejs/nadle/issues/203)) ([f7c34cc](https://github.com/nadlejs/nadle/commit/f7c34ccce8026c34090da0dff7bee5f26e4be10f))
* **caching:** Introduce Inputs/Outputs declarations ([#234](https://github.com/nadlejs/nadle/issues/234)) ([fc315a8](https://github.com/nadlejs/nadle/commit/fc315a88e4b413215be305bd2f6e639134fb7a6f))
* **caching:** Update output caching to use projectDir for saving and restoring outputs ([#215](https://github.com/nadlejs/nadle/issues/215)) ([7ae1aec](https://github.com/nadlejs/nadle/commit/7ae1aecd7b989e5077470436219096a84adfac3f))
* **caching:** Use object-hash instead of self implementing ([3d69c1f](https://github.com/nadlejs/nadle/commit/3d69c1f39e66aaca193480068bc0f08c6733fb9c))
* Compute workspace dependencies ([#365](https://github.com/nadlejs/nadle/issues/365)) ([f55cb0e](https://github.com/nadlejs/nadle/commit/f55cb0efb4e13fae6789f8fd48b2975ef11e8195))
* DependsOn ([#1](https://github.com/nadlejs/nadle/issues/1)) ([0c43067](https://github.com/nadlejs/nadle/commit/0c43067b619592a48b0a080ff7b0183db5de959c))
* Detect cycle ([#48](https://github.com/nadlejs/nadle/issues/48)) ([6434585](https://github.com/nadlejs/nadle/commit/643458570e997a01491a8f3856fc9d0b2c876f01))
* Display similar tasks when specifying a not found task ([#77](https://github.com/nadlejs/nadle/issues/77)) ([34e9360](https://github.com/nadlejs/nadle/commit/34e93608d0b7fa310aba50004cafd479b9c8dce8))
* Enhance task timing with performance.now() and improve time formatting ([#330](https://github.com/nadlejs/nadle/issues/330)) ([c70958f](https://github.com/nadlejs/nadle/commit/c70958fb2d0ac4886fde20c71aafc549797eafa9))
* Execute parallelly ([#15](https://github.com/nadlejs/nadle/issues/15)) ([88f0cee](https://github.com/nadlejs/nadle/commit/88f0cee7b563b81ea8efd0f2ee13cbe235434f6c))
* Execute task sequentially as default ([#164](https://github.com/nadlejs/nadle/issues/164)) ([033d31c](https://github.com/nadlejs/nadle/commit/033d31cdf6a738b91c0666150615a838041d2ded))
* Implement Copy Task ([#269](https://github.com/nadlejs/nadle/issues/269)) ([784bb70](https://github.com/nadlejs/nadle/commit/784bb7090334c3bd942c6582b9dbc5fd55f1fdef))
* Implement graceful cancellation of other tasks on failure ([#305](https://github.com/nadlejs/nadle/issues/305)) ([36ea609](https://github.com/nadlejs/nadle/commit/36ea609aef834c5e8c4a90a5c8937855c869d05f))
* Improve API ([#7](https://github.com/nadlejs/nadle/issues/7)) ([c74c9dc](https://github.com/nadlejs/nadle/commit/c74c9dc5c5c9dabb738e5897111d009eeedbca67))
* Improve in-progress info ([#109](https://github.com/nadlejs/nadle/issues/109)) ([f018665](https://github.com/nadlejs/nadle/commit/f018665f6fe62fc0b6f46b243e1adfeaedd6e769))
* Include config file into cache input ([#281](https://github.com/nadlejs/nadle/issues/281)) ([3138316](https://github.com/nadlejs/nadle/commit/31383169280bde60199c8b8cd27777b0c6b8d05b))
* Inject workspace tasks when running tasks from root workspace ([#319](https://github.com/nadlejs/nadle/issues/319)) ([57a3ee4](https://github.com/nadlejs/nadle/commit/57a3ee4a310d4ac832294336cb75c5eebac0cd98))
* Introduce defineTask factory ([#294](https://github.com/nadlejs/nadle/issues/294)) ([a25bd37](https://github.com/nadlejs/nadle/commit/a25bd3731570241d7d6987abfa3c6e36be67e785))
* Introduce fuzzy sort for task selection ([#299](https://github.com/nadlejs/nadle/issues/299)) ([27e61c8](https://github.com/nadlejs/nadle/commit/27e61c862dd7be987d23e69803141bbdc4e0543e))
* Introduce interactive mode ([#286](https://github.com/nadlejs/nadle/issues/286)) ([70898de](https://github.com/nadlejs/nadle/commit/70898de3c61aa42d8bf5fee361123bc6ee51101b))
* Optimize bundled size and allow common config file extensions ([#72](https://github.com/nadlejs/nadle/issues/72)) ([13848bf](https://github.com/nadlejs/nadle/commit/13848bf181cb062e75f9bad750df7c26abd1aa75))
* Order tasks by workspaces when listing tasks ([#371](https://github.com/nadlejs/nadle/issues/371)) ([2ad717b](https://github.com/nadlejs/nadle/commit/2ad717b1f2665f5331679df8579c3c3eb3d761e0))
* Pass resolved workingDir as param to task callback ([#91](https://github.com/nadlejs/nadle/issues/91)) ([f79ef08](https://github.com/nadlejs/nadle/commit/f79ef080fbf54d9e912900590f162b6f04e66301))
* Print configuration only when using --show-config option ([#372](https://github.com/nadlejs/nadle/issues/372)) ([6a65ec9](https://github.com/nadlejs/nadle/commit/6a65ec929a17655059190ff3619d6d3436068ca5))
* Print nadle package location ([#113](https://github.com/nadlejs/nadle/issues/113)) ([b799d36](https://github.com/nadlejs/nadle/commit/b799d3633c6fd4fd259aa112498aa3aa00ddc371))
* Print number of workers will be used ([#121](https://github.com/nadlejs/nadle/issues/121)) ([e0c176d](https://github.com/nadlejs/nadle/commit/e0c176db8e4da89a4c51b34e76f67803809421a8))
* Print resolved tasks when user specifies abbreviations ([#107](https://github.com/nadlejs/nadle/issues/107)) ([7941473](https://github.com/nadlejs/nadle/commit/7941473e838ea05c06908999ae4385ff5111a891))
* Propagate workingDir config to PnpmTask and ExecTask ([#101](https://github.com/nadlejs/nadle/issues/101)) ([8e1e27a](https://github.com/nadlejs/nadle/commit/8e1e27ab4b067be7349af94a2ea3ae96033dc8d0))
* **reporter:** Add support for task status 'up-to-date' and 'from-cache' ([#217](https://github.com/nadlejs/nadle/issues/217)) ([26ad307](https://github.com/nadlejs/nadle/commit/26ad3079c46c38cac4c4ebfe7a041259d4e20a47))
* Restrict configure() usage to root config file only ([#327](https://github.com/nadlejs/nadle/issues/327)) ([1c38d44](https://github.com/nadlejs/nadle/commit/1c38d441e15c542a1edae8c8c61e47cd9eef255f))
* Support aliasing workspace names ([#321](https://github.com/nadlejs/nadle/issues/321)) ([80d5adc](https://github.com/nadlejs/nadle/commit/80d5adc368fc8cb9d7c596f20ce232fa70f7ea49))
* Support Node 20 ([#122](https://github.com/nadlejs/nadle/issues/122)) ([97e5a1b](https://github.com/nadlejs/nadle/commit/97e5a1b7b8901d765167c6f7f86d14031fa81248))
* Support passing environment variables to tasks ([#86](https://github.com/nadlejs/nadle/issues/86)) ([b4488fc](https://github.com/nadlejs/nadle/commit/b4488fc7ed15ee8419a9cb7f65443f54b92757ef))
* Support project-scoped task execution based on current working directory ([#336](https://github.com/nadlejs/nadle/issues/336)) ([113e423](https://github.com/nadlejs/nadle/commit/113e423cab24f5929305bf3476a3fcb874bb41c1))
* Turn off summary on ci ([#25](https://github.com/nadlejs/nadle/issues/25)) ([5674e2e](https://github.com/nadlejs/nadle/commit/5674e2e728fbc0dfd548195fadb99f4b35c0920d))
* Update input handling to use fast-glob's dynamic pattern check ([#253](https://github.com/nadlejs/nadle/issues/253)) ([9b6c86a](https://github.com/nadlejs/nadle/commit/9b6c86a235c00ba9d768fb1b595b47305f542791))
* Update task options to use MaybeArray for improved flexibility ([#333](https://github.com/nadlejs/nadle/issues/333)) ([a5279dd](https://github.com/nadlejs/nadle/commit/a5279dddd5b9a14fd76d00ffbfc9dc9d85f06165))
* Update task suggestion/auto-correct logic for workspaces ([#339](https://github.com/nadlejs/nadle/issues/339)) ([b1858ca](https://github.com/nadlejs/nadle/commit/b1858cabe307e7ed37ff24dee4f4f54620d3eacf))
* Use nadle.config.* as default config file ([#69](https://github.com/nadlejs/nadle/issues/69)) ([957c102](https://github.com/nadlejs/nadle/commit/957c10292106b491db8680f3177a61537aad70dc))
* Workspaced task detection ([#313](https://github.com/nadlejs/nadle/issues/313)) ([835648f](https://github.com/nadlejs/nadle/commit/835648f8d250be3adbd187aef63e78394c529ca4))
* Workspaces detection ([#310](https://github.com/nadlejs/nadle/issues/310)) ([ec84a8a](https://github.com/nadlejs/nadle/commit/ec84a8a058943a1078d83426fed2f7ccedccef8f))


### Bug Fixes

* Correct workers configurations resolve ([#159](https://github.com/nadlejs/nadle/issues/159)) ([52d11e6](https://github.com/nadlejs/nadle/commit/52d11e6e30a50eb986732528a5edcfd81221b308))
* Do not traverse up to find the closest config file ([#349](https://github.com/nadlejs/nadle/issues/349)) ([0b9f8e2](https://github.com/nadlejs/nadle/commit/0b9f8e2e880e0eaeae185c2d370ff9d7256199ef))
* Footer is hidden after choosing task in interaction mode ([#359](https://github.com/nadlejs/nadle/issues/359)) ([3388989](https://github.com/nadlejs/nadle/commit/33889898d96bd6b2012fa54ef5223b173b68a76e))
* Footer should not show when choosing task ([#302](https://github.com/nadlejs/nadle/issues/302)) ([5394e67](https://github.com/nadlejs/nadle/commit/5394e671f5d10ad2aec77b609f81e329bc536d25))
* Normalize Workspace's relativePath for Windows compatibility ([#322](https://github.com/nadlejs/nadle/issues/322)) ([442b042](https://github.com/nadlejs/nadle/commit/442b042034fb5b6c03e53337e541c15294869014))
* Pnpm/exec task does not pipe log to main process ([#22](https://github.com/nadlejs/nadle/issues/22)) ([5a2578c](https://github.com/nadlejs/nadle/commit/5a2578c003915d144c1f0f32252415452fe59d2f))
* Remove error badge for warn logs ([#66](https://github.com/nadlejs/nadle/issues/66)) ([c90efb3](https://github.com/nadlejs/nadle/commit/c90efb3ebde29eb5f49f5fca2421df7b7e50078c))
* Resolve working directory relative to project directory instead of cwd ([#252](https://github.com/nadlejs/nadle/issues/252)) ([09aec98](https://github.com/nadlejs/nadle/commit/09aec9807f2664a6d44d8eab20e0f563144aedc5))
* Resolved tasks should be printed after welcome line ([#353](https://github.com/nadlejs/nadle/issues/353)) ([c7202cd](https://github.com/nadlejs/nadle/commit/c7202cda592b55b9f5249241517f2f3fe14bb89e))
* Suppress initial logs until loading configuration file ([#238](https://github.com/nadlejs/nadle/issues/238)) ([a9cb70c](https://github.com/nadlejs/nadle/commit/a9cb70c77e864214819d2d64f01e9b9fcda04fa4))
* Update task selection to use task IDs in interaction mode ([#358](https://github.com/nadlejs/nadle/issues/358)) ([40b822e](https://github.com/nadlejs/nadle/commit/40b822e4e6072390057b63b43fe33316e03ffe70))


### Documentation

* Add API reference ([#304](https://github.com/nadlejs/nadle/issues/304)) ([21bf680](https://github.com/nadlejs/nadle/commit/21bf680c9cf5c6e55c161d30d71a25275cc28630))
* Add docs ([#47](https://github.com/nadlejs/nadle/issues/47)) ([8c2ed8e](https://github.com/nadlejs/nadle/commit/8c2ed8ef5485853b4e294968d5afbe4f4688ce55))
* Add JSDoc comments for public APIs ([#332](https://github.com/nadlejs/nadle/issues/332)) ([7214137](https://github.com/nadlejs/nadle/commit/721413734a7f50e395033760b6a9deca369fd205))
* Update broken links ([f89d314](https://github.com/nadlejs/nadle/commit/f89d3141f163a0f675d5ce7f1c95a0f6e070fdc6))


### Internal

* Add buffering mechanism for delayed task registration ([#325](https://github.com/nadlejs/nadle/issues/325)) ([4d80ed5](https://github.com/nadlejs/nadle/commit/4d80ed55e723caa9e68e13f197b3d415cbf6a4da))
* Add more workspaces tests ([#350](https://github.com/nadlejs/nadle/issues/350)) ([e63b3a5](https://github.com/nadlejs/nadle/commit/e63b3a5bfc42b797d9ec1e321a97366a24b16704))
* Add project directory test for various package managers ([#226](https://github.com/nadlejs/nadle/issues/226)) ([b350bf1](https://github.com/nadlejs/nadle/commit/b350bf1f98023d418a82d5199a85550f6d645f9c))
* Avoid using process.cwd() everywhere ([#256](https://github.com/nadlejs/nadle/issues/256)) ([360e85f](https://github.com/nadlejs/nadle/commit/360e85fe9d0966b77d0c28d833b5db10c860482b))
* Drop internal isWorkerThread option ([#369](https://github.com/nadlejs/nadle/issues/369)) ([cd2255a](https://github.com/nadlejs/nadle/commit/cd2255ad0932aa4d419a9784bb72f59080a129b2))
* Drop top-level configFile field ([#348](https://github.com/nadlejs/nadle/issues/348)) ([8173ba4](https://github.com/nadlejs/nadle/commit/8173ba425c6e6b56cd7d25db30d697855f452353))
* Enable dependsOn tests ([#80](https://github.com/nadlejs/nadle/issues/80)) ([0bccf3b](https://github.com/nadlejs/nadle/commit/0bccf3b4a96497b2e498ac0aca3c6cb9967bd2fa))
* Enhance task state management with thread ID and default state ([#343](https://github.com/nadlejs/nadle/issues/343)) ([fcfc1d3](https://github.com/nadlejs/nadle/commit/fcfc1d3a2a132f52e994e4ccd094542a678a2d71))
* Extract option resolution logic from Nadle class ([#345](https://github.com/nadlejs/nadle/issues/345)) ([c2fa8a9](https://github.com/nadlejs/nadle/commit/c2fa8a949707532867c14dd9a66aebc5be30d85d))
* Fix misc typo ([#270](https://github.com/nadlejs/nadle/issues/270)) ([27ad24f](https://github.com/nadlejs/nadle/commit/27ad24fe6162a20f49881e9120ad6aaf3d04d127))
* Fix Sonarqube issues ([#301](https://github.com/nadlejs/nadle/issues/301)) ([c6c9dc8](https://github.com/nadlejs/nadle/commit/c6c9dc84539d5baad774793f436960869b719999))
* Implement custom Vitest matchers for task order and status assertions ([#243](https://github.com/nadlejs/nadle/issues/243)) ([962ec71](https://github.com/nadlejs/nadle/commit/962ec71ad118880c0f2e39cccb66d7c66bd7eaa0))
* Improve cleanup and logging logic ([#170](https://github.com/nadlejs/nadle/issues/170)) ([8bff99b](https://github.com/nadlejs/nadle/commit/8bff99b8c549c76b1c7744954a7efd42808aa628))
* Improve error handling and logging messages ([#344](https://github.com/nadlejs/nadle/issues/344)) ([616472b](https://github.com/nadlejs/nadle/commit/616472bcc8b6a01a0db178ee69363646397a30f9))
* Improve profiling summary rendering ([#292](https://github.com/nadlejs/nadle/issues/292)) ([9735fb9](https://github.com/nadlejs/nadle/commit/9735fb9d9b29cb22d9ba75dce52738730d49c07c))
* Increase test timeout for Windows ([04cb76c](https://github.com/nadlejs/nadle/commit/04cb76cfeb7aaf3cde6abd3d084b294e6674bff7))
* Increase timeout for --clean-cache tests ([ec3a4d0](https://github.com/nadlejs/nadle/commit/ec3a4d07588156fe052bad9a5d5e0dd77345a213))
* Increase timeout for order execution tests ([391f0d3](https://github.com/nadlejs/nadle/commit/391f0d37d0a9aac5f89e28f0c1a19660846b6e66))
* Increase timeout for order tests in basic.test.ts ([7b1178c](https://github.com/nadlejs/nadle/commit/7b1178c886f96174a00cce5d7992911af5ac5596))
* Introduce EnsureMap ([#167](https://github.com/nadlejs/nadle/issues/167)) ([5517ddb](https://github.com/nadlejs/nadle/commit/5517ddb163d102a68fb22c40f6cf3fe3ea37823a))
* Introduce event emitter/listener system for internal event handling ([#341](https://github.com/nadlejs/nadle/issues/341)) ([d7ae0bd](https://github.com/nadlejs/nadle/commit/d7ae0bdcac4c45261a50d2b452c0ec8a4c4b8a26))
* Introduce executionTracker for future public APIs ([#342](https://github.com/nadlejs/nadle/issues/342)) ([2ba6402](https://github.com/nadlejs/nadle/commit/2ba64029a090c97af45cdf77446a64dd28c27a48))
* Monorepo setup ([0b9f8e2](https://github.com/nadlejs/nadle/commit/0b9f8e2e880e0eaeae185c2d370ff9d7256199ef))
* Move cli package back to core ([#55](https://github.com/nadlejs/nadle/issues/55)) ([c22e844](https://github.com/nadlejs/nadle/commit/c22e844481d15f0dac6e85bd032fd11b26565d50))
* Move cli to separate package ([#44](https://github.com/nadlejs/nadle/issues/44)) ([de5e348](https://github.com/nadlejs/nadle/commit/de5e348b593a55ac764a95fb27d7de22122bdd02))
* Re-organize internal structure ([#338](https://github.com/nadlejs/nadle/issues/338)) ([01c7ce9](https://github.com/nadlejs/nadle/commit/01c7ce9fb2feb006ef3ea7db633689c4c6fd47ce))
* Re-organize test structure ([#136](https://github.com/nadlejs/nadle/issues/136)) ([6697fd2](https://github.com/nadlejs/nadle/commit/6697fd23c2e798c08be3e57e8f90c3ad7c7a89ed))
* Reduce scheduler complexity ([#166](https://github.com/nadlejs/nadle/issues/166)) ([1e22014](https://github.com/nadlejs/nadle/commit/1e2201401d4f99801ed2b00e87c1f523abdc493a))
* Refactor and improve snapshots ([#280](https://github.com/nadlejs/nadle/issues/280)) ([743684b](https://github.com/nadlejs/nadle/commit/743684b607b2968ed87dd6c7961897f24366c6d8))
* Remove --update flag ([#131](https://github.com/nadlejs/nadle/issues/131)) ([41f222a](https://github.com/nadlejs/nadle/commit/41f222aa4b302c9ca4318a4eeb20fa0dbe10fc31))
* Rename configurations to options ([#296](https://github.com/nadlejs/nadle/issues/296)) ([35533f0](https://github.com/nadlejs/nadle/commit/35533f0358a462abdff616bda975c6e5630536f0))
* Rename registry references to taskRegistry for clarity ([#328](https://github.com/nadlejs/nadle/issues/328)) ([72e5a5c](https://github.com/nadlejs/nadle/commit/72e5a5c7bf2611237319e3947478ee66ed19fe66))
* Rename showSummary option to footer for clarity ([#278](https://github.com/nadlejs/nadle/issues/278)) ([3861503](https://github.com/nadlejs/nadle/commit/3861503c2d864b1e491b172c705509f61f968712))
* Reorganize structure ([#283](https://github.com/nadlejs/nadle/issues/283)) ([8e86eec](https://github.com/nadlejs/nadle/commit/8e86eecaf167fc27cce561b7e21b5158fefbf05d))
* **reporter:** Improve running tasks section ([#222](https://github.com/nadlejs/nadle/issues/222)) ([a206769](https://github.com/nadlejs/nadle/commit/a206769bf4d632d3b7f077786a07b5416cdb3481))
* Simplify dry run task list ([#84](https://github.com/nadlejs/nadle/issues/84)) ([f3c7f1c](https://github.com/nadlejs/nadle/commit/f3c7f1c7dbc0f108bd4fe23250545ac9a0ac6bd9))
* Simplify options resolution and enhance component initializations ([#279](https://github.com/nadlejs/nadle/issues/279)) ([806622c](https://github.com/nadlejs/nadle/commit/806622c3301b5397b5f25e89b27f708c6538bfce))
* Simplify public APIs ([#259](https://github.com/nadlejs/nadle/issues/259)) ([48672c9](https://github.com/nadlejs/nadle/commit/48672c9e8a595bfdd4bbc3f61cb21b2c9b259e2f))
* Simplify resolveCLIOptions function and extract transformers ([#255](https://github.com/nadlejs/nadle/issues/255)) ([7db6f2b](https://github.com/nadlejs/nadle/commit/7db6f2b8bf3a33a6822a2ce8c1e278492463355d))
* Stabilize error pointing snapshot ([8173ba4](https://github.com/nadlejs/nadle/commit/8173ba425c6e6b56cd7d25db30d697855f452353))
* Streamline task status updates with a new updateTask method ([#329](https://github.com/nadlejs/nadle/issues/329)) ([50f4045](https://github.com/nadlejs/nadle/commit/50f4045c0766b7b2c7d0da6061793bcda8e5aec5))
* Test on windows ([#141](https://github.com/nadlejs/nadle/issues/141)) ([8799929](https://github.com/nadlejs/nadle/commit/8799929c13d9fbdb09364d4ca5b404ef9cd9dfff))
* Unify task execution logic using handler pattern ([#340](https://github.com/nadlejs/nadle/issues/340)) ([51559d0](https://github.com/nadlejs/nadle/commit/51559d0951e109aeeebc349853ef90403e7dba00))
* Update version handling and display version in navbar ([#235](https://github.com/nadlejs/nadle/issues/235)) ([4a416ec](https://github.com/nadlejs/nadle/commit/4a416ec95579cba1a5ccf35733eae29761b16f96))
* Use readonly modifier for class properties and improve logging messages ([#143](https://github.com/nadlejs/nadle/issues/143)) ([92bcd75](https://github.com/nadlejs/nadle/commit/92bcd75abac76e75da76980c33f2aa695ca4f89e))
* Use tasks.register ([fa34818](https://github.com/nadlejs/nadle/commit/fa34818903e8f3e6c257ca17e2ac944a9f1afb10))


### Miscellaneous

* Add badges ([#144](https://github.com/nadlejs/nadle/issues/144)) ([c2c8707](https://github.com/nadlejs/nadle/commit/c2c87078cc22c16116b07ba559bf29bffcbd676c))
* Add DeepWiki badge to README ([259c584](https://github.com/nadlejs/nadle/commit/259c5841151682085dee8a3d7f0f0be8099de5c2))
* Add ESLint rules for complexity and line limits ([5b54afe](https://github.com/nadlejs/nadle/commit/5b54afeb15896a64e45d04ac71e7bdb5635a30eb))
* Add knip ([#18](https://github.com/nadlejs/nadle/issues/18)) ([5a14614](https://github.com/nadlejs/nadle/commit/5a146140732790273648e9401f7ee43b1b0be23c))
* Add more package.json fields and root README ([#45](https://github.com/nadlejs/nadle/issues/45)) ([387c065](https://github.com/nadlejs/nadle/commit/387c065f5c8106b0ad1426ce02ccf56283f93629))
* Add package.json validators ([#46](https://github.com/nadlejs/nadle/issues/46)) ([48fd1cb](https://github.com/nadlejs/nadle/commit/48fd1cbbf64469a939a094e63b59e0a0ea17a572))
* Add README ([1351195](https://github.com/nadlejs/nadle/commit/1351195f61b96ade36f7b4111d39f0caeac43257))
* Align package names ([#276](https://github.com/nadlejs/nadle/issues/276)) ([02c63e2](https://github.com/nadlejs/nadle/commit/02c63e28dcb5ec316710943a56a5c167fc101714))
* Bundle index.d.ts only ([#169](https://github.com/nadlejs/nadle/issues/169)) ([df2caeb](https://github.com/nadlejs/nadle/commit/df2caeb55da2487f2699402b21cc82f4a245c45c))
* Correct publish action ([#20](https://github.com/nadlejs/nadle/issues/20)) ([359a8ac](https://github.com/nadlejs/nadle/commit/359a8accdef8aa403cc3fccf5d8e1bfc43252239))
* **deps-dev:** Bump @types/node from 20.17.57 to 20.19.0 ([#209](https://github.com/nadlejs/nadle/issues/209)) ([2e7b949](https://github.com/nadlejs/nadle/commit/2e7b9495c9936465f05780e1d39c7bef29655eaf))
* **deps-dev:** Bump @types/node from 22.15.2 to 22.15.21 ([#60](https://github.com/nadlejs/nadle/issues/60)) ([1c29b7d](https://github.com/nadlejs/nadle/commit/1c29b7d6032012c852045f60c86561bf73940846))
* **deps-dev:** Bump @types/node from 22.15.21 to 22.15.29 ([#92](https://github.com/nadlejs/nadle/issues/92)) ([ac6c02a](https://github.com/nadlejs/nadle/commit/ac6c02acdf7f9e35e69029d089e61fd432bcba2a))
* **deps-dev:** Bump knip from 5.56.0 to 5.57.0 ([#39](https://github.com/nadlejs/nadle/issues/39)) ([4ee2339](https://github.com/nadlejs/nadle/commit/4ee2339978a327270742560161e96d5ce2ac8d23))
* **deps-dev:** Bump knip from 5.57.1 to 5.58.0 ([#58](https://github.com/nadlejs/nadle/issues/58)) ([d2fb038](https://github.com/nadlejs/nadle/commit/d2fb038b185daeefa62fe0bff46877e74dcaca92))
* **deps-dev:** Bump knip from 5.58.0 to 5.59.1 ([#99](https://github.com/nadlejs/nadle/issues/99)) ([431397f](https://github.com/nadlejs/nadle/commit/431397f234fa5ad49eca9fd67e01f446443c30fe))
* **deps-dev:** Bump knip from 5.59.1 to 5.60.2 ([#157](https://github.com/nadlejs/nadle/issues/157)) ([b679d5d](https://github.com/nadlejs/nadle/commit/b679d5d1a4dba724814608783231caa8b742b8e6))
* **deps-dev:** Bump knip from 5.60.2 to 5.61.0 ([#192](https://github.com/nadlejs/nadle/issues/192)) ([1ba2dd9](https://github.com/nadlejs/nadle/commit/1ba2dd9a129d43de4d911d9f1449418570a8413f))
* **deps-dev:** Bump nadle from 0.3.1 to 0.3.2 ([#83](https://github.com/nadlejs/nadle/issues/83)) ([cb056e8](https://github.com/nadlejs/nadle/commit/cb056e89484747218bd0efa69bdf1d57fe687fbb))
* **deps-dev:** Bump the minor-updates for eslint, typescript-eslint, cspell, @types/node ([#347](https://github.com/nadlejs/nadle/issues/347)) ([f2a03eb](https://github.com/nadlejs/nadle/commit/f2a03ebf7f6ad22792e4d6ad17e750c4e38494ac))
* **deps-dev:** Bump the minor-updates group with 5 updates ([#260](https://github.com/nadlejs/nadle/issues/260)) ([44ee0d6](https://github.com/nadlejs/nadle/commit/44ee0d61cf740f190bc8a7dd341d19c6bf660e3c))
* **deps-dev:** Bump the minor-updates group with 5 updates ([#303](https://github.com/nadlejs/nadle/issues/303)) ([64c36e8](https://github.com/nadlejs/nadle/commit/64c36e8a2eec6dc9439439b66e341e0343a089fc))
* **deps-dev:** Bump the minor-updates group with 6 updates ([#297](https://github.com/nadlejs/nadle/issues/297)) ([bcaebe8](https://github.com/nadlejs/nadle/commit/bcaebe8ac601c887f343f3290ecd58a482512f94))
* **deps-dev:** Bump vitest from 3.1.2 to 3.1.4 ([#120](https://github.com/nadlejs/nadle/issues/120)) ([21147a6](https://github.com/nadlejs/nadle/commit/21147a66a2ca71356b1aa4208c8e5901cadfa819))
* **deps-dev:** Bump vitest from 3.1.4 to 3.2.2 ([#162](https://github.com/nadlejs/nadle/issues/162)) ([26af3b7](https://github.com/nadlejs/nadle/commit/26af3b70ae52e7e80606af68680c243fefa422f5))
* **deps-dev:** Bump vitest from 3.2.2 to 3.2.3 ([#173](https://github.com/nadlejs/nadle/issues/173)) ([277be91](https://github.com/nadlejs/nadle/commit/277be918c551624fc944aa085f52b22570f9e07d))
* **deps:** Bump execa from 9.5.2 to 9.6.0 ([#95](https://github.com/nadlejs/nadle/issues/95)) ([e81a0da](https://github.com/nadlejs/nadle/commit/e81a0dac765fcb31b88be66f76feeeb2004ad43b))
* **deps:** Bump glob from 11.0.2 to 11.0.3 ([#189](https://github.com/nadlejs/nadle/issues/189)) ([e7ce5e2](https://github.com/nadlejs/nadle/commit/e7ce5e2a99e8ee239e4fbcc9501c8f5a31138bb9))
* **deps:** Bump tinypool from 1.0.2 to 1.1.0 ([#96](https://github.com/nadlejs/nadle/issues/96)) ([aed711a](https://github.com/nadlejs/nadle/commit/aed711a3ef5fe97569941e3a6d28d6be1c8c0b43))
* **deps:** Bump tinypool from 1.1.0 to 1.1.1 ([#218](https://github.com/nadlejs/nadle/issues/218)) ([414f325](https://github.com/nadlejs/nadle/commit/414f3256259e382965836d72ebfe933392c1d50f))
* **deps:** Bump yargs from 17.7.2 to 18.0.0 ([#93](https://github.com/nadlejs/nadle/issues/93)) ([5429fe6](https://github.com/nadlejs/nadle/commit/5429fe600fff10a54c98fa2756c1ecd431158bd2))
* Enable thread pool for vitest ([#354](https://github.com/nadlejs/nadle/issues/354)) ([9ffab6c](https://github.com/nadlejs/nadle/commit/9ffab6c69a72d0567cf8c195044dbe98fa0df221))
* Enforce node builtin module import restrictions ([#324](https://github.com/nadlejs/nadle/issues/324)) ([1017714](https://github.com/nadlejs/nadle/commit/1017714ef6be45651c7ead579b168daf3c358501))
* Fix permission error when installing or running test using lib from tsc ([#152](https://github.com/nadlejs/nadle/issues/152)) ([65f2924](https://github.com/nadlejs/nadle/commit/65f2924e20abaf7c0f1297d5ef07e0c86b9b25eb))
* Improve scripts ([#31](https://github.com/nadlejs/nadle/issues/31)) ([1345528](https://github.com/nadlejs/nadle/commit/134552855bd52da2d9417ba55f8bd9bb4c7e26a1))
* Integrate @vitest/eslint-plugin ([#160](https://github.com/nadlejs/nadle/issues/160)) ([667922c](https://github.com/nadlejs/nadle/commit/667922cec9dc00e7961faf4e084faccc898c830f))
* Integrate nadle 0.2.3 ([#24](https://github.com/nadlejs/nadle/issues/24)) ([9837654](https://github.com/nadlejs/nadle/commit/9837654d5e8364de339480b634f2fff7df689856))
* Integrate size-limit action ([#168](https://github.com/nadlejs/nadle/issues/168)) ([e0eadf7](https://github.com/nadlejs/nadle/commit/e0eadf70fda3b066010a04d5ebdc3319e0b543e3))
* Move test package back to nadle ([#79](https://github.com/nadlejs/nadle/issues/79)) ([3306169](https://github.com/nadlejs/nadle/commit/3306169fa83e59316e8a98d75808d8a6fd292d99))
* Reduce default render interval and improve duration formatting ([#153](https://github.com/nadlejs/nadle/issues/153)) ([fbf298b](https://github.com/nadlejs/nadle/commit/fbf298b91396db0c71d8da163258929969d4f493))
* Release v0.3.6 ([#237](https://github.com/nadlejs/nadle/issues/237)) ([77e3d80](https://github.com/nadlejs/nadle/commit/77e3d80ea8b2775c189ecac3d45a52e5569c66c3))
* Release v0.3.7 ([#254](https://github.com/nadlejs/nadle/issues/254)) ([71e9663](https://github.com/nadlejs/nadle/commit/71e9663c4351008db8f4fade77eed668d3ab7414))
* Release v0.4.0 ([#257](https://github.com/nadlejs/nadle/issues/257)) ([dec1173](https://github.com/nadlejs/nadle/commit/dec11735f4a04980110dcfb958c4e61fe8cadb0d))
* Release v0.5.0 ([#287](https://github.com/nadlejs/nadle/issues/287)) ([7f4fb7b](https://github.com/nadlejs/nadle/commit/7f4fb7b32593b8d4d002ee1e7f3d7533ca13d9a0))
* Remove other changelog libraries ([962ec71](https://github.com/nadlejs/nadle/commit/962ec71ad118880c0f2e39cccb66d7c66bd7eaa0))
* Remove redundant bin folder ([#138](https://github.com/nadlejs/nadle/issues/138)) ([23036af](https://github.com/nadlejs/nadle/commit/23036afa2441a7144c1ccbc0040a795bf66463b0))
* Remove sourcemap and code splitting options ([#195](https://github.com/nadlejs/nadle/issues/195)) ([9e67378](https://github.com/nadlejs/nadle/commit/9e6737889e7e21edd882373ac899209d69745b10))
* Reorder fields in package.json exports to ensure proper resolution by TypeScript ([#268](https://github.com/nadlejs/nadle/issues/268)) ([e668b60](https://github.com/nadlejs/nadle/commit/e668b60ab63906c00242f91d9cfbff7384b6cad1))
* Setup husky & lint-staged ([#21](https://github.com/nadlejs/nadle/issues/21)) ([fd0e190](https://github.com/nadlejs/nadle/commit/fd0e190afe30ac88c9db7a6f339353800013ba99))
* Simplify readme & add license ([#76](https://github.com/nadlejs/nadle/issues/76)) ([a0337f2](https://github.com/nadlejs/nadle/commit/a0337f2612cb888d6f9cbff4cfee69dae8c7c32e))
* Throw error when API documentation contains warnings ([73041a5](https://github.com/nadlejs/nadle/commit/73041a5927ec55873d42178594b0c4b8f67dc8b4))
* Update documentation link ([#49](https://github.com/nadlejs/nadle/issues/49)) ([7f59f98](https://github.com/nadlejs/nadle/commit/7f59f987819b217ae61448456e9afa01cf620599))
* Update homepage ([#61](https://github.com/nadlejs/nadle/issues/61)) ([2ee8628](https://github.com/nadlejs/nadle/commit/2ee862898f8ac01e77864d6bebc3e7fa0452dc1c))
* Update package description and keywords for clarity ([a9640ee](https://github.com/nadlejs/nadle/commit/a9640ee52cc5b83970a160c0e9232dfe9d6fefbe))
* Update README ([ed72c43](https://github.com/nadlejs/nadle/commit/ed72c4383d8a5524b77c8602efc00bc2024febe6))
* Update release-please configuration and version annotation ([467f3e4](https://github.com/nadlejs/nadle/commit/467f3e492add2bc77821c359278a0a9546f33b40))
* Update release-please version annotation comment ([fb9bebf](https://github.com/nadlejs/nadle/commit/fb9bebf48f937039282a5c3773a000b971ee43a9))
* Update repository links to use the new organization ([#273](https://github.com/nadlejs/nadle/issues/273)) ([5c2ad6c](https://github.com/nadlejs/nadle/commit/5c2ad6cc1cd94467b43b8c5d51f4bc56d211c211))
* Use task identifier everywhere ([#317](https://github.com/nadlejs/nadle/issues/317)) ([68c002d](https://github.com/nadlejs/nadle/commit/68c002dfe875ad799ecb583d79e0dfbe7c78e93c))
* Use uncompress size ([#201](https://github.com/nadlejs/nadle/issues/201)) ([246334d](https://github.com/nadlejs/nadle/commit/246334d9def34a70dcbbc3ee6647997f8abfe8c5))

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
