import Link from "@docusaurus/Link";
import { useRef, type FC, useState, useEffect } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

const GITHUB_URL = "https://github.com/nadlejs/nadle";

const NAV_LINKS = [
	{ label: "Docs", to: "/docs/introduction" },
	{ label: "Spec", href: "https://nadle.dev/spec/" },
	{ to: "/blog", label: "Blog" }
];

const Navbar: FC = () => {
	const ref = useRef<HTMLElement>(null);
	const [scrolled, setScrolled] = useState(false);
	const { siteConfig } = useDocusaurusContext();
	const version = String(siteConfig.customFields?.["version"] ?? "");

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 8);

		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });

		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<nav ref={ref} data-scrolled={scrolled ? "" : undefined} className="landing-nav fixed inset-x-0 top-0 z-50">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
				<Link to="/" className="flex items-center gap-2.5 no-underline hover:no-underline">
					<img src="/img/logo.svg" alt="" aria-hidden width={26} height={26} />
					<span className="text-white font-bold text-lg tracking-tight">Nadle</span>
				</Link>
				<div className="flex items-center gap-1 sm:gap-2">
					{NAV_LINKS.map((link) => (
						<Link
							key={link.label}
							{...("to" in link ? { to: link.to } : { href: link.href })}
							className="hidden sm:inline-flex text-sm text-slate-300 hover:text-white px-3 py-2 rounded-md transition-colors duration-200 no-underline hover:no-underline">
							{link.label}
						</Link>
					))}
					{version && (
						<Link href={`${GITHUB_URL}/releases/tag/v${version}`} className="navbar-version-label no-underline hover:no-underline">
							v{version}
						</Link>
					)}
					<Link
						href={GITHUB_URL}
						aria-label="GitHub repository"
						className="inline-flex items-center justify-center w-9 h-9 rounded-md text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors duration-200 no-underline">
						<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
							<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
						</svg>
					</Link>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
