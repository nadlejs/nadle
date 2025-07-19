import { type Project } from "../project.js";
import { NpmDependencyResolver } from "./npm-dependency-resolver.js";
import { BaseDependencyResolver } from "./base-dependency-resolver.js";
import { PnpmYarnDependencyResolver } from "./pnpm-yarn-dependency-resolver.js";

export class DependencyResolver extends BaseDependencyResolver {
	public resolve(project: Project): Project {
		switch (project.packageManager) {
			case "npm":
				return new NpmDependencyResolver().resolve(project);
			case "pnpm":
			case "yarn":
				return new PnpmYarnDependencyResolver().resolve(project);
			default:
				throw new Error(`Unsupported package manager: ${project.packageManager}`);
		}
	}
}
