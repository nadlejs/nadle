# nadle

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
