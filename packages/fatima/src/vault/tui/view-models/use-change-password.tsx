import { useState } from "react";
import { changeVaultPassword, saveUnlockedSecretManager } from "../../api";
import { useGlobalStore } from "../store/global-store";

export function useChangePassword() {
	const { error, session, actions } = useGlobalStore();
	const [nextPassword, setNextPassword] = useState("");
	const [confirmNextPassword, setConfirmNextPassword] = useState("");
	const [activeField, setActiveField] = useState<"new-password" | "confirm-new-password">("new-password");
	return {
		error,
		nextPassword,
		confirmNextPassword,
		passwordActive: activeField === "new-password",
		confirmationActive: activeField === "confirm-new-password",
		setNextPassword,
		setConfirmNextPassword,
		focusConfirmation: () => setActiveField("confirm-new-password"),
		submit: () => {
			try {
				if (!session) return;
				if (nextPassword !== confirmNextPassword) throw new Error("Passwords do not match.");
				changeVaultPassword(session, nextPassword);
				saveUnlockedSecretManager(session);
				actions.setSession({ ...session, vault: { ...session.vault } });
				actions.closeModal();
				actions.setMessage("Vault password rotated. All access keys were revoked.");
				actions.setError(null);
			} catch (cause) { actions.showError(cause); }
		},
	};
}
