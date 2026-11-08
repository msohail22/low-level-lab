## What this changes

<!-- One or two lines. -->

## Checklist

Everything here is checked automatically by the `validate` workflow. The list is
so you can see what will fail before CI tells you.

- [ ] `pnpm validate` passes — frontmatter, required headings, required blocks
- [ ] `pnpm build:tests` passes — every test case parses, none are duplicates
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] `pnpm build` passes

### Adding a question

- [ ] The file is `content/<topic>/<slug>.mdx` and the filename matches `slug`
- [ ] `kind` is one of `coding`, `predict-output`, `debug`, `mcq`, `multi`, `true-false`
- [ ] `## Description` is clear and concise, and the title does not repeat the kind
- [ ] `coding` only: `## Input`, `## Output`, `## Test cases`, and a
      `<slug>.tests.jsonl` beside the question
- [ ] `predict-output` only: an `expected` block with the exact output
- [ ] `<Answer>` is the last thing in the file
- [ ] No generated files committed — `public/tests/` is built by CI
