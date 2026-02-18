# Quickstart: Verifying Worker Init Optimization

## Prerequisite

Build the project after the change:

```bash
pnpm -F nadle build:tsup
```

## Verify: All Tests Pass (SC-001)

```bash
pnpm -F nadle test
```

Expected: All 326+ tests pass without modification.

## Verify: Type Check Clean

```bash
npx tsc -p packages/nadle/tsconfig.build.json --noEmit
```

Expected: No type errors.

## Verify: Debug Logging Shows Optimized Path (US3)

Run the sample-app with debug logging:

```bash
cd packages/sample-app
npx nadle build --parallel --log-level debug
```

Look for log output indicating config file loading without project resolution messages.
Workers should log config file loading but NOT project discovery/monorepo detection.

## Verify: Bundle Size Within Limit (SC-004)

```bash
cd packages/nadle
npx size-limit
```

Expected: Bundle size remains under 140 KB.
