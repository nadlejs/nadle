import { tasks } from "nadle";

tasks.register("task-A.0");
tasks.register("task-A.1");
tasks.register("task-A.2");
tasks.register("task-A").config({ dependsOn: ["task-A.0", "task-A.1", "task-A.2"] });

tasks.register("task-B.0");
tasks.register("task-B.1");
tasks.register("task-B.2");
tasks.register("task-B").config({ dependsOn: ["task-B.0", "task-B.1", "task-B.2"] });

tasks.register("task-C.0");
tasks.register("task-C.1");
tasks.register("task-C.2");
tasks.register("task-C").config({ dependsOn: ["task-A", "task-B", "task-C.0", "task-C.1", "task-C.2"] });
