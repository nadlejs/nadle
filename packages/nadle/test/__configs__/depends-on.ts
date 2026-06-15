import { tasks } from "nadle";

tasks.register("node");

tasks.register("install", { dependsOn: ["node"] });

tasks.register("compileTs", { dependsOn: ["install"] });

tasks.register("compileSvg", { dependsOn: ["install"] });

tasks.register("compile", { dependsOn: ["compileSvg", "compileTs"] });

tasks.register("test", { dependsOn: ["install"] });

tasks.register("build", { dependsOn: ["test", "compile"] });
