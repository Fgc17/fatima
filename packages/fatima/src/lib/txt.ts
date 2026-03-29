export function txt(...message: string[]) {
	return message.join("\n");
}

export const BLANK_LINE = txt("");
