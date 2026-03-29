import { createMetadataImage } from "fumadocs-core/server";
import type { Metadata } from "next/types";
import { source } from "@/lib/source";

export const baseUrl =
	process.env.NODE_ENV === "development" || !process.env.NEXT_PUBLIC_APP_URL
		? new URL(`https://${process.env.NEXT_PUBLIC_TUNNEL_URL}`)
		: new URL(`https://${process.env.NEXT_PUBLIC_APP_URL}`);

export const metadataImage = createMetadataImage({
	imageRoute: "/api/open-graph",
	source,
});

export function createMetadata(override: Metadata): Metadata {
	return {
		...override,
		openGraph: {
			title: override.title ?? undefined,
			description: override.description ?? undefined,
			url: baseUrl,
			images: "/banner.png",
			siteName: "Fatima",
			...override.openGraph,
		},
		twitter: {
			card: "summary_large_image",
			creator: "@fernando_coelho",
			title: override.title ?? undefined,
			description: override.description ?? undefined,
			images: "/banner.png",
			...override.twitter,
		},
		metadataBase: baseUrl,
	};
}
