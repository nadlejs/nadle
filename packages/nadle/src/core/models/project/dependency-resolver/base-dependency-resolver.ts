import { type Project } from "../project.js";

export abstract class BaseDependencyResolver {
	public abstract resolve(project: Project): Project;
}
