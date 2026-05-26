import type React from "react";
import { EnvironmentPicker } from "../components/environment-picker";
import { theme } from "../theme";
import { Box } from "../ui/box";
import { Field } from "../ui/field";
import { Modal } from "../ui/modal";
import { Text } from "../ui/text";
import { useAccessKey } from "../view-models/use-access-key";

export function AccessKeyView({
	footer,
}: {
	footer: React.ReactNode;
}) {
	const vm = useAccessKey();
	return (
		<Modal title={vm.capturedKey ? "Access key generated" : "Generate access key"} tone="success" footer={footer}>
			{vm.capturedKey ? (
				<Box flexDirection="column" gap={1}>
					<Text color={theme.fg} bold>ACCESS KEY — SHOWN ONCE</Text>
					<Box flexDirection="column" backgroundColor={theme.inputSurface} paddingX={1}>
						<Text color={theme.fg} bold>{vm.capturedKey}</Text>
					</Box>
					<Text color={theme.muted}>Store it in CI as FATIMA_ACCESS_KEY. Press SHIFT+C to copy.</Text>
					{vm.message ? <Text color={theme.muted}>{vm.message}</Text> : null}
				</Box>
			) : (
				<>
					<Text color={theme.muted}>Access keys can read only the selected environments.</Text>
					<Field label="Access key name" value={vm.newKeyName} onChange={vm.setNewKeyName} active={vm.keyNameActive} onSubmit={vm.focusEnvironments} />
					<EnvironmentPicker environments={vm.environmentList} selectedEnvironments={vm.draftEnvironments} cursor={vm.environmentCursor} active={vm.environmentsActive} error={vm.error} submitLabel="create key" />
				</>
			)}
		</Modal>
	);
}
