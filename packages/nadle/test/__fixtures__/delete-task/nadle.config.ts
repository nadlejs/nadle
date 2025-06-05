import { tasks, DeleteTask } from "nadle";

tasks.register("deleteFolderA", DeleteTask, { paths: "a" });
tasks.register("deleteFolderB1", DeleteTask, { paths: "./b/b1" });
tasks.register("deleteFileBaz", DeleteTask, { paths: "./b/baz.txt" });
tasks.register("deleteFilesFooBar", DeleteTask, { paths: ["./foo.txt", "./a/bar.txt"] });
tasks.register("deleteJsonFiles", DeleteTask, { paths: ["**/*.json"] });
