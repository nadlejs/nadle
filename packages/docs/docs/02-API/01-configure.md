# configure

The `configure` function is used to set up global configuration for your Nadle build. This reference covers all available options and their usage.

## Basic Usage

```typescript
import { configure } from 'nadle';

configure({
  projectName: 'my-project',
  workspaceRoot: process.cwd(),
  logLevel: 'info'
});
```

## Configuration Options

### Core Options

#### `projectName`
- Type: `string`
- Default: Package name from `package.json`
- Description: The name of your project

```typescript
configure({
  projectName: 'my-awesome-project'
});
```

#### `workspaceRoot`
- Type: `string`
- Default: `process.cwd()`
- Description: The root directory of your project

```typescript
configure({
  workspaceRoot: '/path/to/project'
});
```

#### `logLevel`
- Type: `'error' | 'warn' | 'info' | 'debug'`
- Default: `'info'`
- Description: The default logging level

```typescript
configure({
  logLevel: 'debug'
});
```

### Execution Options

#### `parallel`
- Type: `boolean | number`
- Default: `true`
- Description: Enable parallel task execution or set max parallel tasks

```typescript
configure({
  parallel: 4 // Run up to 4 tasks in parallel
});
```

#### `plugins`
- Type: `Plugin[]`
- Default: `[]`
- Description: List of Nadle plugins to use

```typescript
import { TypeScriptPlugin } from '@nadle/typescript';

configure({
  plugins: [
    new TypeScriptPlugin({
      tsconfig: 'tsconfig.json'
    })
  ]
});
```

### Environment Options

#### `environment`
- Type: `Record<string, string>`
- Default: `{}`
- Description: Global environment variables

```typescript
configure({
  environment: {
    NODE_ENV: 'development',
    API_URL: 'http://localhost:3000'
  }
});
```

#### `environmentFiles`
- Type: `string[]`
- Default: `['.env', '.env.local']`
- Description: List of environment files to load

```typescript
configure({
  environmentFiles: [
    '.env',
    '.env.local',
    '.env.${env}'
  ]
});
```

### Advanced Options

#### `hooks`
- Type: `BuildHooks`
- Description: Build lifecycle hooks

```typescript
configure({
  hooks: {
    beforeTask: async (taskName) => {
      console.log(`Starting task: ${taskName}`);
    },
    afterTask: async (taskName, success) => {
      console.log(`Task ${taskName} finished: ${success}`);
    }
  }
});
```

#### `cache`
- Type: `CacheOptions`
- Description: Task caching configuration

```typescript
configure({
  cache: {
    enabled: true,
    directory: '.nadle-cache'
  }
});
```

## Type Definitions

### `ConfigureOptions`

```typescript
interface ConfigureOptions {
  projectName?: string;
  workspaceRoot?: string;
  logLevel?: LogLevel;
  parallel?: boolean | number;
  plugins?: Plugin[];
  environment?: Record<string, string>;
  environmentFiles?: string[];
  hooks?: BuildHooks;
  cache?: CacheOptions;
}
```

### `LogLevel`

```typescript
type LogLevel = 'error' | 'warn' | 'info' | 'debug';
```

### `BuildHooks`

```typescript
interface BuildHooks {
  beforeTask?: (taskName: string) => Promise<void>;
  afterTask?: (taskName: string, success: boolean) => Promise<void>;
  beforeBuild?: () => Promise<void>;
  afterBuild?: (success: boolean) => Promise<void>;
}
```

### `CacheOptions`

```typescript
interface CacheOptions {
  enabled?: boolean;
  directory?: string;
  ttl?: number;
}
```

## Examples

### Basic Configuration

```typescript
configure({
  projectName: 'my-project',
  logLevel: 'info',
  parallel: true
});
```

### With Plugins and Environment

```typescript
import { TypeScriptPlugin } from '@nadle/typescript';
import { DockerPlugin } from '@nadle/docker';

configure({
  projectName: 'my-project',
  plugins: [
    new TypeScriptPlugin(),
    new DockerPlugin()
  ],
  environment: {
    NODE_ENV: 'development'
  }
});
```

### With Hooks

```typescript
configure({
  hooks: {
    beforeTask: async (taskName) => {
      console.log(`Starting: ${taskName}`);
    },
    afterTask: async (taskName, success) => {
      console.log(`Finished ${taskName}: ${success}`);
    },
    beforeBuild: async () => {
      console.log('Build starting');
    },
    afterBuild: async (success) => {
      console.log(`Build finished: ${success}`);
    }
  }
});
```

### With Caching

```typescript
configure({
  cache: {
    enabled: true,
    directory: '.nadle-cache',
    ttl: 3600 // 1 hour
  }
});
```

## See Also

- [Build File Configuration](../configuration/build-file.md)
- [CLI Configuration](../configuration/cli.md)
- [Task API](./tasks-register.md) 