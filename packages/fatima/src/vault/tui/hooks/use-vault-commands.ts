import { saveUnlockedSecretManager } from "../../api";
import type { UnlockedVault } from "../../types";
import type { ActiveSecret, CommandPaletteItem, Mode } from "../store/global-store";

type Args = {
	exit: () => void;
	mode: Mode;
	setMode: (mode: Mode) => void;
	session: UnlockedVault | null;
	setSession: React.Dispatch<React.SetStateAction<UnlockedVault | null>>;
	view: "environment" | "matrix";
	setView: React.Dispatch<React.SetStateAction<"environment" | "matrix">>;
	revealed: boolean;
	setRevealed: React.Dispatch<React.SetStateAction<boolean>>;
	selectedEnvironment: string;
	setSelectedEnvironment: (value: string) => void;
	setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
	setMatrixRow: React.Dispatch<React.SetStateAction<number>>;
	setMatrixColumn: React.Dispatch<React.SetStateAction<number>>;
	commandCursor: number;
	setCommandCursor: React.Dispatch<React.SetStateAction<number>>;
	setMessage: (value: string | null) => void;
	setError: (value: string | null) => void;
	environmentList: string[];
	matrixEnvironment: string;
	focusedEnvironment: string;
	activeSecret: ActiveSecret;
	activeModalId: string | null;
	setActiveModalId: (modalId: string | null) => void;
};

export function useVaultCommands(args: Args) {
	function showError(cause: unknown) {
		args.setError(cause instanceof Error ? cause.message : String(cause));
	}

	function backToBrowse() {
		args.setError(null);
		args.setMessage(null);
		if (args.activeModalId) args.setActiveModalId(null);
		else if (args.session) args.setMode("vault");
		else args.exit();
	}

	function selectEnvironment(environment: string, index: number) {
		args.setSelectedEnvironment(environment);
		args.setSelectedIndex(0);
		args.setMatrixColumn(index);
	}

	function syncEnvironmentSelection(environment: string) {
		args.setSelectedEnvironment(environment);
		args.setSelectedIndex(0);
		args.setMatrixRow(0);
		args.setMatrixColumn(Math.max(0, args.environmentList.indexOf(environment)));
	}

	function selectMatrixCell(row: number, column: number) {
		args.setMatrixRow(row);
		args.setMatrixColumn(column);
		args.setSelectedEnvironment(args.environmentList[column] ?? args.selectedEnvironment);
	}

	function moveEnvironment(direction: -1 | 1) {
		if (!args.session) return;
		const currentEnvironment = args.view === "matrix" ? args.matrixEnvironment : args.selectedEnvironment;
		const fromIndex = args.environmentList.indexOf(currentEnvironment);
		const toIndex = Math.max(0, Math.min(args.environmentList.length - 1, fromIndex + direction));
		if (fromIndex === -1 || fromIndex === toIndex) return;
		const nextEnvironments = [...args.environmentList];
		const [moved] = nextEnvironments.splice(fromIndex, 1);
		if (!moved) return;
		nextEnvironments.splice(toIndex, 0, moved);
		args.session.config.environments = nextEnvironments;
		args.session.project.environments = nextEnvironments;
		saveUnlockedSecretManager(args.session);
		args.setSession({ ...args.session, config: { ...args.session.config }, vault: { ...args.session.vault } });
		syncEnvironmentSelection(currentEnvironment);
		args.setMatrixColumn(toIndex);
		args.setMessage(`Moved ${currentEnvironment}.`);
		args.setError(null);
	}

	function openModal(modalId: string) {
		if (!args.session) return;
		args.setError(null);
		args.setActiveModalId(modalId);
	}

	function openEditSecret() {
		if (!args.activeSecret) return;
		args.setSelectedEnvironment(args.activeSecret.environment);
		openModal("edit-secret");
	}

	function openDeleteSecret() {
		if (!args.activeSecret || !args.session) return;
		openModal("delete-secret");
	}

	function openCommandPalette() {
		args.setCommandCursor(0);
		args.setError(null);
		args.setActiveModalId("command-palette");
	}

	const commandItems: CommandPaletteItem[] = [
		{ key: "a", title: "Add secret", description: `Create a secret in ${args.focusedEnvironment}`, enabled: Boolean(args.session), run: () => openModal("add-secret") },
		{ key: "e", title: "Edit selected secret", description: args.activeSecret?.key ?? "No secret selected", enabled: Boolean(args.activeSecret), run: openEditSecret },
		{ key: "d", title: "Delete selected secret", description: args.activeSecret?.key ?? "No secret selected", enabled: Boolean(args.activeSecret?.id), run: openDeleteSecret },
		{ key: "r", title: args.revealed ? "Hide secret values" : "Reveal secret values", description: "Toggle value visibility", enabled: Boolean(args.session), run: () => { args.setRevealed((value) => !value); args.setActiveModalId(null); } },
		{ key: "v", title: args.view === "environment" ? "Switch to matrix view" : "Switch to environment view", description: "Toggle browsing mode", enabled: Boolean(args.session), run: () => { args.setView((value) => value === "environment" ? "matrix" : "environment"); args.setActiveModalId(null); } },
		{ key: "i", title: "Import .env file", description: `Into ${args.focusedEnvironment}`, enabled: Boolean(args.session), run: () => openModal("import-env") },
		{ key: "k", title: "Generate access key", description: "Create CI/runtime credentials", enabled: Boolean(args.session), run: () => openModal("access-key") },
		{ key: "n", title: "Create environment", description: "Add a new vault environment", enabled: Boolean(args.session), run: () => openModal("create-environment") },
		{ key: "R", title: "Rename environment", description: args.focusedEnvironment, enabled: Boolean(args.session), run: () => openModal("rename-environment") },
		{ key: "D", title: "Delete environment", description: args.focusedEnvironment, enabled: Boolean(args.session), run: () => openModal("delete-environment") },
		{ key: "p", title: "Rotate password", description: "Re-encrypt vault and revoke keys", enabled: Boolean(args.session), run: () => openModal("change-password") },
		{ key: "q", title: "Quit", description: "Close Fatima", enabled: true, run: args.exit },
	].filter((item) => item.enabled);

	function runCommand(index = args.commandCursor) {
		commandItems[index]?.run();
	}

	return {
		showError,
		backToBrowse,
		selectEnvironment,
		selectMatrixCell,
		moveEnvironment,
		openAddSecret: () => openModal("add-secret"),
		openEditSecret,
		openDeleteSecret,
		openImport: () => openModal("import-env"),
		openKeygen: () => openModal("access-key"),
		openNewEnvironment: () => openModal("create-environment"),
		openRenameEnvironment: () => openModal("rename-environment"),
		openDeleteEnvironment: () => openModal("delete-environment"),
		openChangePassword: () => openModal("change-password"),
		openCommandPalette,
		commandItems,
		runCommand,
	};
}
