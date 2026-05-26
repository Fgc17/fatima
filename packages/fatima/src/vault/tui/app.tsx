import { useMemo, useState } from "react";
import { hasSecretManagerStore } from "../api";
import { resolveProjectSecretManagerSettings } from "../project";
import type { UnlockedVault } from "../types";
import { FormFooter, FormGuides } from "./components/form-hints";
import { AppShell } from "./components/shells/app-shell";
import { FormShell } from "./components/shells/form-shell";
import { useApp } from "./hooks/use-app";
import { useVaultCommands } from "./hooks/use-vault-commands";
import { useVaultInput } from "./hooks/use-vault-input";
import { useWindowSize } from "./hooks/use-window-size";
import { ModalPortal } from "./routing/modals";
import { View, Views } from "./routing/views";
import {
	GlobalStoreProvider,
	type Mode,
	type TuiGlobalStore,
} from "./store/global-store";
import { OnboardingView } from "./views/onboarding";
import { UnlockView } from "./views/unlock";
import { VaultView } from "./views/vault";

type AppProps = {
	config?: string;
	initialPassword?: string;
	initialSession?: UnlockedVault | null;
};

export function FatimaApp({ config, initialPassword, initialSession = null }: AppProps) {
	const { exit } = useApp();
	const { rows } = useWindowSize();
	const project = useMemo(() => resolveProjectSecretManagerSettings(config), [config]);
	const [mode, setMode] = useState<Mode>(
		initialSession ? "vault" : hasSecretManagerStore(config) ? "unlock" : "onboarding",
	);
	const [activeModalId, setActiveModalId] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [revealed, setRevealed] = useState(false);
	const [selectedEnvironment, setSelectedEnvironment] = useState(
		initialSession?.config.defaultEnvironment ?? project.defaultEnvironment,
	);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [session, setSession] = useState<UnlockedVault | null>(initialSession);
	const [view, setView] = useState<"environment" | "matrix">("environment");
	const [matrixRow, setMatrixRow] = useState(0);
	const [matrixColumn, setMatrixColumn] = useState(0);
	const [commandCursor, setCommandCursor] = useState(0);

	const maxTableRows = Math.max(3, rows - 16);
	const overlayOpen = activeModalId !== null;
	const environmentList = session?.config.environments ?? project.environments;
	const selectedSecrets = [...(session?.vault[selectedEnvironment] ?? [])].sort((left, right) =>
		left.key.localeCompare(right.key),
	);
	const selectedSecret = selectedSecrets[selectedIndex];
	const secretCounts = Object.fromEntries(
		environmentList.map((environment) => [environment, (session?.vault[environment] ?? []).length]),
	) as Record<string, number>;
	const totalSecretCount = session
		? Object.values(session.vault).reduce((count, secrets) => count + secrets.length, 0)
		: 0;
	const matrixKeys = Array.from(
		new Set(environmentList.flatMap((environment) => (session?.vault[environment] ?? []).map((secret) => secret.key))),
	).sort();
	const matrixEnvironment = environmentList[matrixColumn] ?? selectedEnvironment;
	const focusedEnvironment = view === "matrix" ? matrixEnvironment : selectedEnvironment;
	const matrixKey = matrixKeys[matrixRow];
	const matrixSecret =
		matrixKey && session
			? (session.vault[matrixEnvironment] ?? []).find((secret) => secret.key === matrixKey)
			: undefined;
	const activeSecret =
		view === "matrix"
			? matrixKey
				? {
						id: matrixSecret?.id ?? null,
						key: matrixKey,
						value: matrixSecret?.value ?? "",
						environment: matrixEnvironment,
					}
				: null
			: selectedSecret
				? {
						id: selectedSecret.id,
						key: selectedSecret.key,
						value: selectedSecret.value,
						environment: selectedEnvironment,
					}
				: null;

	const vaultCommands = useVaultCommands({
		exit,
		mode,
		setMode,
		session,
		setSession,
		view,
		setView,
		revealed,
		setRevealed,
		selectedEnvironment,
		setSelectedEnvironment,
		setSelectedIndex,
		setMatrixRow,
		setMatrixColumn,
		commandCursor,
		setCommandCursor,
		setMessage,
		setError,
		environmentList,
		matrixEnvironment,
		focusedEnvironment,
		activeSecret,
		activeModalId,
		setActiveModalId,
	});
	const {
		showError,
		backToBrowse,
		selectEnvironment,
		selectMatrixCell,
		moveEnvironment,
		openAddSecret,
		openEditSecret,
		openDeleteSecret,
		openImport,
		openKeygen,
		openNewEnvironment,
		openRenameEnvironment,
		openDeleteEnvironment,
		openChangePassword,
		openCommandPalette,
		commandItems,
		runCommand,
	} = vaultCommands;

	useVaultInput({
		exit,
		mode,
		activeModalId,
		view,
		selectedEnvironment,
		environmentList,
		selectedSecretsLength: selectedSecrets.length,
		matrixKeysLength: matrixKeys.length,
		setView,
		setRevealed,
		setSelectedIndex,
		setMatrixRow,
		setMatrixColumn,
		setCommandCursor,
		commandItems,
		runCommand,
		backToBrowse,
		openCommandPalette,
		openAddSecret,
		openEditSecret,
		openDeleteSecret,
		openImport,
		openKeygen,
		openNewEnvironment,
		openRenameEnvironment,
		openDeleteEnvironment,
		openChangePassword,
		moveEnvironment,
		selectEnvironment,
	});

	function navigate(viewId: string) {
		setActiveModalId(null);
		setError(null);
		setMessage(null);
		setMode(viewId as Mode);
	}

	function openModal(modalId: string) {
		setError(null);
		setActiveModalId(modalId);
	}

	function closeModal() {
		setActiveModalId(null);
		setError(null);
		setMessage(null);
	}

	const store: TuiGlobalStore = {
		config,
		initialPassword,
		project,
		mode,
		activeModalId,
		message,
		error,
		revealed,
		selectedEnvironment,
		selectedIndex,
		session,
		view,
		matrixRow,
		matrixColumn,
		commandCursor,
		maxTableRows,
		overlayOpen,
		environmentList,
		selectedSecrets,
		secretCounts,
		totalSecretCount,
		matrixKeys,
		focusedEnvironment,
		activeSecret,
		commandItems,
		actions: {
			setMode,
			navigate,
			openModal,
			closeModal,
			setMessage,
			setError,
			setRevealed,
			setSelectedEnvironment,
			setSelectedIndex,
			setSession,
			setView,
			setMatrixRow,
			setMatrixColumn,
			setCommandCursor,
			runCommand,
			showError,
			backToBrowse,
			openAddSecret,
			openEditSecret,
			openDeleteSecret,
			openImport,
			openKeygen,
			openNewEnvironment,
			openRenameEnvironment,
			openDeleteEnvironment,
			openChangePassword,
			openCommandPalette,
			selectEnvironment,
			selectMatrixCell,
		},
	};

	return (
		<GlobalStoreProvider value={store}>
			<AppShell
				project={process.cwd()}
				status={session ? "unlocked" : mode === "onboarding" ? "setup" : "locked"}
				secretCount={totalSecretCount}
				environmentCount={session ? environmentList.length : 0}
			>
				<Views>
					<View id="onboarding"><FormShell guides={<FormGuides />}><OnboardingView footer={<FormFooter primary="create vault" />} /></FormShell></View>
					<View id="unlock"><FormShell guides={<FormGuides />}><UnlockView footer={<FormFooter primary="unlock" allowQuit />} /></FormShell></View>
					<View id="vault">{session ? <VaultView /> : null}</View>
				</Views>
				<ModalPortal />
			</AppShell>
		</GlobalStoreProvider>
	);
}
