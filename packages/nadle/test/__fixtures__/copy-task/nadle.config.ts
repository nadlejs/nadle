import { tasks, CopyTask } from "nadle";

tasks.register("copyAssets", CopyTask, { into: "dist", from: "assets" });
tasks.register("copyFoo", CopyTask, { into: "dist", from: "foo.txt" });
tasks.register("copyToNested", CopyTask, { from: "foo.txt", into: "dist/sub/nested" });
tasks.register("copyWithFilter", CopyTask, { into: "dist", from: "assets", exclude: ["bar.txt"], include: ["**/*.txt"] });
