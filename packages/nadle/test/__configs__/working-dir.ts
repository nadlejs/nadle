import { tasks, type Task } from "nadle";

const printWorkingDirTask: Task = {
	run: ({ context }) => console.log(`Current working directory: ${context.workingDir}`)
};

tasks.register("current", { run: ({ context }) => console.log(`Current working directory: ${context.workingDir}`), workingDir: "." });
tasks.register("oneLevelDown", { run: printWorkingDirTask, workingDir: "./subdir1" });
tasks.register("twoLevelsDown", { run: printWorkingDirTask, workingDir: "./subdir1/subdir2" });
tasks.register("oneLevelUp", { run: printWorkingDirTask, workingDir: ".." });
tasks.register("twoLevelsUp", { run: printWorkingDirTask, workingDir: "../.." });
