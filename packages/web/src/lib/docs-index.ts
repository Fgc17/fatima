import { getCollection } from "astro:content";

export const DOC_SECTION_CONFIG = {
	installation: { title: "Installation", order: 1 },
	overview: { title: "Overview", order: 2 },
	guides: { title: "Part 1 - Guides", order: 3 },
	concepts: { title: "Part 2 - Concepts", order: 4 },
	vault: { title: "Part 3 - Vault", order: 5 },
	cli: { title: "Part 4 - CLI", order: 6 },
	providers: { title: "Part 5 - Providers", order: 7 },
	validation: { title: "Part 6 - Validation", order: 8 },
	crates: { title: "Part 7 - Crates (Rust)", order: 9 },
	"javascript-wasm": { title: "Part 8 - JavaScript (WASM)", order: 10 },
} as const;

export type DocSectionId = keyof typeof DOC_SECTION_CONFIG;

export interface DocPage {
	id: string;
	url: `/docs/${string}`;
	section: DocSectionId;
	title: string;
	navTitle: string;
	description?: string;
	order?: number;
}

export interface DocSection {
	id: DocSectionId;
	title: string;
	pages: DocPage[];
}

export async function buildDocsIndex() {
	const entries = await getCollection("docs");
	const pages = entries
		.filter((entry) => entry.id !== "index" && entry.id !== "installation")
		.map((entry) => {
			const section = entry.id.split("/")[0] as DocSectionId;

			if (!(section in DOC_SECTION_CONFIG)) {
				throw new Error(`Unknown docs section: ${entry.id}`);
			}

			return {
				id: entry.id,
				url: `/docs/${entry.id}` as const,
				section,
				title: entry.data.title,
				navTitle: entry.data.navTitle ?? entry.data.title,
				description: entry.data.description,
				order: entry.data.order,
			};
		})
		.sort((left, right) => {
			const sectionOrder =
				DOC_SECTION_CONFIG[left.section].order -
				DOC_SECTION_CONFIG[right.section].order;

			if (sectionOrder !== 0) return sectionOrder;
			if (left.order == null && right.order != null) return 1;
			if (left.order != null && right.order == null) return -1;
			if (
				left.order != null &&
				right.order != null &&
				left.order !== right.order
			) {
				return left.order - right.order;
			}

			return left.title.localeCompare(right.title);
		});

	const sections: DocSection[] = Object.entries(DOC_SECTION_CONFIG)
		.map(([id, config]) => ({
			id: id as DocSectionId,
			title: config.title,
			pages: pages.filter((page) => page.section === id),
		}))
		.filter((section) => section.pages.length > 0);

	return { pages, sections };
}
