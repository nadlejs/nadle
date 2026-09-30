import type { FC } from "react";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

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
		title: "Community",
		links: [
			{ to: "/blog", label: "Blog" },
			{ label: "Spec", href: "https://nadle.dev/spec/" },
			{ label: "Playground", href: PLAYGROUND_URL },
			{ label: "llms.txt", href: "https://nadle.dev/llms.txt" }
		]
	},
	{
		title: "GitHub",
		links: [
			{ href: GITHUB_URL, label: "Repository" },
			{ label: "Issues", href: `${GITHUB_URL}/issues` },
			{ label: "Releases", href: `${GITHUB_URL}/releases` },
			{ label: "npm", href: NPM_URL }
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

const Footer: FC = () => {
	const { siteConfig } = useDocusaurusContext();
	const version = String(siteConfig.customFields?.["version"] ?? "");

	return (
		<footer className="bg-[#08090c]">
			<div className="h-px bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500" />
			<div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
				<div className="footer-grid">
					<div>
						<h3 className="text-white text-lg font-bold mb-2">Nadle</h3>
						<p className="text-slate-400 text-sm leading-relaxed max-w-xs">A type-safe, Gradle-inspired task runner for Node.js.</p>
						{version && <span className="navbar-version-label inline-block mt-4">v{version}</span>}
					</div>
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
				<div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
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
};

export default Footer;
