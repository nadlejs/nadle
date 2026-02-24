import { tasks } from "nadle";

tasks.register("check");

tasks.register("build").config({ dependsOn: ["check"] });
