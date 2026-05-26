import { useState } from "react";
import { initializeSecretManagerStore, unlockSecretManagerWithPassword } from "../../api";
import { useGlobalStore } from "../store/global-store";

export function useOnboarding() {
	const { config, initialPassword, error, project, actions } = useGlobalStore();
	const [password, setPassword] = useState(initialPassword ?? "");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [activeField, setActiveField] = useState<"password" | "confirm-password">("password");
	return {
		error,
		project,
		password,
		confirmPassword,
		passwordActive: activeField === "password",
		confirmPasswordActive: activeField === "confirm-password",
		setPassword,
		setConfirmPassword,
		focusConfirmPassword: () => setActiveField("confirm-password"),
		submit: () => {
			try {
				if (password.length === 0) throw new Error("Password cannot be empty.");
				if (password !== confirmPassword) throw new Error("Passwords do not match.");
				initializeSecretManagerStore(password, config);
				const unlocked = unlockSecretManagerWithPassword(password, config);
				actions.setSession(unlocked);
				actions.setSelectedEnvironment(unlocked.config.defaultEnvironment);
				actions.navigate("vault");
				actions.setMessage("Vault initialized.");
				actions.setError(null);
			} catch (cause) {
				actions.showError(cause);
			}
		},
	};
}
