import type React from "react";
import { Field } from "../ui/field";
import { Modal } from "../ui/modal";
import { Toast } from "../ui/toast";
import { useRenameEnvironment } from "../view-models/use-rename-environment";

export function RenameEnvironmentView({ footer }: { footer: React.ReactNode }) {
	const vm = useRenameEnvironment();
	return (
		<>
			{vm.error ? <Toast type="error" message={vm.error} /> : null}
			<Modal title={`Rename environment · ${vm.focusedEnvironment}`} footer={footer}>
				<Field label="Environment name" value={vm.renameEnvironmentName} onChange={vm.setRenameEnvironmentName} active={vm.nameActive} onSubmit={vm.submit} />
			</Modal>
		</>
	);
}
