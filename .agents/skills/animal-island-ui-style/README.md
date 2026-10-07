# animal-island-ui-style skill

An installable skill that teaches AI coding agents (Claude Code, Codex, Cursor, and other
SKILL.md-compatible agents) to build UIs in the style of
[animal-island-ui](https://github.com/guokaigdg/animal-island-ui) — a React component
library inspired by Animal Crossing: New Horizons.

It covers two scenarios, each with its own entry:

- **React project** — using the `animal-island-ui` npm package: setup, API exploration via
  the package's TypeScript declarations, recipes, theming with `--animal-*` tokens.
- **Standalone HTML** — generating a single self-contained `index.html` (React via CDN +
  Babel runtime) that hand-rolls the components while mirroring the real API.

## Install

With the [skills](https://github.com/vercel-labs/skills) CLI:

```bash
skills add guokaigdg/animal-island-ui
```

Or manually: copy this `animal-island-ui-style/` directory into your agent's skills
location (for Claude Code: `~/.claude/skills/` or `<project>/.claude/skills/`).

## Layout

```
animal-island-ui-style/
├── SKILL.md                     # entry: style summary, tokens, scenario routing, hard rules
├── SKILL.zh-CN.md               # Chinese translation, for human review only (agents read SKILL.md)
└── references/
    ├── react-project.md         # scenario: React project with the npm package
    ├── standalone-html.md       # scenario: single-file HTML, no build step
    └── components/              # props references by category (9 files; 38 components in 2.1)
```

Icon art is not part of this library: v2 dropped `Icon` / `ICON_LIST` and depends on the
MIT-licensed [`naive-icons`](https://github.com/guokaigdg/naive-icons) package instead (159
named `<XIcon />` exports). `Phone`, `Wallet`, `FooterType` (`Footer type="sea"`), `TimeType`
and `Progress.infoPosition` were removed in the same release; the reference files document
the replacements.

Exact design values (every hex/px/keyframe) are deliberately not duplicated into the
skill — it links to the canonical
[design system](https://github.com/guokaigdg/animal-island-ui/tree/main/docs/design-system)
in the repository.

## License

`animal-island-ui` is **MIT licensed since 2.0** — see the
[repository LICENSE](https://github.com/guokaigdg/animal-island-ui/blob/main/LICENSE).

The **v1.x releases were CC BY-NC 4.0 (non-commercial only)**, as were their icon and
footer artwork. Nothing from v1.x may be copied into a commercial project; use
`naive-icons` (MIT) or your own art instead. For the license of the skill text and the
docs in this repository, check the upstream repository LICENSE.
