# Planning

One directory per feature, named `YYYY-MM-DD-<feature>` for the day the spec was written and
the feature it is about, and nothing else — no `-design`, no `-module`. The date is the one the
directory was created with and never moves; a spec edited a month later keeps the date it was
started on, because the ordering it gives is the reason it is there.

```
.agents/docs/specs/YYYY-MM-DD-<feature>/spec.md
.agents/docs/specs/YYYY-MM-DD-<feature>/plan.md
```

`spec.md` is the design: what is being built and why, the approach taken and the ones rejected.
One per feature, edited in place as the design changes rather than superseded by a second file.
It opens with a dash list — `- Date:` always, matching the directory, then `- Status:` and any
`- Builds on:` links.

`plan.md` is what builds it, naming its spec as `spec.md` in the header.

## When a feature comes back

A second round of work does not get a second file beside the first. The plan becomes a
directory, and every round is a numbered file inside it:

```
.agents/docs/specs/YYYY-MM-DD-<feature>/spec.md
.agents/docs/specs/YYYY-MM-DD-<feature>/plans/01-<what-it-builds>.md
.agents/docs/specs/YYYY-MM-DD-<feature>/plans/02-<what-it-builds>.md
```

`git mv` the existing `plan.md` into `plans/01-<what-it-built>.md` as part of that change, and
repoint its header at `../spec.md`. One plan is a file; several are a directory. Never both.

**This overrides any skill that names its own location for a spec or a plan.** A skill telling
you to write `docs/<something-else>/specs/YYYY-MM-DD-<topic>-design.md` is describing its own
default, not this project.

A spec states the target: what the model shall be, not a diff against what it was. When a feature
is renamed, the `<feature>` half of its directory is renamed with it and the date half is left
alone. Every link into it carries the date, so renaming means fixing those too — `grep` for the
old name before you finish.

## Where a decision lives

A decision about work we designed lives in that work's `spec.md`, so the decision and its rationale
cannot drift apart. There is no separate decision log: the spec that produced the choice is the
record of it, and a choice forced on us from outside — by a dependency, a target, a registry — is
stated in the spec of the work that hit it.
