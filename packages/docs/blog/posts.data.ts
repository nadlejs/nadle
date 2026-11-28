import { createContentLoader } from "vitepress";

export interface PostSummary {
	url: string;
	date: string;
	title: string;
	description: string;
}

export declare const data: PostSummary[];

export default createContentLoader("blog/*.md", {
	transform: (pages) =>
		pages
			.filter((page) => page.url !== "/blog/")
			.map((page) => ({
				url: page.url,
				title: String(page.frontmatter["title"]),
				description: String(page.frontmatter["description"] ?? ""),
				date: new Date(page.frontmatter["date"] as string).toISOString().slice(0, 10)
			}))
			.sort((a, b) => b.date.localeCompare(a.date))
});
