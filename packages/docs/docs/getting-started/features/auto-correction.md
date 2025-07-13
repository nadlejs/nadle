# Autocorrection

Nadle helps prevent common mistakes by intelligently handling typos, partial names, and aliases when running tasks.
If a workspace or task name is misspelled or partially entered, Nadle attempts to resolve it to the closest match.
If exactly one match is found, Nadle proceeds with execution and displays a clear message showing what was resolved and which tasks or workspaces will be run.

However, if multiple matching task names or workspaces are found, Nadle stops execution and reports the ambiguity,
listing the possible matches.

For example:

```sh
# Typo in workspace name
nadle backe:build
# Nadle will resolve to 'backend:build'

# Typo in task name
nadle biuld
# Nadle will resolve to 'frontend:build' (if run from the frontend workspace)

# Typo in both workspace and task name
nadle backe:biuld
# Nadle will resolve to 'backend:build'

# Unknown task with suggestions
nadle compile
# Nadle will suggest: Did you mean 'compileTs', 'compileJs', or 'compileCss'?

# Unknown workspace
nadle unknown:build
# Nadle will throw: Workspace unknown not found.
```

This autocorrect feature applies to both workspace and task names, streamlining your workflow and reducing errors.
