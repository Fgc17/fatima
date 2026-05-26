import { useState } from "react";
import { saveUnlockedSecretManager, setSecretValue } from "../../api";
import { useInput } from "../hooks/use-input";
import { useGlobalStore } from "../store/global-store";

export function useAddSecret() {
	const { session, activeModalId, view, selectedEnvironment, matrixColumn, environmentList, activeSecret, error, actions } = useGlobalStore();
	const editing = activeModalId === "edit-secret";
	const adding = activeModalId === "add-secret";
	const [draftKey, setDraftKey] = useState(editing ? activeSecret?.key ?? "" : "");
	const [draftValue, setDraftValue] = useState(editing ? activeSecret?.value ?? "" : "");
	const [activeField, setActiveField] = useState<"secret-key" | "secret-value" | "secret-environments">("secret-key");
	const [environmentCursor, setEnvironmentCursor] = useState(Math.max(0, matrixColumn));
	const [draftEnvironments, setDraftEnvironments] = useState<string[]>(
		adding && view === "matrix"
			? [environmentList[matrixColumn] ?? selectedEnvironment]
			: [selectedEnvironment],
	);

	const fields: Array<"secret-key" | "secret-value" | "secret-environments"> = adding && view === "matrix"
		? ["secret-key", "secret-value", "secret-environments"]
		: ["secret-key", "secret-value"];

	function step(direction: -1 | 1) {
		const index = fields.indexOf(activeField);
		const current = index === -1 ? 0 : index;
		setActiveField(fields[Math.max(0, Math.min(fields.length - 1, current + direction))] ?? fields[0]);
	}

	function save() {
		if (!session) return;
		const targetEnvironments = adding && view === "matrix" ? draftEnvironments : [editing ? activeSecret?.environment ?? selectedEnvironment : selectedEnvironment];
		if (targetEnvironments.length === 0) throw new Error("Select at least one environment.");
		for (const environment of targetEnvironments) {
			setSecretValue(session, environment, draftKey, draftValue, { id: editing ? activeSecret?.id ?? undefined : undefined });
		}
		saveUnlockedSecretManager(session);
		actions.setSession({ ...session, vault: { ...session.vault } });
		if (editing) {
			actions.closeModal();
		} else {
			setDraftKey("");
			setDraftValue("");
			setDraftEnvironments(view === "matrix" ? [environmentList[environmentCursor] ?? selectedEnvironment] : [selectedEnvironment]);
			setActiveField("secret-key");
		}
		actions.setMessage(`${adding ? "Added" : "Updated"} ${draftKey}.`);
		actions.setError(null);
	}

	useInput((input, key) => {
		if (!(adding || editing)) return;
		if (key.tab || input === "\t") return setActiveField(fields[(fields.indexOf(activeField) + 1) % fields.length] ?? fields[0]);
		if (key.upArrow) {
			if (activeField === "secret-environments" && environmentCursor > 0) setEnvironmentCursor((value) => Math.max(0, value - 1));
			else step(-1);
			return;
		}
		if (key.downArrow) {
			if (activeField === "secret-environments") setEnvironmentCursor((value) => Math.min(environmentList.length - 1, value + 1));
			else step(1);
			return;
		}
		if (activeField === "secret-environments" && (input === " " || input === "x")) {
			const environment = environmentList[environmentCursor];
			if (!environment) return;
			setDraftEnvironments((values) => values.includes(environment) ? values.filter((value) => value !== environment) : [...values, environment]);
			actions.setError(null);
			return;
		}
		if (key.return && activeField === "secret-environments") {
			try { save(); } catch (cause) { actions.showError(cause); }
		}
	});

	return {
		draftKey,
		draftValue,
		error,
		environmentList,
		draftEnvironments,
		environmentCursor,
		showEnvironmentPicker: adding && view === "matrix",
		keyActive: activeField === "secret-key",
		valueActive: activeField === "secret-value",
		environmentsActive: activeField === "secret-environments",
		setDraftKey,
		setDraftValue,
		focusValue: () => setActiveField("secret-value"),
		submitValue: () => {
			try {
				if (adding && view === "matrix") {
					setActiveField("secret-environments");
					return;
				}
				save();
			} catch (cause) {
				actions.showError(cause);
			}
		},
	};
}
