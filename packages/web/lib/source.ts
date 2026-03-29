import { loader } from "fumadocs-core/source";
import { createMDXSource } from "fumadocs-mdx";
import { docs, meta } from "@/.source";
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
