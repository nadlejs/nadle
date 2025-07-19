import { type PackageJSON as ManyPkgPackageJson } from "@manypkg/tools";

export interface PackageJson {
	readonly name: string;
	readonly version: string;
	readonly scripts?: PackageJson.Dependencies;
	readonly dependencies?: PackageJson.Dependencies;
	readonly devDependencies?: PackageJson.Dependencies;
}
export namespace PackageJson {
	export interface Dependencies {
		readonly [packageName: string]: string;
	}
	export function create(pkg: ManyPkgPackageJson): PackageJson {
		const { name, version, dependencies, devDependencies } = pkg;

		return { name, version, dependencies, devDependencies };
	}
}
