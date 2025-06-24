import { tasks, CopyTask } from "nadle";

tasks.register("copyAssets", CopyTask, { to: "dist", from: "assets" });
tasks.register("copyFoo", CopyTask, { to: "dist", from: "foo.txt" });
tasks.register("copyToNested", CopyTask, { from: "foo.txt", to: "dist/sub/nested" });
tasks.register("copyWithFilter", CopyTask, { to: "dist", from: "assets", exclude: ["bar.txt"], include: ["**/*.txt"] });
