import type { FC } from "react";

interface Node {
	id: string;
	cx: number;
	cy: number;
	step: number;
	label: string;
}

interface Edge {
	to: string;
	from: string;
	step: number;
}

/* Five nodes laid out as a DAG: lint+compile roots → test+bundle → build. */
const NODES: Node[] = [
	{ cx: 90, cy: 60, step: 0, id: "lint", label: "lint" },
	{ cx: 90, cy: 180, step: 0, id: "compile", label: "compile" },
	{ cx: 280, cy: 110, step: 1, id: "test", label: "test" },
	{ cx: 280, cy: 230, step: 1, id: "bundle", label: "bundle" },
	{ cx: 470, cy: 145, step: 2, id: "build", label: "build" }
];

const EDGES: Edge[] = [
	{ step: 1, to: "test", from: "compile" },
	{ step: 1, to: "bundle", from: "compile" },
	{ step: 2, to: "build", from: "lint" },
	{ step: 2, to: "build", from: "test" },
	{ step: 2, to: "build", from: "bundle" }
];

const NODE_W = 110;
const NODE_H = 40;

const byId = (id: string): Node => NODES.find((n) => n.id === id)!;

const edgePath = (edge: Edge): string => {
	const from = byId(edge.from);
	const to = byId(edge.to);
	const x1 = from.cx + NODE_W / 2;
	const x2 = to.cx - NODE_W / 2;
	const midX = (x1 + x2) / 2;

	return `M ${x1} ${from.cy} C ${midX} ${from.cy}, ${midX} ${to.cy}, ${x2} ${to.cy}`;
};

const ariaLabel =
	"Animated task graph. lint and compile run first with no dependencies. " +
	"test and bundle depend on compile. build depends on lint, test, and bundle. " +
	"Each task cycles from waiting to running to done as its dependencies resolve.";

const TaskGraph: FC = () => (
	<div className="landing-dag relative w-full" role="img" aria-label={ariaLabel}>
		<svg aria-hidden viewBox="0 0 560 290" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
			<g className="landing-dag-edges" fill="none" strokeWidth={2}>
				{EDGES.map((edge) => (
					<path key={`${edge.from}-${edge.to}`} d={edgePath(edge)} className="landing-dag-edge" style={{ ["--dag-step" as string]: edge.step }} />
				))}
			</g>
			{NODES.map((node) => (
				<g key={node.id} className="landing-dag-node" style={{ ["--dag-step" as string]: node.step }}>
					<rect rx={10} width={NODE_W} height={NODE_H} x={node.cx - NODE_W / 2} y={node.cy - NODE_H / 2} className="landing-dag-rect" />
					<circle r={4} cx={node.cx - NODE_W / 2 + 16} cy={node.cy} className="landing-dag-dot" />
					<text x={node.cx + 4} y={node.cy} dominantBaseline="central" textAnchor="middle" className="landing-dag-text">
						{node.label}
					</text>
				</g>
			))}
		</svg>
	</div>
);

export default TaskGraph;
