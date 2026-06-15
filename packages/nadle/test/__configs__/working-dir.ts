import { tasks, type Task } from "nadle";

const printWorkingDirTask: Task = {
	run: ({ context }) => console.log(`Current working directory: ${context.workingDir}`)
};

tasks.register("current", { workingDir: ".", run: ({ context }) => console.log(`Current working directory: ${context.workingDir}`) });
tasks.register("oneLevelDown", { workingDir: "./subdir1", run: printWorkingDirTask });
tasks.register("twoLevelsDown", { run: printWorkingDirTask, workingDir: "./subdir1/subdir2" });
tasks.register("oneLevelUp", { workingDir: "..", run: printWorkingDirTask });
tasks.register("twoLevelsUp", { workingDir: "../..", run: printWorkingDirTask });
