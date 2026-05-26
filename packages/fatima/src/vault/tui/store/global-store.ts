import React from "react";
import type { SecretRecord, UnlockedVault } from "../../types";

export type CommandPaletteItem = {
	key: string;
	title: string;
	description: string;
	run: () => void;
};

export type Mode = string;

export type ActiveSecret = {
	id: string | null;
	key: string;
	value: string;
	environment: string;
} | null;

export type TuiProject = {
	storePath: string;
	environments: string[];
	defaultEnvironment: string;
};

export type TuiGlobalStore = {
	config?: string;
	initialPassword?: string;
	project: TuiProject;
	mode: Mode;
	activeModalId: string | null;
	message: string | null;
	error: string | null;
	revealed: boolean;
	selectedEnvironment: string;
	selectedIndex: number;
	session: UnlockedVault | null;
	view: "environment" | "matrix";
	matrixRow: number;
	matrixColumn: number;
	commandCursor: number;
	maxTableRows: number;
	overlayOpen: boolean;
	environmentList: string[];
	selectedSecrets: SecretRecord[];
	secretCounts: Record<string, number>;
	totalSecretCount: number;
	matrixKeys: string[];
	focusedEnvironment: string;
	activeSecret: ActiveSecret;
	commandItems: CommandPaletteItem[];
	actions: {
		setMode: (mode: Mode) => void;
		navigate: (viewId: string) => void;
		openModal: (modalId: string) => void;
		closeModal: () => void;
		setMessage: (value: string | null) => void;
		setError: (value: string | null) => void;
		setRevealed: React.Dispatch<React.SetStateAction<boolean>>;
		setSelectedEnvironment: (value: string) => void;
		setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
		setSession: React.Dispatch<React.SetStateAction<UnlockedVault | null>>;
		setView: React.Dispatch<React.SetStateAction<"environment" | "matrix">>;
		setMatrixRow: React.Dispatch<React.SetStateAction<number>>;
		setMatrixColumn: React.Dispatch<React.SetStateAction<number>>;
		setCommandCursor: React.Dispatch<React.SetStateAction<number>>;
		runCommand: (index?: number) => void;
		showError: (cause: unknown) => void;
		backToBrowse: () => void;
		openAddSecret: () => void;
		openEditSecret: () => void;
		openDeleteSecret: () => void;
		openImport: () => void;
		openKeygen: () => void;
		openNewEnvironment: () => void;
		openRenameEnvironment: () => void;
		openDeleteEnvironment: () => void;
		openChangePassword: () => void;
		openCommandPalette: () => void;
		selectEnvironment: (environment: string, index: number) => void;
		selectMatrixCell: (row: number, column: number) => void;
	};
};

const GlobalStoreContext = React.createContext<TuiGlobalStore | null>(null);

export function GlobalStoreProvider({
	children,
	value,
}: {
	children: React.ReactNode;
	value: TuiGlobalStore;
}) {
	return React.createElement(GlobalStoreContext.Provider, { value }, children);
}

export function useGlobalStore(): TuiGlobalStore {
	const store = React.useContext(GlobalStoreContext);
	if (!store) {
		throw new Error("Fatima TUI global store was not initialized.");
	}
	return store;
}

export function useGlobalActions(): TuiGlobalStore["actions"] {
	return useGlobalStore().actions;
}
