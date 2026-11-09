# engine

Compiles and runs untrusted C++ against a question's test cases. Runs on
arrakis, not on Workers.

```sh
pnpm --filter engine dev     # http://localhost:3000
```

| Route | Does |
|---|---|
| `GET /health` | liveness |
| `POST /run` | not implemented yet — returns 501 |

`isolate` does the sandboxing. We compile, then hand it the binary. The design
is `docs/arrakis/server-plan.md`; the decisions are D69–D74 in
`docs/arrakis/learning.md`.
