import { tasks } from "nadle";

tasks.register("cycle-1").config({ dependsOn: ["cycle-2"] });
tasks.register("cycle-2").config({ dependsOn: ["cycle-3"] });
tasks.register("cycle-3").config({ dependsOn: ["cycle-4"] });
tasks.register("cycle-4").config({ dependsOn: ["cycle-5"] });
tasks.register("cycle-5").config({ dependsOn: ["cycle-2"] });

tasks.register("cycle-6").config({ dependsOn: ["cycle-7"] });
tasks.register("cycle-7").config({ dependsOn: ["cycle-6"] });

tasks.register("cycle-8").config({ dependsOn: ["cycle-8"] });
