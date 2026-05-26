import { useState } from "react";
import { createEnvironment, saveUnlockedSecretManager } from "../../api";
import { useGlobalStore } from "../store/global-store";

export function useCreateEnvironment() {
	const { error, session, actions } = useGlobalStore();
	const [newEnvironmentName, setNewEnvironmentName] = useState("");
	return {
		error,
		newEnvironmentName,
		nameActive: true,
		setNewEnvironmentName,
		submit: () => {
			try {
				if (!session) return;
				createEnvironment(session, newEnvironmentName);
				saveUnlockedSecretManager(session);
				actions.setSession({ ...session, vault: { ...session.vault } });
				actions.selectEnvironment(newEnvironmentName.trim(), Math.max(0, session.config.environments.indexOf(newEnvironmentName.trim())));
				actions.closeModal();
				actions.setMessage(`Created ${newEnvironmentName.trim()}.`);
				actions.setError(null);
			} catch (cause) { actions.showError(cause); }
		},
	};
}
