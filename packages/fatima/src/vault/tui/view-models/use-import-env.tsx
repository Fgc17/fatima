import { useState } from "react";
import { importEnvFileIntoVault, saveUnlockedSecretManager } from "../../api";
import { useGlobalStore } from "../store/global-store";

export function useImportEnv() {
	const { session, selectedEnvironment, actions } = useGlobalStore();
	const [draftPath, setDraftPath] = useState("");
	return {
		selectedEnvironment,
		draftPath,
		pathActive: true,
		setDraftPath,
		submit: () => {
			try {
				if (!session) return;
				const count = importEnvFileIntoVault(session, selectedEnvironment, draftPath);
				saveUnlockedSecretManager(session);
				actions.setSession({ ...session, vault: { ...session.vault } });
				actions.closeModal();
				actions.setMessage(`Imported ${count} secrets from ${draftPath}.`);
				actions.setError(null);
			} catch (cause) { actions.showError(cause); }
		},
	};
}
