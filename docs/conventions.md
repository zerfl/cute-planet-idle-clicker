# Conventions: commits, code style, testing

## Commits

- **Conventional Commits** with a domain scope where it helps:
  `feat`, `fix`, `chore`, `refactor`, `perf`, `style`, `test`, `docs`.
  Observed scopes include `roguelite`, `gehege`, `glitch-galaxy`, `voyage`, `sync`,
  `worker`, `persistence`, `stats`. Examples:
  - `feat(roguelite): compact run UI and add visual smoke coverage`
  - `fix: stop a late cloud load from wiping freshly-placed enclosure animals`
  - `perf(stats): use a Set for upgrade lookups in the hot-path calculator`
- A playful tone occasionally appears, but the subject should still say what changed.
- **No Claude / Claude Code / AI-assistant branding** in commit messages, PR text, or
  files. No "Generated with…" / "Co-Authored-By" assistant trailers.

## Code style

Style is enforced by tooling — run `npm run lint:fix` and `npm run format`; don't
hand-tune what the formatter owns.

- **Prettier** (`.prettierrc.json`): double quotes, semicolons, trailing commas, 100-col
  print width, 2-space indent, always-parenthesised arrow params. Markdown is excluded
  from Prettier (`*.md` in `.prettierignore`), so format these docs by hand.
- **ESLint** (`eslint.config.js`, flat config): correctness rules (e.g. rules-of-hooks)
  are **errors**; many stylistic rules are **warnings** because the config was retrofitted
  to a large codebase. Don't introduce new errors; clearing nearby warnings is welcome but
  optional. `.agents/**` and config files are ignored.
- **TypeScript** strict; path alias `@/*` maps to the project root.
- **Comments sparingly** — only where intent isn't obvious from the code.
- In hot paths, prefer `Set`/`Map` lookups and hoisted constants over per-call work (see
  `statsCalculator`).

## Testing

- Tests are **colocated** with the code they cover (`*.test.ts` next to the source).
- Unit tests run under **Vitest** with a jsdom environment; globals are enabled. Pure game
  logic (engine, stats, crafting, offline, worker reducers) is unit-tested; React hooks use
  `@testing-library/react`.
- `statsCalculator` uses **characterization tests** (inline snapshots) so performance
  refactors stay behaviour-identical — keep them green.
- End-to-end **Playwright** smoke tests live in `e2e/` (`npm run test:e2e`) and exercise
  worker boot, a click round-trip, autosave, and reload rehydration.

## The gate

A Husky pre-commit hook runs `lint-staged` (ESLint + Prettier on staged files). Before you
consider a change done, run:

```bash
npm run check   # typecheck + lint + format:check + test
```

This mirrors CI (`.github/workflows/ci.yml`), which also runs the build and the e2e job.

### Auto-fix before you commit

After a large changeset — and any time before committing — run the auto-fixers over the
whole repo (the pre-commit hook only touches *staged* files):

```bash
npm run lint:fix && npm run format
```

What that fixes for you vs. what needs a human:

- **Auto-fixed** — unused imports (`unused-imports/no-unused-imports`), Tailwind canonical
  classes (`better-tailwindcss/enforce-canonical-classes`, e.g. `bg-gradient-to-b` →
  `bg-linear-to-b`, `z-[60]` → `z-60`), and all Prettier formatting. Editor-on-save does the
  same if you use the recommended VS Code extensions (`.vscode/`).
- **Judgement calls** — don't blanket-accept these:
  - `react-hooks/exhaustive-deps`: decide case by case per
    `.agents/skills/vercel-react-best-practices/` (start with `rules/rerender-dependencies.md`);
    a wrong "fix" can change behaviour.
  - Unused **locals** (not imports): delete if dead, otherwise prefix with `_`.
  - `@typescript-eslint/no-explicit-any`: the codebase is moving to **no `any`** — don't add
    new ones; replace them with real types.
