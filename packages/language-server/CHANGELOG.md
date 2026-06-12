# Changelog

## [0.0.5](https://github.com/nadlejs/nadle/compare/language-server/v0.0.4...language-server/v0.0.5) (2026-06-12)


### Bug Fixes

* Resolve workspace dependencies in published packages ([#625](https://github.com/nadlejs/nadle/issues/625)) ([4cba337](https://github.com/nadlejs/nadle/commit/4cba3378a8b6643d9d95a4f94191766f129df120))

## [0.0.4](https://github.com/nadlejs/nadle/compare/language-server/v0.0.3...language-server/v0.0.4) (2026-06-12)


### Features

* Add documentSymbol support to the language server ([#589](https://github.com/nadlejs/nadle/issues/589)) ([edcaac7](https://github.com/nadlejs/nadle/commit/edcaac7972eac3cce64b9341c580e6a81ec0c87a))
* Add textDocument/references support to language server ([#527](https://github.com/nadlejs/nadle/issues/527)) ([6332d43](https://github.com/nadlejs/nadle/commit/6332d43279ef0b7934fe490cb32fa2d76b29e9e8))
* Extract @nadle/project package and refactor nadle core ([#540](https://github.com/nadlejs/nadle/issues/540)) ([3525cbd](https://github.com/nadlejs/nadle/commit/3525cbdd4f62a22dbf9074ce1fdb7850e85256ea))
* Introduce project-resolver package, enhance language server workspace discovery, and cross-workspace LSP logic ([#541](https://github.com/nadlejs/nadle/issues/541)) ([cb267ca](https://github.com/nadlejs/nadle/commit/cb267ca06a6e782aad8d903271e74b8dfd12e485))
* Publish nadle-lsp as standalone npm package ([#510](https://github.com/nadlejs/nadle/issues/510)) ([4e7c4be](https://github.com/nadlejs/nadle/commit/4e7c4bec2d65ffb3ea6523e10d11a39a4b43b146))


### Bug Fixes

* Rename language server binary to nadle-language-server ([#532](https://github.com/nadlejs/nadle/issues/532)) ([bc96417](https://github.com/nadlejs/nadle/commit/bc96417b47d338a43b8e5671f0a578953dffcef0))
* Repair CI fallout from bin shim removal and pnpm 11 ([#622](https://github.com/nadlejs/nadle/issues/622)) ([1286458](https://github.com/nadlejs/nadle/commit/12864584ac8ef541bfa38b91ca916a5bcf2187c0))
* Use paragraph breaks between hover detail lines ([#528](https://github.com/nadlejs/nadle/issues/528)) ([a9618e8](https://github.com/nadlejs/nadle/commit/a9618e80091578b7daf939071dd9453408b48f52))


### Internal

* Add publishConfig access public to all packages ([15b1c7f](https://github.com/nadlejs/nadle/commit/15b1c7f466ecd17731b445f01b5d6d1810e4a65c))
* Consolidate build tasks and simplify tsconfig usage ([#518](https://github.com/nadlejs/nadle/issues/518)) ([37a1dc6](https://github.com/nadlejs/nadle/commit/37a1dc6917ca763f8065c19411918b4a8760a563))
* **deps-dev:** Bump size-limit from 11.2.0 to 12.1.0 ([#597](https://github.com/nadlejs/nadle/issues/597)) ([810b595](https://github.com/nadlejs/nadle/commit/810b59509fe74b0ef59015493eb69475260eb1a3))
* **deps:** Bump the minor-updates group across 1 directory with 29 updates ([#581](https://github.com/nadlejs/nadle/issues/581)) ([367ba74](https://github.com/nadlejs/nadle/commit/367ba74b2ff9a679826b5d42e14ce957bd4bfd11))
* Migrate nadle configs from ExecTask to PnpxTask ([#520](https://github.com/nadlejs/nadle/issues/520)) ([78f2ebd](https://github.com/nadlejs/nadle/commit/78f2ebd9435c182c0cfb5b2e423b53961bad80c5))
* Minimal package scripts, tighter task caching, and shim-free bins ([#620](https://github.com/nadlejs/nadle/issues/620)) ([5955d4b](https://github.com/nadlejs/nadle/commit/5955d4b4ff167a3cf2a675fbcef2966a68072601))
* Release language-server v0.0.2 ([#511](https://github.com/nadlejs/nadle/issues/511)) ([0725216](https://github.com/nadlejs/nadle/commit/0725216e5010fc4c475daa5887f0220adc4be00c))
* Release language-server v0.0.3 ([#513](https://github.com/nadlejs/nadle/issues/513)) ([7f66dbe](https://github.com/nadlejs/nadle/commit/7f66dbe8ed73e8459f68036e689fc9dfcb70a6c9))
* Unify build pipeline - single compile, bundle, and test entry points at root ([#618](https://github.com/nadlejs/nadle/issues/618)) ([809fc6e](https://github.com/nadlejs/nadle/commit/809fc6e4ffe9e24d639a785e396474fecabe33e2))
* Upgrade pnpm to 11 ([#621](https://github.com/nadlejs/nadle/issues/621)) ([8ca0d9c](https://github.com/nadlejs/nadle/commit/8ca0d9c0acdf12505d9daeb52e419f755584b6ed))
* Use tsgo (TypeScript native preview) for build and typecheck ([#617](https://github.com/nadlejs/nadle/issues/617)) ([b87bc1a](https://github.com/nadlejs/nadle/commit/b87bc1a2577b17354d46c4d8097db31f12c6fae3))

## [0.0.3](https://github.com/nadlejs/nadle/compare/language-server/v0.0.2...language-server/v0.0.3) (2026-02-21)


### Features

* Publish nadle-lsp as standalone npm package ([#510](https://github.com/nadlejs/nadle/issues/510)) ([4e7c4be](https://github.com/nadlejs/nadle/commit/4e7c4bec2d65ffb3ea6523e10d11a39a4b43b146))


### Internal

* Add publishConfig access public to all packages ([15b1c7f](https://github.com/nadlejs/nadle/commit/15b1c7f466ecd17731b445f01b5d6d1810e4a65c))
* Release language-server v0.0.2 ([#511](https://github.com/nadlejs/nadle/issues/511)) ([0725216](https://github.com/nadlejs/nadle/commit/0725216e5010fc4c475daa5887f0220adc4be00c))

## [0.0.2](https://github.com/nadlejs/nadle/compare/language-server/v0.0.1...language-server/v0.0.2) (2026-02-21)


### Features

* Publish nadle-lsp as standalone npm package ([#510](https://github.com/nadlejs/nadle/issues/510)) ([4e7c4be](https://github.com/nadlejs/nadle/commit/4e7c4bec2d65ffb3ea6523e10d11a39a4b43b146))
