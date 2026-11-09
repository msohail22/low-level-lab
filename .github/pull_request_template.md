## What this changes

<!-- One or two lines. -->

## ✅ Checks

**CI is switched off right now, so these are not run for you.** Run them and
tick them. An unchecked pull request will be sent back.

```sh
pnpm validate && pnpm build:tests && pnpm typecheck && pnpm build
```

- [ ] `pnpm validate` — frontmatter, required headings, required blocks
- [ ] `pnpm build:tests` — every test case parses, none duplicated
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] Branch is up to date with `master` — CI fails if `master` moved, so that a
      duplicate introduced by another PR is caught against the combination

### 📝 Adding a question

- [ ] File is `apps/web/content/<topic>/<slug>.mdx` and the filename matches `slug`
- [ ] No existing question in that topic asks this already, under any slug or wording
- [ ] `kind` is one of `coding`, `mcq`, `multi`, `true-false`
- [ ] `## Description` is clear, and the title does not repeat the kind
- [ ] `coding` only: `## Input`, `## Output`, `## Test cases`, and a
      `<slug>.tests.jsonl` beside the question
- [ ] Every other kind: `choices` in frontmatter and a bare `<Choices />` in the body
- [ ] `<Answer>` is the last thing in the file
- [ ] No generated files committed — `apps/web/public/tests/` is built by CI
