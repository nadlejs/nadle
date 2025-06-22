# nadle

## [0.3.7](https://github.com/nam-hle/nadle/compare/v0.3.6...v0.3.7) (2025-06-22)


### Features

* Add --list option ([#4](https://github.com/nam-hle/nadle/issues/4)) ([38821c5](https://github.com/nam-hle/nadle/commit/38821c52aa7963daeab50f529fb6b36cc2963a54))
* Add --show-config option ([#52](https://github.com/nam-hle/nadle/issues/52)) ([ee25bfc](https://github.com/nam-hle/nadle/commit/ee25bfce833a45ea02847f0220143af9cdfefaaf))
* Add --stacktrace option ([#103](https://github.com/nam-hle/nadle/issues/103)) ([194cfde](https://github.com/nam-hle/nadle/commit/194cfde8f5cecce82c000cbd05714f224ace95dd))
* Add banner ([#33](https://github.com/nam-hle/nadle/issues/33)) ([72df2b8](https://github.com/nam-hle/nadle/commit/72df2b877a73e7d0a0c14673fe6c1cc1d2a715d2))
* Add DeleteTask ([#129](https://github.com/nam-hle/nadle/issues/129)) ([fc590a4](https://github.com/nam-hle/nadle/commit/fc590a432cf0386fd43e0141d3d8d40b1a2add7f))
* Add dry run mode ([#17](https://github.com/nam-hle/nadle/issues/17)) ([71b299f](https://github.com/nam-hle/nadle/commit/71b299ff11f245f15dd500b1cc7a5b23057436ba))
* Add exec task ([#19](https://github.com/nam-hle/nadle/issues/19)) ([559bab5](https://github.com/nam-hle/nadle/commit/559bab5e25b4b3c9baddd1836df7179a4bbf3d7a))
* Add new lines after task starts and before task done ([#108](https://github.com/nam-hle/nadle/issues/108)) ([7ea8e26](https://github.com/nam-hle/nadle/commit/7ea8e26c5852c944ce22be8b4867ae713ab44ee4))
* Add pnpm task and better error handling ([#11](https://github.com/nam-hle/nadle/issues/11)) ([ea1d1f1](https://github.com/nam-hle/nadle/commit/ea1d1f1fce778a5985b2fa23950d02194a83a420))
* Add projectDir resolution ([#204](https://github.com/nam-hle/nadle/issues/204)) ([c559100](https://github.com/nam-hle/nadle/commit/c5591007d269cd3b48c24f92a7986a8847430d64))
* Add reporter ([#8](https://github.com/nam-hle/nadle/issues/8)) ([b0e6e06](https://github.com/nam-hle/nadle/commit/b0e6e06e0a318b6420c608adcee296f425dae2b7))
* Add task group and description ([#9](https://github.com/nam-hle/nadle/issues/9)) ([9caf846](https://github.com/nam-hle/nadle/commit/9caf84603f48622ef2604c0cfd437fc143109090))
* Allow configuration file resolution from nested directories ([#142](https://github.com/nam-hle/nadle/issues/142)) ([687a8de](https://github.com/nam-hle/nadle/commit/687a8ded8c396753a050e4f53e98273679b8b065))
* Allow to run specified tasks in order ([#81](https://github.com/nam-hle/nadle/issues/81)) ([9697633](https://github.com/nam-hle/nadle/commit/9697633f4f5401cd48d3e71d0c520037c752981b))
* Allow to specify configuration from config file ([#53](https://github.com/nam-hle/nadle/issues/53)) ([6a32bec](https://github.com/nam-hle/nadle/commit/6a32bec4ac8d99cd3f84f65b1cc8f2b705dcd253))
* Allow to specify task with abbreviation ([#78](https://github.com/nam-hle/nadle/issues/78)) ([5196558](https://github.com/nam-hle/nadle/commit/51965581babf288b77b4ed09ddf1efa20351cafc))
* Better logging in CI ([#26](https://github.com/nam-hle/nadle/issues/26)) ([7a16073](https://github.com/nam-hle/nadle/commit/7a16073d9f5cca27877a2c93eb4088ebf5cb7fa5))
* **caching:** Add --no-cache option to disable task caching ([#240](https://github.com/nam-hle/nadle/issues/240)) ([f4a681f](https://github.com/nam-hle/nadle/commit/f4a681fb9aba496d7c3e26e1c252115b4b167a99))
* **caching:** Add input and output declarations for tasks ([#184](https://github.com/nam-hle/nadle/issues/184)) ([4cfcaee](https://github.com/nam-hle/nadle/commit/4cfcaee8d516ff47b80c44b23d173cc2b6fbcfd8))
* **caching:** Allow task to be up-to-date ([#198](https://github.com/nam-hle/nadle/issues/198)) ([f01d92f](https://github.com/nam-hle/nadle/commit/f01d92f720dc4163af7631ad2aeafaa0b0d2aaee))
* **caching:** Cache key/metadata generation and detection ([#194](https://github.com/nam-hle/nadle/issues/194)) ([f93d7f7](https://github.com/nam-hle/nadle/commit/f93d7f76e30d6816ecbfb3ae99439d03ce13f817))
* **caching:** Implement CacheManager ([#182](https://github.com/nam-hle/nadle/issues/182)) ([38956cd](https://github.com/nam-hle/nadle/commit/38956cdb98adf6b0007d1752a37043ec74d5206a))
* **caching:** Implement output caching and restoration ([#203](https://github.com/nam-hle/nadle/issues/203)) ([f7c34cc](https://github.com/nam-hle/nadle/commit/f7c34ccce8026c34090da0dff7bee5f26e4be10f))
* **caching:** Introduce Inputs/Outputs declarations ([#234](https://github.com/nam-hle/nadle/issues/234)) ([fc315a8](https://github.com/nam-hle/nadle/commit/fc315a88e4b413215be305bd2f6e639134fb7a6f))
* **caching:** Update output caching to use projectDir for saving and restoring outputs ([#215](https://github.com/nam-hle/nadle/issues/215)) ([7ae1aec](https://github.com/nam-hle/nadle/commit/7ae1aecd7b989e5077470436219096a84adfac3f))
* **caching:** Use object-hash instead of self implementing ([3d69c1f](https://github.com/nam-hle/nadle/commit/3d69c1f39e66aaca193480068bc0f08c6733fb9c))
* DependsOn ([#1](https://github.com/nam-hle/nadle/issues/1)) ([0c43067](https://github.com/nam-hle/nadle/commit/0c43067b619592a48b0a080ff7b0183db5de959c))
* Detect cycle ([#48](https://github.com/nam-hle/nadle/issues/48)) ([6434585](https://github.com/nam-hle/nadle/commit/643458570e997a01491a8f3856fc9d0b2c876f01))
* Display similar tasks when specifying a not found task ([#77](https://github.com/nam-hle/nadle/issues/77)) ([34e9360](https://github.com/nam-hle/nadle/commit/34e93608d0b7fa310aba50004cafd479b9c8dce8))
* Execute parallelly ([#15](https://github.com/nam-hle/nadle/issues/15)) ([88f0cee](https://github.com/nam-hle/nadle/commit/88f0cee7b563b81ea8efd0f2ee13cbe235434f6c))
* Execute task sequentially as default ([#164](https://github.com/nam-hle/nadle/issues/164)) ([033d31c](https://github.com/nam-hle/nadle/commit/033d31cdf6a738b91c0666150615a838041d2ded))
* Improve API ([#7](https://github.com/nam-hle/nadle/issues/7)) ([c74c9dc](https://github.com/nam-hle/nadle/commit/c74c9dc5c5c9dabb738e5897111d009eeedbca67))
* Improve in-progress info ([#109](https://github.com/nam-hle/nadle/issues/109)) ([f018665](https://github.com/nam-hle/nadle/commit/f018665f6fe62fc0b6f46b243e1adfeaedd6e769))
* Optimize bundled size and allow common config file extensions ([#72](https://github.com/nam-hle/nadle/issues/72)) ([13848bf](https://github.com/nam-hle/nadle/commit/13848bf181cb062e75f9bad750df7c26abd1aa75))
* Pass resolved workingDir as param to task callback ([#91](https://github.com/nam-hle/nadle/issues/91)) ([f79ef08](https://github.com/nam-hle/nadle/commit/f79ef080fbf54d9e912900590f162b6f04e66301))
* Print nadle package location ([#113](https://github.com/nam-hle/nadle/issues/113)) ([b799d36](https://github.com/nam-hle/nadle/commit/b799d3633c6fd4fd259aa112498aa3aa00ddc371))
* Print number of workers will be used ([#121](https://github.com/nam-hle/nadle/issues/121)) ([e0c176d](https://github.com/nam-hle/nadle/commit/e0c176db8e4da89a4c51b34e76f67803809421a8))
* Print resolved tasks when user specifies abbreviations ([#107](https://github.com/nam-hle/nadle/issues/107)) ([7941473](https://github.com/nam-hle/nadle/commit/7941473e838ea05c06908999ae4385ff5111a891))
* Propagate workingDir config to PnpmTask and ExecTask ([#101](https://github.com/nam-hle/nadle/issues/101)) ([8e1e27a](https://github.com/nam-hle/nadle/commit/8e1e27ab4b067be7349af94a2ea3ae96033dc8d0))
* **reporter:** Add support for task status 'up-to-date' and 'from-cache' ([#217](https://github.com/nam-hle/nadle/issues/217)) ([26ad307](https://github.com/nam-hle/nadle/commit/26ad3079c46c38cac4c4ebfe7a041259d4e20a47))
* Support Node 20 ([#122](https://github.com/nam-hle/nadle/issues/122)) ([97e5a1b](https://github.com/nam-hle/nadle/commit/97e5a1b7b8901d765167c6f7f86d14031fa81248))
* Support passing environment variables to tasks ([#86](https://github.com/nam-hle/nadle/issues/86)) ([b4488fc](https://github.com/nam-hle/nadle/commit/b4488fc7ed15ee8419a9cb7f65443f54b92757ef))
* Turn off summary on ci ([#25](https://github.com/nam-hle/nadle/issues/25)) ([5674e2e](https://github.com/nam-hle/nadle/commit/5674e2e728fbc0dfd548195fadb99f4b35c0920d))
* Use nadle.config.* as default config file ([#69](https://github.com/nam-hle/nadle/issues/69)) ([957c102](https://github.com/nam-hle/nadle/commit/957c10292106b491db8680f3177a61537aad70dc))


### Bug Fixes

* Correct workers configurations resolve ([#159](https://github.com/nam-hle/nadle/issues/159)) ([52d11e6](https://github.com/nam-hle/nadle/commit/52d11e6e30a50eb986732528a5edcfd81221b308))
* Pnpm/exec task does not pipe log to main process ([#22](https://github.com/nam-hle/nadle/issues/22)) ([5a2578c](https://github.com/nam-hle/nadle/commit/5a2578c003915d144c1f0f32252415452fe59d2f))
* Remove error badge for warn logs ([#66](https://github.com/nam-hle/nadle/issues/66)) ([c90efb3](https://github.com/nam-hle/nadle/commit/c90efb3ebde29eb5f49f5fca2421df7b7e50078c))
* Suppress initial logs until loading configuration file ([#238](https://github.com/nam-hle/nadle/issues/238)) ([a9cb70c](https://github.com/nam-hle/nadle/commit/a9cb70c77e864214819d2d64f01e9b9fcda04fa4))


### Documentation

* Add docs ([#47](https://github.com/nam-hle/nadle/issues/47)) ([8c2ed8e](https://github.com/nam-hle/nadle/commit/8c2ed8ef5485853b4e294968d5afbe4f4688ce55))
* Update broken links ([f89d314](https://github.com/nam-hle/nadle/commit/f89d3141f163a0f675d5ce7f1c95a0f6e070fdc6))


### Internal

* Add project directory test for various package managers ([#226](https://github.com/nam-hle/nadle/issues/226)) ([b350bf1](https://github.com/nam-hle/nadle/commit/b350bf1f98023d418a82d5199a85550f6d645f9c))
* Enable dependsOn tests ([#80](https://github.com/nam-hle/nadle/issues/80)) ([0bccf3b](https://github.com/nam-hle/nadle/commit/0bccf3b4a96497b2e498ac0aca3c6cb9967bd2fa))
* Implement custom Vitest matchers for task order and status assertions ([#243](https://github.com/nam-hle/nadle/issues/243)) ([962ec71](https://github.com/nam-hle/nadle/commit/962ec71ad118880c0f2e39cccb66d7c66bd7eaa0))
* Improve cleanup and logging logic ([#170](https://github.com/nam-hle/nadle/issues/170)) ([8bff99b](https://github.com/nam-hle/nadle/commit/8bff99b8c549c76b1c7744954a7efd42808aa628))
* Increase timeout for order execution tests ([391f0d3](https://github.com/nam-hle/nadle/commit/391f0d37d0a9aac5f89e28f0c1a19660846b6e66))
* Increase timeout for order tests in basic.test.ts ([7b1178c](https://github.com/nam-hle/nadle/commit/7b1178c886f96174a00cce5d7992911af5ac5596))
* Introduce EnsureMap ([#167](https://github.com/nam-hle/nadle/issues/167)) ([5517ddb](https://github.com/nam-hle/nadle/commit/5517ddb163d102a68fb22c40f6cf3fe3ea37823a))
* Move cli package back to core ([#55](https://github.com/nam-hle/nadle/issues/55)) ([c22e844](https://github.com/nam-hle/nadle/commit/c22e844481d15f0dac6e85bd032fd11b26565d50))
* Move cli to separate package ([#44](https://github.com/nam-hle/nadle/issues/44)) ([de5e348](https://github.com/nam-hle/nadle/commit/de5e348b593a55ac764a95fb27d7de22122bdd02))
* Re-organize test structure ([#136](https://github.com/nam-hle/nadle/issues/136)) ([6697fd2](https://github.com/nam-hle/nadle/commit/6697fd23c2e798c08be3e57e8f90c3ad7c7a89ed))
* Reduce scheduler complexity ([#166](https://github.com/nam-hle/nadle/issues/166)) ([1e22014](https://github.com/nam-hle/nadle/commit/1e2201401d4f99801ed2b00e87c1f523abdc493a))
* Remove --update flag ([#131](https://github.com/nam-hle/nadle/issues/131)) ([41f222a](https://github.com/nam-hle/nadle/commit/41f222aa4b302c9ca4318a4eeb20fa0dbe10fc31))
* **reporter:** Improve running tasks section ([#222](https://github.com/nam-hle/nadle/issues/222)) ([a206769](https://github.com/nam-hle/nadle/commit/a206769bf4d632d3b7f077786a07b5416cdb3481))
* Simplify dry run task list ([#84](https://github.com/nam-hle/nadle/issues/84)) ([f3c7f1c](https://github.com/nam-hle/nadle/commit/f3c7f1c7dbc0f108bd4fe23250545ac9a0ac6bd9))
* Test on windows ([#141](https://github.com/nam-hle/nadle/issues/141)) ([8799929](https://github.com/nam-hle/nadle/commit/8799929c13d9fbdb09364d4ca5b404ef9cd9dfff))
* Update version handling and display version in navbar ([#235](https://github.com/nam-hle/nadle/issues/235)) ([4a416ec](https://github.com/nam-hle/nadle/commit/4a416ec95579cba1a5ccf35733eae29761b16f96))
* Use readonly modifier for class properties and improve logging messages ([#143](https://github.com/nam-hle/nadle/issues/143)) ([92bcd75](https://github.com/nam-hle/nadle/commit/92bcd75abac76e75da76980c33f2aa695ca4f89e))
* Use tasks.register ([fa34818](https://github.com/nam-hle/nadle/commit/fa34818903e8f3e6c257ca17e2ac944a9f1afb10))


### Miscellaneous

* Add badges ([#144](https://github.com/nam-hle/nadle/issues/144)) ([c2c8707](https://github.com/nam-hle/nadle/commit/c2c87078cc22c16116b07ba559bf29bffcbd676c))
* Add knip ([#18](https://github.com/nam-hle/nadle/issues/18)) ([5a14614](https://github.com/nam-hle/nadle/commit/5a146140732790273648e9401f7ee43b1b0be23c))
* Add more package.json fields and root README ([#45](https://github.com/nam-hle/nadle/issues/45)) ([387c065](https://github.com/nam-hle/nadle/commit/387c065f5c8106b0ad1426ce02ccf56283f93629))
* Add package.json validators ([#46](https://github.com/nam-hle/nadle/issues/46)) ([48fd1cb](https://github.com/nam-hle/nadle/commit/48fd1cbbf64469a939a094e63b59e0a0ea17a572))
* Add README ([1351195](https://github.com/nam-hle/nadle/commit/1351195f61b96ade36f7b4111d39f0caeac43257))
* Bundle index.d.ts only ([#169](https://github.com/nam-hle/nadle/issues/169)) ([df2caeb](https://github.com/nam-hle/nadle/commit/df2caeb55da2487f2699402b21cc82f4a245c45c))
* Correct publish action ([#20](https://github.com/nam-hle/nadle/issues/20)) ([359a8ac](https://github.com/nam-hle/nadle/commit/359a8accdef8aa403cc3fccf5d8e1bfc43252239))
* **deps-dev:** Bump @types/node from 20.17.57 to 20.19.0 ([#209](https://github.com/nam-hle/nadle/issues/209)) ([2e7b949](https://github.com/nam-hle/nadle/commit/2e7b9495c9936465f05780e1d39c7bef29655eaf))
* **deps-dev:** Bump @types/node from 22.15.2 to 22.15.21 ([#60](https://github.com/nam-hle/nadle/issues/60)) ([1c29b7d](https://github.com/nam-hle/nadle/commit/1c29b7d6032012c852045f60c86561bf73940846))
* **deps-dev:** Bump @types/node from 22.15.21 to 22.15.29 ([#92](https://github.com/nam-hle/nadle/issues/92)) ([ac6c02a](https://github.com/nam-hle/nadle/commit/ac6c02acdf7f9e35e69029d089e61fd432bcba2a))
* **deps-dev:** Bump knip from 5.56.0 to 5.57.0 ([#39](https://github.com/nam-hle/nadle/issues/39)) ([4ee2339](https://github.com/nam-hle/nadle/commit/4ee2339978a327270742560161e96d5ce2ac8d23))
* **deps-dev:** Bump knip from 5.57.1 to 5.58.0 ([#58](https://github.com/nam-hle/nadle/issues/58)) ([d2fb038](https://github.com/nam-hle/nadle/commit/d2fb038b185daeefa62fe0bff46877e74dcaca92))
* **deps-dev:** Bump knip from 5.58.0 to 5.59.1 ([#99](https://github.com/nam-hle/nadle/issues/99)) ([431397f](https://github.com/nam-hle/nadle/commit/431397f234fa5ad49eca9fd67e01f446443c30fe))
* **deps-dev:** Bump knip from 5.59.1 to 5.60.2 ([#157](https://github.com/nam-hle/nadle/issues/157)) ([b679d5d](https://github.com/nam-hle/nadle/commit/b679d5d1a4dba724814608783231caa8b742b8e6))
* **deps-dev:** Bump knip from 5.60.2 to 5.61.0 ([#192](https://github.com/nam-hle/nadle/issues/192)) ([1ba2dd9](https://github.com/nam-hle/nadle/commit/1ba2dd9a129d43de4d911d9f1449418570a8413f))
* **deps-dev:** Bump nadle from 0.3.1 to 0.3.2 ([#83](https://github.com/nam-hle/nadle/issues/83)) ([cb056e8](https://github.com/nam-hle/nadle/commit/cb056e89484747218bd0efa69bdf1d57fe687fbb))
* **deps-dev:** Bump vitest from 3.1.2 to 3.1.4 ([#120](https://github.com/nam-hle/nadle/issues/120)) ([21147a6](https://github.com/nam-hle/nadle/commit/21147a66a2ca71356b1aa4208c8e5901cadfa819))
* **deps-dev:** Bump vitest from 3.1.4 to 3.2.2 ([#162](https://github.com/nam-hle/nadle/issues/162)) ([26af3b7](https://github.com/nam-hle/nadle/commit/26af3b70ae52e7e80606af68680c243fefa422f5))
* **deps-dev:** Bump vitest from 3.2.2 to 3.2.3 ([#173](https://github.com/nam-hle/nadle/issues/173)) ([277be91](https://github.com/nam-hle/nadle/commit/277be918c551624fc944aa085f52b22570f9e07d))
* **deps:** Bump execa from 9.5.2 to 9.6.0 ([#95](https://github.com/nam-hle/nadle/issues/95)) ([e81a0da](https://github.com/nam-hle/nadle/commit/e81a0dac765fcb31b88be66f76feeeb2004ad43b))
* **deps:** Bump glob from 11.0.2 to 11.0.3 ([#189](https://github.com/nam-hle/nadle/issues/189)) ([e7ce5e2](https://github.com/nam-hle/nadle/commit/e7ce5e2a99e8ee239e4fbcc9501c8f5a31138bb9))
* **deps:** Bump tinypool from 1.0.2 to 1.1.0 ([#96](https://github.com/nam-hle/nadle/issues/96)) ([aed711a](https://github.com/nam-hle/nadle/commit/aed711a3ef5fe97569941e3a6d28d6be1c8c0b43))
* **deps:** Bump tinypool from 1.1.0 to 1.1.1 ([#218](https://github.com/nam-hle/nadle/issues/218)) ([414f325](https://github.com/nam-hle/nadle/commit/414f3256259e382965836d72ebfe933392c1d50f))
* **deps:** Bump yargs from 17.7.2 to 18.0.0 ([#93](https://github.com/nam-hle/nadle/issues/93)) ([5429fe6](https://github.com/nam-hle/nadle/commit/5429fe600fff10a54c98fa2756c1ecd431158bd2))
* Fix permission error when installing or running test using lib from tsc ([#152](https://github.com/nam-hle/nadle/issues/152)) ([65f2924](https://github.com/nam-hle/nadle/commit/65f2924e20abaf7c0f1297d5ef07e0c86b9b25eb))
* Improve scripts ([#31](https://github.com/nam-hle/nadle/issues/31)) ([1345528](https://github.com/nam-hle/nadle/commit/134552855bd52da2d9417ba55f8bd9bb4c7e26a1))
* Integrate @vitest/eslint-plugin ([#160](https://github.com/nam-hle/nadle/issues/160)) ([667922c](https://github.com/nam-hle/nadle/commit/667922cec9dc00e7961faf4e084faccc898c830f))
* Integrate nadle 0.2.3 ([#24](https://github.com/nam-hle/nadle/issues/24)) ([9837654](https://github.com/nam-hle/nadle/commit/9837654d5e8364de339480b634f2fff7df689856))
* Integrate size-limit action ([#168](https://github.com/nam-hle/nadle/issues/168)) ([e0eadf7](https://github.com/nam-hle/nadle/commit/e0eadf70fda3b066010a04d5ebdc3319e0b543e3))
* Move test package back to nadle ([#79](https://github.com/nam-hle/nadle/issues/79)) ([3306169](https://github.com/nam-hle/nadle/commit/3306169fa83e59316e8a98d75808d8a6fd292d99))
* Reduce default render interval and improve duration formatting ([#153](https://github.com/nam-hle/nadle/issues/153)) ([fbf298b](https://github.com/nam-hle/nadle/commit/fbf298b91396db0c71d8da163258929969d4f493))
* Release v0.3.6 ([#237](https://github.com/nam-hle/nadle/issues/237)) ([77e3d80](https://github.com/nam-hle/nadle/commit/77e3d80ea8b2775c189ecac3d45a52e5569c66c3))
* Remove other changelog libraries ([962ec71](https://github.com/nam-hle/nadle/commit/962ec71ad118880c0f2e39cccb66d7c66bd7eaa0))
* Remove redundant bin folder ([#138](https://github.com/nam-hle/nadle/issues/138)) ([23036af](https://github.com/nam-hle/nadle/commit/23036afa2441a7144c1ccbc0040a795bf66463b0))
* Remove sourcemap and code splitting options ([#195](https://github.com/nam-hle/nadle/issues/195)) ([9e67378](https://github.com/nam-hle/nadle/commit/9e6737889e7e21edd882373ac899209d69745b10))
* Setup husky & lint-staged ([#21](https://github.com/nam-hle/nadle/issues/21)) ([fd0e190](https://github.com/nam-hle/nadle/commit/fd0e190afe30ac88c9db7a6f339353800013ba99))
* Simplify readme & add license ([#76](https://github.com/nam-hle/nadle/issues/76)) ([a0337f2](https://github.com/nam-hle/nadle/commit/a0337f2612cb888d6f9cbff4cfee69dae8c7c32e))
* Update documentation link ([#49](https://github.com/nam-hle/nadle/issues/49)) ([7f59f98](https://github.com/nam-hle/nadle/commit/7f59f987819b217ae61448456e9afa01cf620599))
* Update homepage ([#61](https://github.com/nam-hle/nadle/issues/61)) ([2ee8628](https://github.com/nam-hle/nadle/commit/2ee862898f8ac01e77864d6bebc3e7fa0452dc1c))
* Update release-please configuration and version annotation ([467f3e4](https://github.com/nam-hle/nadle/commit/467f3e492add2bc77821c359278a0a9546f33b40))
* Update release-please version annotation comment ([fb9bebf](https://github.com/nam-hle/nadle/commit/fb9bebf48f937039282a5c3773a000b971ee43a9))
* Use uncompress size ([#201](https://github.com/nam-hle/nadle/issues/201)) ([246334d](https://github.com/nam-hle/nadle/commit/246334d9def34a70dcbbc3ee6647997f8abfe8c5))

## [0.3.6](https://github.com/nam-hle/nadle/compare/v0.3.5...v0.3.6) (2025-06-22)


### Features

* Add projectDir resolution ([#204](https://github.com/nam-hle/nadle/issues/204)) ([c559100](https://github.com/nam-hle/nadle/commit/c5591007d269cd3b48c24f92a7986a8847430d64))
* **caching:** Add --no-cache option to disable task caching ([#240](https://github.com/nam-hle/nadle/issues/240)) ([f4a681f](https://github.com/nam-hle/nadle/commit/f4a681fb9aba496d7c3e26e1c252115b4b167a99))
* **caching:** Add input and output declarations for tasks ([#184](https://github.com/nam-hle/nadle/issues/184)) ([4cfcaee](https://github.com/nam-hle/nadle/commit/4cfcaee8d516ff47b80c44b23d173cc2b6fbcfd8))
* **caching:** Allow task to be up-to-date ([#198](https://github.com/nam-hle/nadle/issues/198)) ([f01d92f](https://github.com/nam-hle/nadle/commit/f01d92f720dc4163af7631ad2aeafaa0b0d2aaee))
* **caching:** Cache key/metadata generation and detection ([#194](https://github.com/nam-hle/nadle/issues/194)) ([f93d7f7](https://github.com/nam-hle/nadle/commit/f93d7f76e30d6816ecbfb3ae99439d03ce13f817))
* **caching:** Implement CacheManager ([#182](https://github.com/nam-hle/nadle/issues/182)) ([38956cd](https://github.com/nam-hle/nadle/commit/38956cdb98adf6b0007d1752a37043ec74d5206a))
* **caching:** Implement output caching and restoration ([#203](https://github.com/nam-hle/nadle/issues/203)) ([f7c34cc](https://github.com/nam-hle/nadle/commit/f7c34ccce8026c34090da0dff7bee5f26e4be10f))
* **caching:** Introduce Inputs/Outputs declarations ([#234](https://github.com/nam-hle/nadle/issues/234)) ([fc315a8](https://github.com/nam-hle/nadle/commit/fc315a88e4b413215be305bd2f6e639134fb7a6f))
* **caching:** Update output caching to use projectDir for saving and restoring outputs ([#215](https://github.com/nam-hle/nadle/issues/215)) ([7ae1aec](https://github.com/nam-hle/nadle/commit/7ae1aecd7b989e5077470436219096a84adfac3f))
* **caching:** Use object-hash instead of self implementing ([3d69c1f](https://github.com/nam-hle/nadle/commit/3d69c1f39e66aaca193480068bc0f08c6733fb9c))
* **reporter:** Add support for task status 'up-to-date' and 'from-cache' ([#217](https://github.com/nam-hle/nadle/issues/217)) ([26ad307](https://github.com/nam-hle/nadle/commit/26ad3079c46c38cac4c4ebfe7a041259d4e20a47))


### Bug Fixes

* Suppress initial logs until loading configuration file ([#238](https://github.com/nam-hle/nadle/issues/238)) ([a9cb70c](https://github.com/nam-hle/nadle/commit/a9cb70c77e864214819d2d64f01e9b9fcda04fa4))


### Internal

* Add project directory test for various package managers ([#226](https://github.com/nam-hle/nadle/issues/226)) ([b350bf1](https://github.com/nam-hle/nadle/commit/b350bf1f98023d418a82d5199a85550f6d645f9c))
* Implement custom Vitest matchers for task order and status assertions ([#243](https://github.com/nam-hle/nadle/issues/243)) ([962ec71](https://github.com/nam-hle/nadle/commit/962ec71ad118880c0f2e39cccb66d7c66bd7eaa0))
* Increase timeout for order execution tests ([391f0d3](https://github.com/nam-hle/nadle/commit/391f0d37d0a9aac5f89e28f0c1a19660846b6e66))
* Increase timeout for order tests in basic.test.ts ([7b1178c](https://github.com/nam-hle/nadle/commit/7b1178c886f96174a00cce5d7992911af5ac5596))
* **reporter:** Improve running tasks section ([#222](https://github.com/nam-hle/nadle/issues/222)) ([a206769](https://github.com/nam-hle/nadle/commit/a206769bf4d632d3b7f077786a07b5416cdb3481))
* Update version handling and display version in navbar ([#235](https://github.com/nam-hle/nadle/issues/235)) ([4a416ec](https://github.com/nam-hle/nadle/commit/4a416ec95579cba1a5ccf35733eae29761b16f96))


### Miscellaneous

* **deps-dev:** Bump @types/node from 20.17.57 to 20.19.0 ([#209](https://github.com/nam-hle/nadle/issues/209)) ([2e7b949](https://github.com/nam-hle/nadle/commit/2e7b9495c9936465f05780e1d39c7bef29655eaf))
* **deps-dev:** Bump knip from 5.60.2 to 5.61.0 ([#192](https://github.com/nam-hle/nadle/issues/192)) ([1ba2dd9](https://github.com/nam-hle/nadle/commit/1ba2dd9a129d43de4d911d9f1449418570a8413f))
* **deps-dev:** Bump vitest from 3.2.2 to 3.2.3 ([#173](https://github.com/nam-hle/nadle/issues/173)) ([277be91](https://github.com/nam-hle/nadle/commit/277be918c551624fc944aa085f52b22570f9e07d))
* **deps:** Bump glob from 11.0.2 to 11.0.3 ([#189](https://github.com/nam-hle/nadle/issues/189)) ([e7ce5e2](https://github.com/nam-hle/nadle/commit/e7ce5e2a99e8ee239e4fbcc9501c8f5a31138bb9))
* **deps:** Bump tinypool from 1.1.0 to 1.1.1 ([#218](https://github.com/nam-hle/nadle/issues/218)) ([414f325](https://github.com/nam-hle/nadle/commit/414f3256259e382965836d72ebfe933392c1d50f))
* Remove other changelog libraries ([962ec71](https://github.com/nam-hle/nadle/commit/962ec71ad118880c0f2e39cccb66d7c66bd7eaa0))
* Remove sourcemap and code splitting options ([#195](https://github.com/nam-hle/nadle/issues/195)) ([9e67378](https://github.com/nam-hle/nadle/commit/9e6737889e7e21edd882373ac899209d69745b10))
* Update release-please configuration and version annotation ([467f3e4](https://github.com/nam-hle/nadle/commit/467f3e492add2bc77821c359278a0a9546f33b40))
* Update release-please version annotation comment ([fb9bebf](https://github.com/nam-hle/nadle/commit/fb9bebf48f937039282a5c3773a000b971ee43a9))
* Use uncompress size ([#201](https://github.com/nam-hle/nadle/issues/201)) ([246334d](https://github.com/nam-hle/nadle/commit/246334d9def34a70dcbbc3ee6647997f8abfe8c5))

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
