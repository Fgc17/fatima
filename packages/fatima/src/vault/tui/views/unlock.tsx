import type React from "react";
import { useUnlock } from "../view-models/use-unlock";
import { Field } from "../ui/field";
import { Modal } from "../ui/modal";
import { Toast } from "../ui/toast";

export function UnlockView({
	footer,
}: {
	footer: React.ReactNode;
}) {
	const vm = useUnlock();
	return (
		<>
			{vm.error ? <Toast type="error" message={vm.error} /> : null}
			<Modal title="Unlock vault" footer={footer}>
				<Field label="Master password" value={vm.password} onChange={vm.setPassword} active={vm.passwordActive} mask="*" onSubmit={vm.submit} />
			</Modal>
		</>
	);
}
