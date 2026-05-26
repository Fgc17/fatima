import type React from "react";
import { FormFooter, FormGuides } from "../components/form-hints";
import { FormShell } from "../components/shells/form-shell";
import { useGlobalStore } from "../store/global-store";
import { AccessKeyView } from "../views/access-key";
import { AddSecretView } from "../views/add-secret";
import { ChangePasswordView } from "../views/change-password";
import { CommandPaletteView } from "../views/command-palette";
import { CreateEnvironmentView } from "../views/create-environment";
import { DeleteEnvironmentView } from "../views/delete-environment";
import { DeleteSecretView } from "../views/delete-secret";
import { ImportEnvView } from "../views/import-env";
import { RenameEnvironmentView } from "../views/rename-environment";

export function useModal() {
	const { activeModalId, actions } = useGlobalStore();
	return {
		activeModalId,
		openModal: actions.openModal,
		closeModal: actions.closeModal,
		isOpen: (id: string) => activeModalId === id,
	};
}

export function ModalSlot({ id, children }: { id: string; children: React.ReactNode }) {
	const { isOpen } = useModal();
	return isOpen(id) ? <>{children}</> : null;
}

export function ModalPortal() {
	return (
		<>
			<ModalSlot id="command-palette">
				<CommandPaletteView footer={<FormFooter primary="run command" />} />
			</ModalSlot>
			<ModalSlot id="add-secret">
				<FormShell guides={<FormGuides />}>
					<AddSecretView title="Add secret" footer={<FormFooter primary="save + continue" />} />
				</FormShell>
			</ModalSlot>
			<ModalSlot id="edit-secret">
				<FormShell guides={<FormGuides />}>
					<AddSecretView title="Edit secret" footer={<FormFooter primary="save" />} />
				</FormShell>
			</ModalSlot>
			<ModalSlot id="delete-secret">
				<FormShell guides={<FormGuides />}>
					<DeleteSecretView footer={<FormFooter primary="delete" />} />
				</FormShell>
			</ModalSlot>
			<ModalSlot id="import-env">
				<FormShell guides={<FormGuides />}>
					<ImportEnvView footer={<FormFooter primary="import" />} />
				</FormShell>
			</ModalSlot>
			<ModalSlot id="access-key">
				<FormShell guides={<FormGuides />}>
					<AccessKeyView footer={<FormFooter primary="create key" />} />
				</FormShell>
			</ModalSlot>
			<ModalSlot id="create-environment">
				<FormShell guides={<FormGuides />}>
					<CreateEnvironmentView footer={<FormFooter primary="create environment" />} />
				</FormShell>
			</ModalSlot>
			<ModalSlot id="rename-environment">
				<FormShell guides={<FormGuides />}>
					<RenameEnvironmentView footer={<FormFooter primary="rename environment" />} />
				</FormShell>
			</ModalSlot>
			<ModalSlot id="delete-environment">
				<FormShell guides={<FormGuides />}>
					<DeleteEnvironmentView footer={<FormFooter primary="delete environment" />} />
				</FormShell>
			</ModalSlot>
			<ModalSlot id="change-password">
				<FormShell guides={<FormGuides />}>
					<ChangePasswordView footer={<FormFooter primary="change password" />} />
				</FormShell>
			</ModalSlot>
		</>
	);
}
