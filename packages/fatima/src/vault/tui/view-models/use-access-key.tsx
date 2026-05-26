import { useState } from "react";
import { generateSecondaryAccessKey } from "../../api";
import { useInput } from "../hooks/use-input";
import { useGlobalStore } from "../store/global-store";

export function useAccessKey() {
	const { config, session, message, focusedEnvironment, environmentList, error, actions } = useGlobalStore();
	const [capturedKey, setCapturedKey] = useState("");
	const [newKeyName, setNewKeyName] = useState("");
	const [activeField, setActiveField] = useState<"key-name" | "key-environments">("key-name");
	const [environmentCursor, setEnvironmentCursor] = useState(Math.max(0, environmentList.indexOf(focusedEnvironment)));
	const [draftEnvironments, setDraftEnvironments] = useState([focusedEnvironment]);

	function createKey() {
		if (!session) return;
		const result = generateSecondaryAccessKey(session, newKeyName, draftEnvironments, { config });
		setCapturedKey(result.key);
		actions.setMessage("Generated access key.");
		actions.setError(null);
	}

	function copyToClipboard(value: string) {
		process.stdout.write(`\x1b]52;c;${Buffer.from(value).toString("base64")}\x07`);
	}

	useInput((input, key) => {
		if (capturedKey) {
			if (key.shift && input === "C") {
				copyToClipboard(capturedKey);
				actions.setMessage("Access key copied.");
				actions.setError(null);
				return;
			}
			if (key.return) {
				setCapturedKey("");
				actions.closeModal();
				return;
			}
			return;
		}
		if (key.tab || input === "\t") return setActiveField((value) => value === "key-name" ? "key-environments" : "key-name");
		if (key.upArrow) {
			if (activeField === "key-environments" && environmentCursor > 0) setEnvironmentCursor((value) => Math.max(0, value - 1));
			else setActiveField("key-name");
			return;
		}
		if (key.downArrow) {
			if (activeField === "key-environments") setEnvironmentCursor((value) => Math.min(environmentList.length - 1, value + 1));
			else setActiveField("key-environments");
			return;
		}
		if (activeField === "key-environments" && (input === " " || input === "x")) {
			const environment = environmentList[environmentCursor];
			if (!environment) return;
			setDraftEnvironments((values) => values.includes(environment) ? values.filter((value) => value !== environment) : [...values, environment]);
			actions.setError(null);
			return;
		}
		if (key.return && activeField === "key-environments") {
			try { createKey(); } catch (cause) { actions.showError(cause); }
		}
	});

	return {
		capturedKey,
		message,
		newKeyName,
		environmentList,
		draftEnvironments,
		environmentCursor,
		error,
		keyNameActive: activeField === "key-name",
		environmentsActive: activeField === "key-environments",
		setNewKeyName,
		focusEnvironments: () => setActiveField("key-environments"),
	};
}
