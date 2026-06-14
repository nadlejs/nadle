import { tasks } from "nadle";

tasks.register("check");

tasks.register("build", { dependsOn: ["check", "api:check", "shared:types:check"] });
