<script setup lang="ts">
interface GraphNode {
	id: string;
	cx: number;
	cy: number;
	step: number;
	label: string;
}

interface GraphEdge {
	to: string;
	from: string;
	step: number;
}

// Five nodes laid out as a DAG: lint+compile roots, then test+bundle, then build.
const NODES: GraphNode[] = [
	{ cx: 90, cy: 60, step: 0, id: "lint", label: "lint" },
	{ cx: 90, cy: 180, step: 0, id: "compile", label: "compile" },
	{ cx: 280, cy: 110, step: 1, id: "test", label: "test" },
	{ cx: 280, cy: 230, step: 1, id: "bundle", label: "bundle" },
	{ cx: 470, cy: 145, step: 2, id: "build", label: "build" }
];

const EDGES: GraphEdge[] = [
	{ step: 1, to: "test", from: "compile" },
	{ step: 1, to: "bundle", from: "compile" },
	{ step: 2, to: "build", from: "lint" },
	{ step: 2, to: "build", from: "test" },
	{ step: 2, to: "build", from: "bundle" }
];

const NODE_W = 110;
const NODE_H = 40;

const byId = (id: string): GraphNode => NODES.find((node) => node.id === id)!;

const edgePath = (edge: GraphEdge): string => {
	const from = byId(edge.from);
	const to = byId(edge.to);
	const x1 = from.cx + NODE_W / 2;
	const x2 = to.cx - NODE_W / 2;
	const midX = (x1 + x2) / 2;

	return `M ${x1} ${from.cy} C ${midX} ${from.cy}, ${midX} ${to.cy}, ${x2} ${to.cy}`;
};

const ARIA_LABEL =
	"Animated task graph. lint and compile run first with no dependencies. " +
	"test and bundle depend on compile. build depends on lint, test, and bundle. " +
	"Each task cycles from waiting to running to done as its dependencies resolve.";
</script>

<template>
	<div class="dag" role="img" :aria-label="ARIA_LABEL">
		<svg aria-hidden="true" viewBox="0 0 560 290" preserveAspectRatio="xMidYMid meet">
			<g fill="none" stroke-width="2">
				<path v-for="edge in EDGES" :key="`${edge.from}-${edge.to}`" :d="edgePath(edge)" class="edge" :style="{ '--dag-step': edge.step }" />
			</g>
			<g v-for="node in NODES" :key="node.id" class="node" :style="{ '--dag-step': node.step }">
				<rect rx="10" :width="NODE_W" :height="NODE_H" :x="node.cx - NODE_W / 2" :y="node.cy - NODE_H / 2" class="rect" />
				<circle r="4" :cx="node.cx - NODE_W / 2 + 16" :cy="node.cy" class="dot" />
				<text :x="node.cx + 4" :y="node.cy" dominant-baseline="central" text-anchor="middle" class="label">{{ node.label }}</text>
			</g>
		</svg>
	</div>
</template>

<style scoped>
.dag {
	position: relative;
	width: 100%;
}

svg {
	display: block;
	width: 100%;
	height: auto;
}

.rect {
	fill: rgba(255, 255, 255, 0.03);
	stroke: rgba(148, 163, 184, 0.2);
	stroke-width: 1;
}

.label {
	fill: #cbd5e1;
	font-size: 13px;
	font-family: var(--vp-font-family-mono);
}

.dot {
	fill: #64748b;
}

.edge {
	stroke: rgba(148, 163, 184, 0.18);
}

/* Looping 5s pipeline; --dag-step (0,1,2) staggers delays by topological level. */
.node {
	animation: dag-node 5s ease-in-out infinite;
	animation-delay: calc(var(--dag-step) * 1.1s);
}

.node .rect {
	animation: dag-rect 5s ease-in-out infinite;
	animation-delay: calc(var(--dag-step) * 1.1s);
}

.node .dot {
	animation: dag-dot 5s ease-in-out infinite;
	animation-delay: calc(var(--dag-step) * 1.1s);
}

.edge {
	stroke-dasharray: 6 6;
	animation: dag-edge 5s ease-in-out infinite;
	animation-delay: calc(var(--dag-step) * 1.1s);
}

@keyframes dag-rect {
	0%,
	100% {
		stroke: rgba(148, 163, 184, 0.2);
	}
	15% {
		stroke: var(--landing-cyan);
	}
	40%,
	90% {
		stroke: rgba(34, 197, 94, 0.6);
	}
}

@keyframes dag-node {
	0%,
	100% {
		filter: drop-shadow(0 0 0 transparent);
	}
	15% {
		filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.5));
	}
}

@keyframes dag-dot {
	0%,
	100% {
		fill: #64748b;
	}
	15% {
		fill: var(--landing-cyan);
	}
	40%,
	90% {
		fill: #22c55e;
	}
}

@keyframes dag-edge {
	0%,
	100% {
		stroke: rgba(148, 163, 184, 0.18);
		stroke-dashoffset: 24;
	}
	20% {
		stroke: rgba(34, 211, 238, 0.7);
	}
	40%,
	90% {
		stroke: rgba(34, 197, 94, 0.45);
		stroke-dashoffset: 0;
	}
}

@media (prefers-reduced-motion: reduce) {
	.node,
	.node .rect,
	.node .dot,
	.edge {
		animation: none;
	}

	.rect {
		stroke: rgba(34, 197, 94, 0.6);
	}

	.dot {
		fill: #22c55e;
	}

	.edge {
		stroke: rgba(34, 197, 94, 0.45);
		stroke-dashoffset: 0;
	}
}
</style>
