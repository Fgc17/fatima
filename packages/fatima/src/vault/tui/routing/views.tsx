import type React from "react";
import { useGlobalStore } from "../store/global-store";

export function useViews() {
	const { mode, actions } = useGlobalStore();
	return {
		currentView: mode,
		navigate: actions.navigate,
		isActive: (id: string) => mode === id,
	};
}

export function Views({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}

export function View({ id, children }: { id: string; children: React.ReactNode }) {
	const { isActive } = useViews();
	return isActive(id) ? <>{children}</> : null;
}
