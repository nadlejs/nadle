import { tasks, Inputs, Outputs } from "nadle";

// A cacheable leaf (declares inputs + outputs) feeding a non-cacheable aggregate.
tasks.register("compile", () => {}).config({ outputs: [Outputs.dirs("dist")], inputs: [Inputs.files("input.txt")] });

tasks.register("bundle", () => {}).config({ dependsOn: ["compile"] });
