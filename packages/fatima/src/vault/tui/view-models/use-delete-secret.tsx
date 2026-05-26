import { useState } from "react";
import { deleteSecretValue, saveUnlockedSecretManager } from "../../api";
import { useGlobalStore } from "../store/global-store";

export function useDeleteSecret() {
	const { error, session, activeSecret, selectedSecrets, matrixKeys, actions } = useGlobalStore();
	const [deleteSecretName, setDeleteSecretName] = useState("");
	return {
		error,
		activeSecret,
		deleteSecretName,
		confirmationActive: true,
		setDeleteSecretName,
		submit: () => {
			try {
				if (!session || !activeSecret) return;
				if (deleteSecretName !== activeSecret.key) throw new Error(`Type ${activeSecret.key} exactly to confirm deletion.`);
				if (!activeSecret.id) throw new Error("Secret selection is invalid.");
				deleteSecretValue(session, activeSecret.environment, activeSecret.id);
				saveUnlockedSecretManager(session);
				actions.setSession({ ...session, vault: { ...session.vault } });
				actions.setSelectedIndex((value) => Math.max(0, Math.min(value, selectedSecrets.length - 2)));
				actions.setMatrixRow((value) => Math.max(0, Math.min(value, matrixKeys.length - 2)));
				actions.closeModal();
				actions.setMessage(`Deleted ${activeSecret.key}.`);
				actions.setError(null);
			} catch (cause) { actions.showError(cause); }
		},
	};
}
