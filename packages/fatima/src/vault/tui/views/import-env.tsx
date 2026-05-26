import type React from "react";
import { Field } from "../ui/field";
import { Modal } from "../ui/modal";
import { useImportEnv } from "../view-models/use-import-env";

export function ImportEnvView({
	footer,
}: {
	footer: React.ReactNode;
}) {
	const vm = useImportEnv();
	return (
		<Modal title={`Import into ${vm.selectedEnvironment}`} footer={footer}>
			<Field label="Env file path" value={vm.draftPath} onChange={vm.setDraftPath} active={vm.pathActive} placeholder=".env.production" onSubmit={vm.submit} />
		</Modal>
	);
}
