# Providers

Config for AI tools whose agent/command format can't be expressed by the
agnostic `agents/` and `commands/` folders above (permission sandboxing,
knowledge bases, hooks, keyboard shortcuts, model pins, etc.).

Add a subfolder per provider, e.g. `providers/<name>/`, and point its
`prompt`/equivalent field back at the agnostic source instead of
duplicating it — e.g. `"prompt": "file://../../agents/<name>.md"`. Keep any
provider-managed runtime directory (like a local `.kiro/`) out of git; this
folder holds only the checked-in adapter config.

No provider needs this yet — Claude Code reads `agents/` and `commands/`
natively. Add a folder here the first time a second tool does.
