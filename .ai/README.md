# .ai — Repository AI context and jobs

Purpose

- Store repository-scoped jobs, tasks, and predefined AI actions/prompts.
- Keep small, human-readable definitions that tools and AI assistants can read to understand project-level workflows.

Design goals

- Tracked in git (not ignored) so changes are versioned.
- No secrets or credentials stored here — treat this folder as public repository content.
- Small, discoverable files: `jobs.yaml`, `actions/` (action descriptions & prompt templates), `templates.md`.

How to use

- The AI or automation runner can read `.ai/jobs.yaml` to know available jobs.
- Developers can add new actions to `.ai/actions/` describing input, output, and an example prompt.
- `templates.md` contains prompt templates for common tasks (PR descriptions, commit messages, refactor requests).

Security

- Do not put API keys, passwords, or private tokens in this folder.
- If you need private config for automation, keep it in CI secrets or local config outside git.

Conventions

- Job IDs are `snake_case`.
- Actions are markdown files under `.ai/actions/` named `slug.md` and include a `Prompt` and `Example` section.
- Keep jobs small and composable.

Examples included:

- `jobs.yaml` — example job definitions
- `actions/generate-pr-description.md` — example action and prompt template
- `templates.md` — commit/PR and prompt templates

(You can edit these files to add project-specific jobs.)
