import { tasks, CopyTask } from "nadle";

tasks.register("copyAssets", { run: CopyTask, options: { into: "dist", from: "assets" } });
tasks.register("copyFoo", { run: CopyTask, options: { into: "dist", from: "foo.txt" } });
tasks.register("copyToNested", { run: CopyTask, options: { from: "foo.txt", into: "dist/sub/nested" } });
tasks.register("copyWithFilter", { run: CopyTask, options: { into: "dist", from: "assets", exclude: ["bar.txt"], include: ["**/*.txt"] } });
