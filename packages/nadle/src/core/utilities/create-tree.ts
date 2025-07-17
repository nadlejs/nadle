import { LINES } from "./constants.js";

export function createTree<T>(node: T, getChildren: (node: T) => T[], getLabel: (node: T) => string): string[] {
	const lines = [getLabel(node)];

	const children = getChildren(node);

	for (let childIndex = 0; childIndex < children.length; childIndex++) {
		const child = children[childIndex];

		for (const childLine of createTree(child, getChildren, getLabel)) {
			if (childLine.startsWith(LINES.VERTICAL_RIGHT) || childLine.startsWith(LINES.UP_RIGHT) || childLine.startsWith(LINES.VERTICAL)) {
				lines.push(`${LINES.VERTICAL}   ${childLine}`);
			} else {
				if (childIndex < children.length - 1) {
					lines.push(`${LINES.VERTICAL_RIGHT}${LINES.HORIZONTAL}${LINES.HORIZONTAL} ${childLine}`);
				} else {
					lines.push(`${LINES.UP_RIGHT}${LINES.HORIZONTAL}${LINES.HORIZONTAL} ${childLine}`);
				}
			}
		}
	}

	return lines;
}
