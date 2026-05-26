import { useState } from "react";
import { renameEnvironment, saveUnlockedSecretManager } from "../../api";
import { useGlobalStore } from "../store/global-store";

export function useRenameEnvironment() {
	const { error, session, focusedEnvironment, actions } = useGlobalStore();
	const [renameEnvironmentName, setRenameEnvironmentName] = useState(focusedEnvironment);
	return {
		error,
		focusedEnvironment,
		renameEnvironmentName,
		nameActive: true,
		setRenameEnvironmentName,
		submit: () => {
			try {
				if (!session) return;
				renameEnvironment(session, focusedEnvironment, renameEnvironmentName);
				saveUnlockedSecretManager(session);
				actions.setSession({ ...session, vault: { ...session.vault } });
				actions.selectEnvironment(renameEnvironmentName.trim(), Math.max(0, session.config.environments.indexOf(renameEnvironmentName.trim())));
				actions.closeModal();
				actions.setMessage(`Renamed ${focusedEnvironment} to ${renameEnvironmentName.trim()}.`);
				actions.setError(null);
			} catch (cause) { actions.showError(cause); }
		},
	};
}
