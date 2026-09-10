# Skills

Provider-agnostic Claude Code skills: `<skill-name>/SKILL.md` with YAML
frontmatter (`name`, `description`, optional `argument-hint`) and the skill
body below it. Claude Code loads these natively as plugin skills. If a
skill needs interface metadata for another provider that the agnostic
format can't express, add it alongside as `<skill-name>/agents/<provider>.yaml`
rather than duplicating the skill.
