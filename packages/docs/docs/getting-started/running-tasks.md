---
sidebar_position: 3
---

# Running Tasks

You can run tasks using the Nadle CLI:

```bash
# Run a single task
nadle hello

# Run multiple tasks
nadle clean build

# List available tasks
nadle --list

# Run with specific config file
nadle --config custom.nadle.ts build

# Dry run to see task execution order
nadle --dry-run build
```

## Next Steps

- Learn about [Advanced Configuration](../advanced-configuration.md)
- Explore the [API Reference](../api/index.md)
- Check out [Task Patterns](../task-patterns.md) for common use cases 