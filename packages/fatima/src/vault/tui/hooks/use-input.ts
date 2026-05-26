import { useKeyboard } from "@opentui/react";

type TuiKey = {
	escape?: boolean;
	tab?: boolean;
	return?: boolean;
	ctrl?: boolean;
	shift?: boolean;
	leftArrow?: boolean;
	rightArrow?: boolean;
	upArrow?: boolean;
	downArrow?: boolean;
	backspace?: boolean;
	delete?: boolean;
};

export function useInput(
	handler: (input: string, key: TuiKey) => void,
	options?: { isActive?: boolean },
) {
	useKeyboard((event) => {
		if (options?.isActive === false || event.eventType === "release") {
			return;
		}

		const name = event.name;
		const key: TuiKey = {
			escape: name === "escape" || event.raw === "\x1b",
			tab: name === "tab" || event.raw === "\t",
			return: name === "return" || name === "enter" || event.raw === "\r",
			ctrl: event.ctrl,
			shift: event.shift,
			leftArrow:
				name === "left" || name === "leftArrow" || event.sequence === "\x1b[D",
			rightArrow:
				name === "right" ||
				name === "rightArrow" ||
				event.sequence === "\x1b[C",
			upArrow:
				name === "up" || name === "upArrow" || event.sequence === "\x1b[A",
			downArrow:
				name === "down" || name === "downArrow" || event.sequence === "\x1b[B",
			backspace:
				name === "backspace" || event.raw === "\x7f" || event.raw === "\b",
			delete: name === "delete" || event.sequence === "\x1b[3~",
		};
		const input =
			event.raw || event.sequence || (name.length === 1 ? name : "");
		handler(input, key);
	});
}
