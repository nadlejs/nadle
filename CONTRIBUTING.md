# Contributing

## Setting Up the Environment

1. Run `pnpm install` in the root of the repository to install all dependencies.
2. Run `nadle build` to build the project.

## Running Tests

You can run the tests of the project that you modified by going to the project's directory and running:

```shell
nadle test
```

For a quicker local loop, `nadle testChanged` runs only the tests affected by your changes against
`origin/main`. It is a convenience: CI always runs the full suite.

## Formatting Code

You can format the code using the following command:

```shell
nadle format
```

## Start Development

You can run the project in development mode using:

```shell
pnpm start
```
