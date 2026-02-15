import { it, expect, describe } from "vitest";

import { createTree } from "../../src/core/utilities/create-tree.js";

interface TreeNode {
	label: string;
	children: TreeNode[];
}

const getChildren = (node: TreeNode) => node.children;
const getLabel = (node: TreeNode) => node.label;

describe.concurrent("createTree", () => {
	it("renders a single leaf node", () => {
		const tree: TreeNode = { children: [], label: "root" };

		expect(createTree(tree, getChildren, getLabel)).toEqual(["root"]);
	});

	it("renders a node with one child", () => {
		const tree: TreeNode = {
			label: "root",
			children: [{ children: [], label: "child" }]
		};
		const lines = createTree(tree, getChildren, getLabel);

		expect(lines).toEqual(["root", "└── child"]);
	});

	it("renders a node with multiple children", () => {
		const tree: TreeNode = {
			label: "root",
			children: [
				{ children: [], label: "first" },
				{ children: [], label: "second" },
				{ children: [], label: "third" }
			]
		};
		const lines = createTree(tree, getChildren, getLabel);

		expect(lines).toEqual(["root", "├── first", "├── second", "└── third"]);
	});

	it("renders nested children with proper indentation", () => {
		const tree: TreeNode = {
			label: "root",
			children: [
				{
					label: "parent",
					children: [
						{ children: [], label: "child-a" },
						{ children: [], label: "child-b" }
					]
				}
			]
		};
		const lines = createTree(tree, getChildren, getLabel);

		expect(lines).toEqual(["root", "└── parent", "│   ├── child-a", "│   └── child-b"]);
	});

	it("renders sibling subtrees with correct connectors", () => {
		const tree: TreeNode = {
			label: "root",
			children: [
				{
					label: "A",
					children: [{ label: "A1", children: [] }]
				},
				{
					label: "B",
					children: [{ label: "B1", children: [] }]
				}
			]
		};
		const lines = createTree(tree, getChildren, getLabel);

		expect(lines).toEqual(["root", "├── A", "│   └── A1", "└── B", "│   └── B1"]);
	});
});
