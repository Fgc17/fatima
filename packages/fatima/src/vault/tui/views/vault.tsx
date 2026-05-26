import { CommandBar } from "../components/command-bar";
import { useVault } from "../view-models/use-vault";
import { EnvironmentTabs } from "../view-partials/vault/environment-tabs";
import { SecretMatrix, SecretTable } from "../view-partials/vault/secret-table";
import { Box } from "../ui/box";
import { Panel } from "../ui/panel";
import { Toast } from "../ui/toast";

export function VaultView() {
	const {
		message,
		overlayOpen,
		view,
		environmentList,
		focusedEnvironment,
		selectedEnvironment,
		selectedSecrets,
		selectedIndex,
		secretCounts,
		totalSecretCount,
		matrixKeys,
		session,
		revealed,
		maxTableRows,
		matrixRow,
		matrixColumn,
		selectEnvironment,
		selectSecret,
		selectMatrixCell,
		showCommandBar,
	} = useVault();
	if (!session) return null;
	return (
		<Box flexDirection="column" flexGrow={1} width="100%">
			{message ? <Toast type="info" message={message} /> : null}
			<Box flexGrow={1} width="100%" gap={2} opacity={overlayOpen ? 0.55 : 1}>
				<Panel title="vault" subtitle={`${environmentList.length} envs`} width={26} focused={!overlayOpen && view === "environment"}>
					<EnvironmentTabs
						environments={environmentList}
						selectedEnvironment={focusedEnvironment}
						counts={secretCounts}
						totalSecrets={totalSecretCount}
						focused={!overlayOpen && view === "environment"}
						onSelect={selectEnvironment}
					/>
				</Panel>
				<Panel
					title={view === "environment" ? selectedEnvironment : "matrix"}
					subtitle={view === "environment" ? `${selectedSecrets.length} secrets` : `${matrixKeys.length} keys`}
					flexGrow={1}
					focused={!overlayOpen}
				>
					{view === "environment" ? (
						<SecretTable
							title={`${selectedEnvironment} secrets`}
							secrets={selectedSecrets}
							selectedIndex={selectedIndex}
							revealed={revealed}
							maxRows={maxTableRows}
							onSelect={selectSecret}
						/>
					) : (
						<SecretMatrix
							environments={environmentList}
							vault={session.vault}
							revealed={revealed}
							maxRows={maxTableRows}
							selectedRow={matrixRow}
							selectedColumn={matrixColumn}
							onSelect={selectMatrixCell}
						/>
					)}
				</Panel>
			</Box>
			{showCommandBar ? <CommandBar /> : null}
		</Box>
	);
}
