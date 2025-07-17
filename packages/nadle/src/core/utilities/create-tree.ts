import { LINES } from "./constants.js";

const { VERTICAL, UP_RIGHT, HORIZONTAL, VERTICAL_RIGHT } = LINES;

export function createTree<T>(node: T, getChildren: (node: T) => T[], getLabel: (node: T) => string): string[] {
	const lines = [getLabel(node)];
	const children = getChildren(node);

	for (let childIndex = 0; childIndex < children.length; childIndex++) {
		for (const childLine of createTree(children[childIndex], getChildren, getLabel)) {
			if (childLine.startsWith(VERTICAL) || childLine.startsWith(UP_RIGHT) || childLine.startsWith(VERTICAL_RIGHT)) {
				lines.push(`${VERTICAL}   ${childLine}`);
			} else {
				lines.push(`${childIndex === children.length - 1 ? UP_RIGHT : VERTICAL_RIGHT}${HORIZONTAL}${HORIZONTAL} ${childLine}`);
			}
		}
	}

	return lines;
}
