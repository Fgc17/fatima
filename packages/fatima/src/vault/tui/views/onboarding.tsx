import type React from "react";
import { theme } from "../theme";
import { useOnboarding } from "../view-models/use-onboarding";
import { Box } from "../ui/box";
import { Field } from "../ui/field";
import { Modal } from "../ui/modal";
import { Pill } from "../ui/pill";
import { Text } from "../ui/text";
import { Toast } from "../ui/toast";

export function OnboardingView({
	footer,
}: {
	footer: React.ReactNode;
}) {
	const vm = useOnboarding();
	return (
		<>
			{vm.error ? <Toast type="error" message={vm.error} /> : null}
			<Modal title="Initialize project vault" tone="warning" footer={footer}>
				<Text bold color={theme.fg}>WELCOME TO FATIMA VAULT</Text>
				<Text color={theme.muted}>Local-first encrypted secrets for this project.</Text>
				<Box marginY={1} gap={1}>
					<Pill label={`store ${vm.project.storePath}`} tone="muted" />
					<Pill label={`${vm.project.environments.length} environments`} tone="brand" />
				</Box>
				<Text color={theme.muted}>Environment set: {vm.project.environments.join(", ")}</Text>
				<Field label="Master password" value={vm.password} onChange={vm.setPassword} active={vm.passwordActive} mask="*" onSubmit={vm.focusConfirmPassword} />
				<Field label="Confirm password" value={vm.confirmPassword} onChange={vm.setConfirmPassword} active={vm.confirmPasswordActive} mask="*" onSubmit={vm.submit} />
			</Modal>
		</>
	);
}
