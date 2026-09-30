import { tasks, DeleteTask } from "nadle";

tasks.register("deleteFolderA", { run: DeleteTask, options: { paths: "a" } });
tasks.register("deleteFolderB1", { run: DeleteTask, options: { paths: "./b/b1" } });
tasks.register("deleteFileBaz", { run: DeleteTask, options: { paths: "./b/baz.txt" } });
tasks.register("deleteFilesFooBar", { run: DeleteTask, options: { paths: ["./foo.txt", "./a/bar.txt"] } });
tasks.register("deleteJsonFiles", { run: DeleteTask, options: { paths: ["**/*.json"] } });
