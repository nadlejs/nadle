import { tasks } from "nadle";

tasks.register("node");

tasks.register("install").config({ dependsOn: ["node"] });

tasks.register("compileTs").config({ dependsOn: ["install"] });

tasks.register("compileSvg").config({ dependsOn: ["install"] });

tasks.register("compile").config({ dependsOn: ["compileSvg", "compileTs"] });

tasks.register("test").config({ dependsOn: ["install"] });

tasks.register("build").config({ dependsOn: ["test", "compile"] });
