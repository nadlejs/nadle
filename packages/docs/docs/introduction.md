---
sidebar_position: 1
---

# Introduction

Nadle is a modern, type-safe task runner for Node.js that draws inspiration from the powerful Gradle build tool. It's designed to make build automation and task management both efficient and developer-friendly, with first-class TypeScript support.

## Why Nadle?

Nadle stands out from other task runners with its unique combination of features:

- **Type Safety**: Built from the ground up with TypeScript, providing complete type inference and compile-time checks
- **Modern Architecture**: Pure ESM package designed for modern Node.js environments
- **Parallel Execution**: Automatically runs independent tasks in parallel for optimal performance
- **Dependency Management**: Smart task dependency resolution and management
- **Progress Tracking**: Built-in progress tracking for long-running tasks
- **Flexible Logging**: Configurable logging levels to control output verbosity

## Key Features

### 1. Type-Safe Task Definitions
Define your tasks with full TypeScript support, ensuring that your build scripts are reliable and maintainable.

### 2. Parallel Task Execution
Nadle automatically analyzes task dependencies and executes independent tasks in parallel, optimizing build times.

### 3. Dependency Management
Clearly define task dependencies and let Nadle handle the execution order:
- Automatic dependency resolution
- Circular dependency detection
- Optional dependencies support

### 4. Progress Tracking
Monitor task execution with built-in progress tracking:
- Real-time execution status
- Task duration measurements
- Clear error reporting

### 5. Flexible Configuration
Customize Nadle to suit your project needs:
- Multiple configuration file support
- Environment-specific settings
- Extensible plugin system

## Getting Started

To start using Nadle in your project, check out our [Quick Start Guide](./getting-started.md) or dive into the [API Reference](./api/index.md) for detailed documentation. 