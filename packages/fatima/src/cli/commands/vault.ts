import { Flags } from "@oclif/core";
import { resolveDefaultVaultPassword } from "../../vault/api";
import { BaseCommand } from "../base-command";

export default class Vault extends BaseCommand<typeof Vault> {
	static description = "Open the Fatima vault TUI";

	static flags = {
		password: Flags.string({
			description: "Vault password or FATIMA_PASSWORD",
		}),
		config: BaseCommand.baseFlags.config,
	};

	public async run(): Promise<void> {
		const { runTui } = await import("../../vault/tui/render");
		await runTui(
			this.flags.config,
			resolveDefaultVaultPassword(this.flags.password),
		);
	}
}
