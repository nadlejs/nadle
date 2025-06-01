import { tasks, type Task } from "nadle";

const printWorkingDirTask: Task = {
	run: ({ context }) => console.log(`Current working directory: ${context.workingDir}`)
};

tasks.register("current", ({ context }) => console.log(`Current working directory: ${context.workingDir}`)).config({ workingDir: "." });
tasks.register("oneLevelDown", printWorkingDirTask, {}).config({ workingDir: "./subdir1" });
tasks.register("twoLevelsDown", printWorkingDirTask, {}).config({ workingDir: "./subdir1/subdir2" });
tasks.register("oneLevelUp", printWorkingDirTask, {}).config({ workingDir: ".." });
tasks.register("twoLevelsUp", printWorkingDirTask, {}).config({ workingDir: "../.." });
