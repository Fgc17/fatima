import { useState } from "react";
import { unlockSecretManagerWithPassword } from "../../api";
import { useGlobalStore } from "../store/global-store";

export function useUnlock() {
	const { config, initialPassword, error, actions } = useGlobalStore();
	const [password, setPassword] = useState(initialPassword ?? "");
	return {
		error,
		password,
		passwordActive: true,
		setPassword,
		submit: () => {
			try {
				const unlocked = unlockSecretManagerWithPassword(password, config);
				actions.setSession(unlocked);
				actions.setSelectedEnvironment(unlocked.config.defaultEnvironment);
				actions.navigate("vault");
				actions.setMessage("Vault unlocked.");
				actions.setError(null);
			} catch (cause) {
				actions.showError(cause);
			}
		},
	};
}
