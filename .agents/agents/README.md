# Agents

Provider-agnostic subagent definitions. Each file is `<name>.md`: YAML
frontmatter (`name`, `description`, `tools`, `model`, `memory`) followed by
the system prompt as the body. Claude Code loads these natively as plugin
subagents. A provider whose format can't express this directly should point
back at the file here rather than duplicating the prompt — see `providers/`.
