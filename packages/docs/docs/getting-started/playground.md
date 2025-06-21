# Playground

Want to try Nadle without installing anything? You can experiment with Nadle directly
in your browser using our [CodeSandbox](https://codesandbox.io) integration.

[![Edit @nadle/internal-example-basic](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/p/sandbox/github/nam-hle/nadle/tree/sandbox/packages/examples/basic?embed=1&file=%2Fnadle.config.ts&showConsole=true)

## What's in the Playground?

The demo project includes:

1. A basic TypeScript project setup
2. Pre-configured `nadle.config.ts`
3. Example tasks for common scenarios
4. Interactive terminal to run commands

<iframe src="https://codesandbox.io/p/sandbox/github/nam-hle/nadle/tree/main/packages/examples/basic?embed=1&file=%2Fnadle.config.ts&showConsole=true&view=editor"
style={{width:"100%", height: "500px", border:0, borderRadius: "4px", overflow:"hidden"}}
sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
title="Nadle playground"
></iframe>

## Example Tasks to Try

Once the demo loads, try these commands in the terminal:

```bash
# List all available tasks
nadle --list

# Show the current resolved configuration
nadle --show-config

# Run the hello task
nadle hello
```

Feel free to modify the code and experiment with different configurations!
