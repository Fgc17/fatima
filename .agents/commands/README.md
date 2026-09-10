# Commands

Provider-agnostic slash commands. One `.md` file per command, or nested
under a subfolder for a namespace (`foo/bar.md` → `/foo:bar`). The body is
the prompt, with `$ARGUMENTS` standing in for user input. Claude Code loads
these natively as plugin commands.
