# AI prompt & template collection

This file contains small templates you can reuse when asking the AI to help with common tasks.

## Commit message template

- Header (type): `feat|fix|chore|docs|test|refactor: short summary`
- Body (optional): longer description, motivation, and what was changed
- Footer (optional): `BREAKING CHANGES: ...` or `Refs: #issue`

Example:

```
feat: add JWT refresh token rotation

Add refresh token rotation to the auth flow. Store hashed refresh tokens in the DB and rotate on use.

BREAKING CHANGES: refresh token table schema changed
```

## PR description template

Use the `generate-pr-description` action in `.ai/actions` or the following structure:

- Title: concise summary
- Summary: 1–2 sentences
- Motivation
- Changes (bullet list)
- Tests (how to run, what passed)
- Notes for reviewers
- Rollout / Migration

## AI prompt snippets

- "Suggest a minimal, low-risk refactor for these files. Prioritize readability and tests. Return a single patch file in unified diff format."
- "Find potential security issues in the attached auth flow and list remediation steps prioritized by severity."

## How to add new templates

- Create a new file in `.ai/actions/` with a clear name and a prompt template section.
- Reference actions from `jobs.yaml` by path (e.g. `actions/generate-pr-description.md`).
