import { themes, Highlight } from "prism-react-renderer";
import { useRef, type FC, useState, useEffect, useCallback, type ReactNode } from "react";

/* ── Window chrome ───────────────────────────────────────────────────────── */

const WindowChrome: FC<{ title: string }> = ({ title }) => (
	<div className="flex items-center gap-2 px-4 py-3 bg-white/[0.04] border-b border-white/[0.06]">
		<span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
		<span className="w-3 h-3 rounded-full bg-[#febc2e]" />
		<span className="w-3 h-3 rounded-full bg-[#28c840]" />
		<span className="ml-2 text-xs text-slate-400 font-mono">{title}</span>
	</div>
);

export const CodeWindow: FC<{ code: string; title: string; language?: string }> = ({ code, title, language = "typescript" }) => (
	<div className="relative rounded-xl overflow-hidden border border-white/[0.08] bg-[#0b0d12] shadow-2xl">
		<WindowChrome title={title} />
		<Highlight theme={themes.vsDark} code={code} language={language}>
			{({ tokens, getLineProps, getTokenProps }) => (
				<pre className="!m-0 !rounded-none !bg-transparent" style={{ lineHeight: "1.7", fontSize: "0.86rem", padding: "1.25rem 1.5rem" }}>
					{tokens.map((line, i) => (
						<div key={i} {...getLineProps({ line })}>
							{line.map((token, key) => (
								<span key={key} {...getTokenProps({ token })} />
							))}
						</div>
					))}
				</pre>
			)}
		</Highlight>
	</div>
);

export const TerminalBlock: FC<{ title?: string; content: string }> = ({ content, title = "Terminal" }) => (
	<div className="relative rounded-xl overflow-hidden border border-white/[0.08] bg-[#0b0d12] shadow-2xl">
		<WindowChrome title={title} />
		<pre className="p-5 text-sm leading-relaxed font-mono overflow-x-auto !bg-transparent !m-0 !rounded-none text-slate-300">{content}</pre>
	</div>
);

/* ── Install command with animated copy button ──────────────────────────── */

const INSTALL_COMMAND = "npm install -D nadle";

export const InstallCommand: FC = () => {
	const btnRef = useRef<HTMLButtonElement>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

	const handleCopy = useCallback(() => {
		void navigator.clipboard.writeText(INSTALL_COMMAND);
		const el = btnRef.current;

		if (!el) {
			return;
		}

		el.dataset["copied"] = "";
		clearTimeout(timerRef.current!);
		timerRef.current = setTimeout(() => delete el.dataset["copied"], 2000);
	}, []);

	return (
		<button
			ref={btnRef}
			type="button"
			onClick={handleCopy}
			className="group inline-flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] hover:border-cyan-400/30 rounded-lg px-5 py-3 font-mono text-sm transition-colors duration-200 cursor-pointer"
			aria-label={`Copy install command: ${INSTALL_COMMAND}`}>
			<span className="text-cyan-400">$</span>
			<span className="text-slate-200">{INSTALL_COMMAND}</span>
			<span className="ml-1 text-slate-500 group-hover:text-slate-300 transition-colors duration-200 group-data-[copied]:hidden">
				<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
					<rect x="9" y="9" width="13" height="13" rx="2" />
					<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
				</svg>
			</span>
			<span className="ml-1 hidden group-data-[copied]:inline">
				<svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			</span>
		</button>
	);
};

/* ── Scroll-reveal wrapper (IntersectionObserver) ────────────────────────── */

export const SectionReveal: FC<{ className?: string; children: ReactNode }> = ({ children, className }) => {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const el = ref.current;

		if (!el || visible) {
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
		);

		observer.observe(el);

		return () => observer.disconnect();
	}, [visible]);

	return (
		<div ref={ref} data-reveal={visible ? "in" : undefined} className={`landing-reveal ${className ?? ""}`}>
			{children}
		</div>
	);
};
