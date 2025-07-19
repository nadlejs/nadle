import yaml from "yaml";
import stringify from "serialize-javascript";
import { type PackageJSON } from "@manypkg/tools";

export function createPackageJson(name: string = "root", otherFields?: Partial<Omit<PackageJSON & { workspaces: string[] }, "name">>): string {
	return stringify({ name, type: "module", ...(otherFields ?? {}) });
}

export function createPnpmWorkspace(packages: string[] = ["./**"]) {
	return yaml.stringify({ packages });
}
