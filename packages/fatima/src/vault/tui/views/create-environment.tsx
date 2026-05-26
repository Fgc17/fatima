import type React from "react";
import { Field } from "../ui/field";
import { Modal } from "../ui/modal";
import { Toast } from "../ui/toast";
import { useCreateEnvironment } from "../view-models/use-create-environment";

export function CreateEnvironmentView({ footer }: { footer: React.ReactNode }) {
	const vm = useCreateEnvironment();
	return (
		<>
			{vm.error ? <Toast type="error" message={vm.error} /> : null}
			<Modal title="Create environment" footer={footer}>
				<Field label="Environment name" value={vm.newEnvironmentName} onChange={vm.setNewEnvironmentName} active={vm.nameActive} placeholder="preview" onSubmit={vm.submit} />
			</Modal>
		</>
	);
}
