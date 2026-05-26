import type { CommandPaletteItem, Mode } from "../store/global-store";
import { useInput } from "./use-input";

type Args = {
	exit: () => void;
	mode: Mode;
	activeModalId: string | null;
	view: "environment" | "matrix";
	selectedEnvironment: string;
	environmentList: string[];
	selectedSecretsLength: number;
	matrixKeysLength: number;
	setView: React.Dispatch<React.SetStateAction<"environment" | "matrix">>;
	setRevealed: React.Dispatch<React.SetStateAction<boolean>>;
	setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
	setMatrixRow: React.Dispatch<React.SetStateAction<number>>;
	setMatrixColumn: React.Dispatch<React.SetStateAction<number>>;
	setCommandCursor: React.Dispatch<React.SetStateAction<number>>;
	commandItems: CommandPaletteItem[];
	runCommand: (index?: number) => void;
	backToBrowse: () => void;
	openCommandPalette: () => void;
	openAddSecret: () => void;
	openEditSecret: () => void;
	openDeleteSecret: () => void;
	openImport: () => void;
	openKeygen: () => void;
	openNewEnvironment: () => void;
	openRenameEnvironment: () => void;
	openDeleteEnvironment: () => void;
	openChangePassword: () => void;
	moveEnvironment: (direction: -1 | 1) => void;
	selectEnvironment: (environment: string, index: number) => void;
};

export function useVaultInput(args: Args) {
	useInput((input, key) => {
		if (args.activeModalId === "command-palette") {
			if (key.upArrow) return args.setCommandCursor((value) => Math.max(0, value - 1));
			if (key.downArrow) return args.setCommandCursor((value) => Math.min(args.commandItems.length - 1, value + 1));
			if (key.return) return args.runCommand();
			if (input.length === 1) {
				const index = args.commandItems.findIndex((command) => command.key === input);
				if (index >= 0) return args.runCommand(index);
			}
			if (key.escape) args.backToBrowse();
			return;
		}

		if (args.activeModalId) {
			if (key.escape) args.backToBrowse();
			return;
		}

		if (args.mode !== "vault") {
			if (key.escape) args.backToBrowse();
			return;
		}

		if (input === "q") args.exit();
		if (input === "/" || input === "?") args.openCommandPalette();
		if (input === "r") args.setRevealed((value) => !value);
		if (input === "v") args.setView((value) => (value === "environment" ? "matrix" : "environment"));
		if (input === "a") args.openAddSecret();
		if (input === "n") args.openNewEnvironment();
		if (input === "R") args.openRenameEnvironment();
		if (input === "D") args.openDeleteEnvironment();
		if (input === "p") args.openChangePassword();
		if (input === "e") args.openEditSecret();
		if (input === "d") args.openDeleteSecret();
		if (input === "i") args.openImport();
		if (input === "k") args.openKeygen();
		if (key.shift && key.leftArrow) return args.moveEnvironment(-1);
		if (key.shift && key.rightArrow) return args.moveEnvironment(1);

		if (args.view === "matrix") {
			if (key.leftArrow || input === "[") args.setMatrixColumn((value) => Math.max(0, value - 1));
			if (key.rightArrow || input === "]") args.setMatrixColumn((value) => Math.min(args.environmentList.length - 1, value + 1));
			if (key.upArrow) args.setMatrixRow((value) => Math.max(0, value - 1));
			if (key.downArrow) args.setMatrixRow((value) => Math.min(Math.max(0, args.matrixKeysLength - 1), value + 1));
			return;
		}

		if (key.leftArrow || input === "[") {
			const index = Math.max(0, args.environmentList.indexOf(args.selectedEnvironment) - 1);
			args.selectEnvironment(args.environmentList[index] ?? args.selectedEnvironment, index);
		}
		if (key.rightArrow || input === "]") {
			const index = Math.min(args.environmentList.length - 1, args.environmentList.indexOf(args.selectedEnvironment) + 1);
			args.selectEnvironment(args.environmentList[index] ?? args.selectedEnvironment, index);
		}
		if (key.upArrow) args.setSelectedIndex((value) => Math.max(0, value - 1));
		if (key.downArrow) args.setSelectedIndex((value) => Math.min(Math.max(0, args.selectedSecretsLength - 1), value + 1));
	});
}
