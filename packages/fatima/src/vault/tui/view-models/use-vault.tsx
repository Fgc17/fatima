import { useGlobalStore } from "../store/global-store";

export function useVault() {
	const store = useGlobalStore();
	return {
		message: store.message,
		overlayOpen: store.overlayOpen,
		view: store.view,
		environmentList: store.environmentList,
		focusedEnvironment: store.focusedEnvironment,
		selectedEnvironment: store.selectedEnvironment,
		selectedSecrets: store.selectedSecrets,
		selectedIndex: store.selectedIndex,
		secretCounts: store.secretCounts,
		totalSecretCount: store.totalSecretCount,
		matrixKeys: store.matrixKeys,
		session: store.session,
		revealed: store.revealed,
		maxTableRows: store.maxTableRows,
		matrixRow: store.matrixRow,
		matrixColumn: store.matrixColumn,
		selectSecret: store.actions.setSelectedIndex,
		selectEnvironment: (environment: string, index: number) => {
			if (store.overlayOpen) return;
			store.actions.selectEnvironment(environment, index);
		},
		selectMatrixCell: store.actions.selectMatrixCell,
		showCommandBar: !store.overlayOpen,
	};
}
