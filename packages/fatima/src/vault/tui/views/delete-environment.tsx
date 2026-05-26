import type React from "react";
import { theme } from "../theme";
import { Field } from "../ui/field";
import { Modal } from "../ui/modal";
import { Text } from "../ui/text";
import { Toast } from "../ui/toast";
import { useDeleteEnvironment } from "../view-models/use-delete-environment";

export function DeleteEnvironmentView({ footer }: { footer: React.ReactNode }) {
	const vm = useDeleteEnvironment();
	return (
		<>
			{vm.error ? <Toast type="error" message={vm.error} /> : null}
			<Modal title={`Delete environment · ${vm.focusedEnvironment}`} tone="danger" footer={footer}>
				<Text color={theme.fg} bold>Delete {vm.focusedEnvironment} and its encrypted secrets?</Text>
				<Text color={theme.muted}>Type the environment name exactly to confirm.</Text>
				<Field label="Type environment name to confirm" value={vm.deleteEnvironmentName} onChange={vm.setDeleteEnvironmentName} active={vm.confirmationActive} placeholder={vm.focusedEnvironment} onSubmit={vm.submit} />
			</Modal>
		</>
	);
}
