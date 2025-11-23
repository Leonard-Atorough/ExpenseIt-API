# Action: generate-pr-description

Purpose

- Produce a clear, structured Pull Request description derived from recent commits and a diff summary.

Inputs

- `commits`: list of commit messages (recent)
- `diff_summary`: short file-level summary of changes (added/modified/removed files)
- `owner` (optional): author name

Prompt template (for AI)

```
You are an assistant that writes high-quality Pull Request descriptions.
Inputs:
- Commits:
{{commits}}
- Diff summary:
{{diff_summary}}

Write a PR description that contains:
- Short summary (1-2 sentences)
- Motivation / why
- What changed (bulleted list)
- Testing performed
- Notes for reviewers (areas to focus on)
- Any breaking changes or migration steps

Return the description in Markdown.
```

Example usage

- The automation gathers recent commits and a diff summary and passes them to the prompt above.
- The returned markdown is used as the PR body.

Notes

- Keep the PR description concise but actionable.
- If commits contain TODOs or FIXMEs, list them under "Follow-ups".
