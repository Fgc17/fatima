import { useState } from "react";
import { deleteEnvironment, saveUnlockedSecretManager } from "../../api";
import { useGlobalStore } from "../store/global-store";

export function useDeleteEnvironment() {
	const { error, session, focusedEnvironment, actions } = useGlobalStore();
	const [deleteEnvironmentName, setDeleteEnvironmentName] = useState("");
	return {
		error,
		focusedEnvironment,
		deleteEnvironmentName,
		confirmationActive: true,
		setDeleteEnvironmentName,
		submit: () => {
			try {
				if (!session) return;
				if (deleteEnvironmentName !== focusedEnvironment) throw new Error(`Type ${focusedEnvironment} exactly to confirm deletion.`);
				const nextEnvironment = deleteEnvironment(session, focusedEnvironment);
				saveUnlockedSecretManager(session);
				actions.setSession({ ...session, vault: { ...session.vault } });
				actions.selectEnvironment(nextEnvironment, Math.max(0, session.config.environments.indexOf(nextEnvironment)));
				actions.closeModal();
				actions.setMessage(`Deleted ${focusedEnvironment}.`);
				actions.setError(null);
			} catch (cause) { actions.showError(cause); }
		},
	};
}
