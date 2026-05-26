import type React from "react";
import { theme } from "../theme";
import { Field } from "../ui/field";
import { Modal } from "../ui/modal";
import { Text } from "../ui/text";
import { Toast } from "../ui/toast";
import { useChangePassword } from "../view-models/use-change-password";

export function ChangePasswordView({ footer }: { footer: React.ReactNode }) {
	const vm = useChangePassword();
	return (
		<>
			{vm.error ? <Toast type="error" message={vm.error} /> : null}
			<Modal title="Rotate vault password" tone="warning" footer={footer}>
				<Text color={theme.muted}>This rotates all environment keys and revokes every generated access key.</Text>
				<Field label="New password" value={vm.nextPassword} onChange={vm.setNextPassword} active={vm.passwordActive} mask="*" onSubmit={vm.focusConfirmation} />
				<Field label="Confirm new password" value={vm.confirmNextPassword} onChange={vm.setConfirmNextPassword} active={vm.confirmationActive} mask="*" onSubmit={vm.submit} />
			</Modal>
		</>
	);
}
