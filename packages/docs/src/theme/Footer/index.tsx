import type { FC } from "react";
import Link from "@docusaurus/Link";

const GITHUB_URL = "https://github.com/nadlejs/nadle";
const NPM_URL = "https://www.npmjs.com/package/nadle";
const PLAYGROUND_URL =
	"https://codesandbox.io/p/sandbox/github/nadlejs/nadle/tree/main/packages/examples/basic?embed=1&file=%2Fnadle.config.ts&showConsole=true";

interface FooterColumn {
	title: string;
	links: { to?: string; label: string; href?: string }[];
}

const columns: FooterColumn[] = [
	{
		title: "Docs",
		links: [
			{ label: "Introduction", to: "/docs/introduction" },
			{ label: "Installation", to: "/docs/getting-started/installation" },
			{ label: "Features", to: "/docs/getting-started/features" },
			{ to: "/docs/api/index", label: "API Reference" }
		]
	},
	{
		title: "Guides",
		links: [
			{ label: "Configuring Nadle", to: "/docs/guides/configuring-nadle" },
			{ label: "Defining Tasks", to: "/docs/guides/defining-task" },
			{ label: "Registering Tasks", to: "/docs/guides/registering-task" },
			{ label: "Executing Tasks", to: "/docs/guides/executing-task" }
		]
	},
	{
		title: "Resources",
		links: [
			{ label: "GitHub", href: GITHUB_URL },
			{ label: "npm", href: NPM_URL },
			{ to: "/blog", label: "Blog" },
			{ label: "Spec", href: "https://nadle.dev/spec/" },
			{ label: "Playground", href: PLAYGROUND_URL }
		]
	}
];

const FooterLink: FC<{ to?: string; label: string; href?: string }> = ({ to, href, label }) => (
	<li>
		<Link
			{...(to ? { to } : { href })}
			className="text-slate-400 hover:text-white text-sm transition-colors duration-200 no-underline hover:no-underline">
			{label}
		</Link>
	</li>
);

const Footer: FC = () => (
	<footer className="bg-[#0a0f1a]">
		{/* Gradient top border */}
		<div className="h-px bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />

		<div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
			{/* Main grid */}
			<div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 md:gap-8">
				{/* Brand column */}
				<div>
					<h3 className="text-white text-lg font-bold mb-2">Nadle</h3>
					<p className="text-slate-400 text-sm leading-relaxed max-w-xs">A modern, type-safe task runner for Node.js inspired by Gradle.</p>
				</div>

				{/* Link columns */}
				{columns.map((col) => (
					<div key={col.title}>
						<h4 className="text-slate-200 text-sm font-semibold uppercase tracking-wider mb-3">{col.title}</h4>
						<ul className="list-none space-y-2 p-0 m-0">
							{col.links.map((link) => (
								<FooterLink key={link.label} {...link} />
							))}
						</ul>
					</div>
				))}
			</div>

			{/* Divider */}
			<div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
				<span>&copy; {new Date().getFullYear()} Nadle &middot; MIT License</span>
				<span>
					Built with{" "}
					<Link
						href="https://docusaurus.io"
						className="text-slate-400 hover:text-white transition-colors duration-200 no-underline hover:no-underline">
						Docusaurus
					</Link>
				</span>
			</div>
		</div>
	</footer>
);

export default Footer;
