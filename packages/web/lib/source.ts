import { docs, meta } from "@/.source";
import { createMDXSource } from "fumadocs-mdx";
import { loader } from "fumadocs-core/source";
import { Icon } from "@/components/icon";

export const source = loader({
	baseUrl: "/docs",
	source: createMDXSource(docs, meta),
	icon(iconString) {
		return Icon({
			icon: iconString,
		});
	},
});
