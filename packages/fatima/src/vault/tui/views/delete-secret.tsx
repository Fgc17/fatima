import type React from "react";
import { theme } from "../theme";
import { Field } from "../ui/field";
import { Modal } from "../ui/modal";
import { Text } from "../ui/text";
import { Toast } from "../ui/toast";
import { useDeleteSecret } from "../view-models/use-delete-secret";

export function DeleteSecretView({ footer }: { footer: React.ReactNode }) {
	const vm = useDeleteSecret();
	if (!vm.activeSecret) return null;
	return (
		<Modal title="Delete secret" tone="danger" footer={footer}>
			<Text color={theme.fg} bold>Delete {vm.activeSecret.key} from {vm.activeSecret.environment}?</Text>
			<Text color={theme.muted}>This removes it from the encrypted local vault.</Text>
			{vm.error ? <Toast type="error" message={vm.error} /> : null}
			<Field label="Type secret name to confirm" value={vm.deleteSecretName} onChange={vm.setDeleteSecretName} active={vm.confirmationActive} placeholder={vm.activeSecret.key} onSubmit={vm.submit} />
		</Modal>
	);
}
