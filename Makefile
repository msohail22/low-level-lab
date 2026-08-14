# Local gate before pushing — mirrors GitHub CI for web/api.
# Usage: make prepush

.PHONY: prepush check lint build db-push \
	reactor-format reactor-lint reactor-build reactor-test reactor-check \
	help

NODE ?= node
PNPM ?= pnpm

help:
	@echo "Targets:"
	@echo "  make prepush         Lint + build (same as CI) — run before push"
	@echo "  make lint            Web eslint + API typecheck"
	@echo "  make build           Web production build"
	@echo "  make reactor-check   Format check + build + tests (needs clang tools + cmake)"
	@echo "  make reactor-format  clang-format check (no write)"
	@echo "  make reactor-lint    clang-tidy on reactor sources"
	@echo "  make reactor-build   cmake configure + build"
	@echo "  make reactor-test    ctest"

prepush check: lint build
	@echo "OK — safe to push (CI lint-and-build path)"

lint:
	$(PNPM) lint

build:
	$(PNPM) build

db-push:
	$(PNPM) db:push

# --- reactor (C++) ---

REACTOR_SRC := $(shell find reactor/src reactor/tests -name '*.cpp' -o -name '*.h' -o -name '*.hpp' 2>/dev/null)

reactor-format:
	@command -v clang-format >/dev/null || { echo "Install clang-format (e.g. pacman -S clang)"; exit 1; }
	clang-format --dry-run --Werror $(REACTOR_SRC)

reactor-lint:
	@command -v clang-tidy >/dev/null || { echo "Install clang-tidy (e.g. pacman -S clang)"; exit 1; }
	@test -d reactor/build || $(MAKE) reactor-build
	clang-tidy -p reactor/build $(REACTOR_SRC) -- -std=c++20

reactor-build:
	cmake -B reactor/build -S reactor
	cmake --build reactor/build

reactor-test:
	ctest --test-dir reactor/build --output-on-failure

reactor-check: reactor-format reactor-build reactor-test
	@echo "OK — reactor format/build/tests passed"
