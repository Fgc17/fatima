import type { SecretRecord } from "../../../types";
import { useWindowSize } from "../../hooks/use-window-size";
import { theme } from "../../theme";
import { Box } from "../../ui/box";
import { Text } from "../../ui/text";

const MATRIX_POINTER_WIDTH = 2;
const MATRIX_KEY_WIDTH = 22;
const MATRIX_MIN_COLUMN_WIDTH = 12;

function maskValue(value: string): string {
	return "•".repeat(Math.max(8, Math.min(16, value.length)));
}

function truncate(value: string, width: number): string {
	return value.length > width
		? `${value.slice(0, Math.max(0, width - 1))}…`
		: value.padEnd(width, " ");
}

function getVisibleWindow(
	total: number,
	selectedIndex: number,
	maxVisible: number,
) {
	const visibleCount = Math.max(1, Math.min(total, maxVisible));
	const safeSelectedIndex = Math.max(
		0,
		Math.min(selectedIndex, Math.max(0, total - 1)),
	);
	const start = Math.max(
		0,
		Math.min(
			safeSelectedIndex - Math.floor(visibleCount / 2),
			total - visibleCount,
		),
	);

	return { start, end: start + visibleCount };
}

function getMatrixColumnWindow(
	width: number,
	environments: string[],
	selectedColumn: number,
) {
	const maxVisibleColumns = Math.max(
		1,
		Math.min(
			environments.length,
			Math.floor(
				(width - MATRIX_POINTER_WIDTH - MATRIX_KEY_WIDTH) /
					(MATRIX_MIN_COLUMN_WIDTH + 1),
			),
		),
	);
	const { start, end } = getVisibleWindow(
		environments.length,
		selectedColumn,
		maxVisibleColumns,
	);
	const visibleEnvironments = environments.slice(start, end);
	const columnWidth = Math.max(
		MATRIX_MIN_COLUMN_WIDTH,
		Math.floor(
			(width -
				MATRIX_POINTER_WIDTH -
				MATRIX_KEY_WIDTH -
				visibleEnvironments.length) /
				Math.max(1, visibleEnvironments.length),
		),
	);

	return {
		columnWidth,
		hasHiddenLeft: start > 0,
		hasHiddenRight: end < environments.length,
		start,
		visibleEnvironments,
	};
}

function CenteredEmptyState() {
	return (
		<Box
			flexGrow={1}
			justifyContent="center"
			alignItems="center"
			flexDirection="column"
		>
			<Text color={theme.fg}>No secrets yet.</Text>
			<Text color={theme.muted}>Press 'a' to add your first secret,</Text>
			<Text color={theme.muted}>or 'i' to import a .env file.</Text>
		</Box>
	);
}

export function SecretTable({
	title,
	secrets,
	selectedIndex,
	revealed,
	maxRows,
	onSelect,
}: {
	title: string;
	secrets: SecretRecord[];
	selectedIndex: number;
	revealed: boolean;
	maxRows?: number;
	onSelect?: (index: number) => void;
}) {
	void title;
	const { columns } = useWindowSize();
	const width = Math.max(40, columns - 6);
	const rowLimit = Math.max(1, maxRows ?? secrets.length);
	const { start, end } = getVisibleWindow(
		secrets.length,
		selectedIndex,
		rowLimit,
	);
	const visibleSecrets = secrets.slice(start, end);
	const fillerRows = Math.max(0, rowLimit - visibleSecrets.length);
	const fillerRowIds = Array.from(
		{ length: fillerRows },
		(_, fillerOffset) => start + visibleSecrets.length + fillerOffset,
	);

	return (
		<Box flexDirection="column" flexGrow={1} width="100%">
			<Box paddingX={1} marginBottom={1}>
				<Text color={theme.faint}>{truncate("key", 30)}</Text>
				<Text color={theme.faint}>value</Text>
			</Box>
			{secrets.length === 0 ? (
				<CenteredEmptyState />
			) : (
				<>
					{visibleSecrets.map(({ id, key, value }, index) => {
						const rowIndex = start + index;
						const active = rowIndex === selectedIndex;
						return (
							<Box
								key={id}
								paddingX={1}
								marginBottom={0}
								onMouseUp={() => onSelect?.(rowIndex)}
							>
								<Text color={active ? theme.fg : theme.muted} bold={active}>
									{active ? "› " : "  "}
									{truncate(key, 30)}
								</Text>
								<Text color={revealed || active ? theme.fg : theme.muted}>
									{truncate(
										revealed ? value : maskValue(value),
										Math.max(12, width - 34),
									)}
								</Text>
							</Box>
						);
					})}
					{fillerRowIds.map((rowId) => (
						<Box key={`table-filler-row-${rowId}`} height={1} />
					))}
				</>
			)}
		</Box>
	);
}

export function SecretMatrixHeader({
	environments,
	selectedColumn = 0,
}: {
	environments: string[];
	selectedColumn?: number;
}) {
	const { columns } = useWindowSize();
	const width = Math.max(40, columns - 6);
	const { hasHiddenLeft, hasHiddenRight, start, visibleEnvironments } =
		getMatrixColumnWindow(width, environments, selectedColumn);

	return (
		<Box justifyContent="space-between" width="100%" marginBottom={1}>
			<Text color={theme.faint}>matrix</Text>
			<Box>
				{hasHiddenLeft ? <Text color={theme.borderMuted}>…</Text> : null}
				{visibleEnvironments.map((environment, index) => {
					const active = start + index === selectedColumn;
					return (
						<Text
							key={environment}
							color={active ? theme.fg : theme.muted}
							bold={active}
						>
							{environment}
						</Text>
					);
				})}
				{hasHiddenRight ? <Text color={theme.borderMuted}> …</Text> : null}
			</Box>
		</Box>
	);
}

export function SecretMatrix({
	environments,
	vault,
	revealed,
	maxRows,
	selectedRow = 0,
	selectedColumn = 0,
	onSelect,
}: {
	environments: string[];
	vault: Record<string, SecretRecord[]>;
	revealed: boolean;
	maxRows?: number;
	selectedRow?: number;
	selectedColumn?: number;
	onSelect?: (row: number, column: number) => void;
}) {
	const { columns } = useWindowSize();
	const width = Math.max(40, columns - 6);
	const rowLimit = Math.max(1, maxRows ?? 1);
	const keys = Array.from(
		new Set(
			environments.flatMap((environment) =>
				(vault[environment] ?? []).map((secret) => secret.key),
			),
		),
	).sort();
	const {
		columnWidth,
		start: columnStart,
		visibleEnvironments,
	} = getMatrixColumnWindow(width, environments, selectedColumn);
	const { start, end } = getVisibleWindow(keys.length, selectedRow, rowLimit);
	const visibleKeys = keys.slice(start, end);
	const fillerRows = Math.max(0, rowLimit - visibleKeys.length);
	const fillerRowIds = Array.from(
		{ length: fillerRows },
		(_, fillerOffset) => start + visibleKeys.length + fillerOffset,
	);

	return (
		<Box flexDirection="column" flexGrow={1} width="100%">
			<Box paddingX={1} marginBottom={1}>
				<Text color={theme.faint}>{truncate("key", MATRIX_KEY_WIDTH)}</Text>
				{visibleEnvironments.map((value, index) => {
					const active = columnStart + index === selectedColumn;
					return (
						<Text
							key={value}
							bold={active}
							color={active ? theme.fg : theme.muted}
						>
							{truncate(value, Math.max(0, columnWidth - 1))}
						</Text>
					);
				})}
			</Box>
			{keys.length === 0 ? (
				<CenteredEmptyState />
			) : (
				<>
					{visibleKeys.map((key, index) => {
						const rowIndex = start + index;
						const rowActive = rowIndex === selectedRow;
						return (
							<Box
								key={key}
								paddingX={1}
								onMouseUp={() => onSelect?.(rowIndex, selectedColumn)}
							>
								<Text
									color={rowActive ? theme.primary : theme.muted}
									bold={rowActive}
								>
									{rowActive ? "› " : "  "}
								</Text>
								<Text
									color={rowActive ? theme.fg : theme.muted}
									bold={rowActive}
								>
									{truncate(key, MATRIX_KEY_WIDTH)}
								</Text>
								{visibleEnvironments.map((environment, offset) => {
									const columnIndex = columnStart + offset;
									const secret = (vault[environment] ?? []).find(
										(entry) => entry.key === key,
									);
									const value = secret?.value;
									const content = value
										? revealed
											? value
											: maskValue(value)
										: "-";
									const active = rowActive && columnIndex === selectedColumn;
									return (
										<Text
											key={environment}
											color={
												active
													? theme.fg
													: value
														? theme.muted
														: theme.borderMuted
											}
											bold={active}
											onMouseUp={() => onSelect?.(rowIndex, columnIndex)}
										>
											{truncate(
												active ? content.toUpperCase() : content,
												columnWidth,
											)}
										</Text>
									);
								})}
							</Box>
						);
					})}
					{fillerRowIds.map((rowId) => (
						<Box key={`matrix-filler-row-${rowId}`} height={1} />
					))}
				</>
			)}
		</Box>
	);
}
