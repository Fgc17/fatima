import type React from "react";
import { EnvironmentPicker } from "../components/environment-picker";
import { Field } from "../ui/field";
import { Modal } from "../ui/modal";
import { useAddSecret } from "../view-models/use-add-secret";

export function AddSecretView({
	title,
	footer,
}: {
	title: string;
	footer: React.ReactNode;
}) {
	const vm = useAddSecret();
	return (
		<Modal title={title} footer={footer}>
			<Field label="Secret key" value={vm.draftKey} onChange={vm.setDraftKey} active={vm.keyActive} onSubmit={vm.focusValue} />
			<Field label="Secret value" value={vm.draftValue} onChange={vm.setDraftValue} active={vm.valueActive} onSubmit={vm.submitValue} />
			{vm.showEnvironmentPicker ? (
				<EnvironmentPicker
					environments={vm.environmentList}
					selectedEnvironments={vm.draftEnvironments}
					cursor={vm.environmentCursor}
					active={vm.environmentsActive}
					error={vm.error}
					submitLabel="save"
				/>
			) : null}
		</Modal>
	);
}
