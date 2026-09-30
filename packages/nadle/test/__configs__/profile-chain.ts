import { tasks, Inputs, Outputs } from "nadle";

// A cacheable leaf (declares inputs + outputs) feeding a non-cacheable aggregate.
tasks.register("compile", { run: () => {}, outputs: [Outputs.dirs("dist")], inputs: [Inputs.files("input.txt")] });

tasks.register("bundle", { run: () => {}, dependsOn: ["compile"] });
