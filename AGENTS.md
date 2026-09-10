# AGENTS.md

Every task runs under Lesser Agent Driven Development: the primary agent orchestrates and never
implements, and the lesser agent performs every edit, command and commit. Read
`lesser-agent-driven-development/SKILL.md` before changing anything.

| Role    | Agent    |
| ------- | -------- |
| Primary | Opus 5   |
| Lesser  | Sonnet 5 |

Fatima is safe secrets and environment management. A Cargo workspace in `crates/` holds it: the
`fatima` CLI with its terminal vault UI, the `fatima-core` library every surface is built on, a
`fatima-wasm` build, and the `task` crate that drives releases. `packages/js` wraps the WASM build
as `@fatima.dev/js`, and `packages/web` is the Astro documentation site. bun, turbo, and Oxc for
lint and format.

This file only routes. Every rule lives in exactly one place, and that place is never here, so
read the row before you do the thing rather than after a rule fires.

| Doing                              | Read                               |
| ---------------------------------- | ---------------------------------- |
| Writing code                       | `.agents/docs/code.md`             |
| Writing docs or copy               | `copywriting/SKILL.md`             |
| Fixing a bug                       | `superpowers:systematic-debugging` |
| Exploring what to build            | `superpowers:brainstorming`        |
| Planning a feature                 | `.agents/docs/planning.md`         |
| Running anything                   | `.agents/docs/commands.md`         |
| Raising an error                   | `.agents/docs/errors.md`           |
| Understanding runtime              | `.agents/docs/runtime.md`          |
| Deleting, replacing, renaming away | `remove/SKILL.md`                  |
| Committing                         | `commit/SKILL.md`                  |

Nothing is finished until it clears `.agents/docs/done.md`.
