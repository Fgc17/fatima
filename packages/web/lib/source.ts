import { docs, meta } from "@/.source";
import { createMDXSource } from "fumadocs-mdx";
import { loader } from "fumadocs-core/source";
import * as icons from "@heroicons/react/16/solid";
import { createElement } from "react";
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
