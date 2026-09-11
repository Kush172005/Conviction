# Conviction — agent context

This file is the **always-on map**. It exists so an agent can start work without grepping the repo or loading `LandingPage.tsx` / `index.css` into the prompt.

Token rule: **read the matching file below, then only the source file you will edit.** Do not dump whole pages into context.

## Product

Conviction is a VC deal-intelligence SPA. Core flow (do not change):

`landing → login / demo → onboarding (real users only) → dashboard → pipeline / calls / memory / research / settings`

Visual identity: **North Sea** — cool blue-slate surfaces, oxidized copper as a highlighter. Not purple-AI, not champagne-gold.

## Stack (frontend)

React 18 · TypeScript · Vite · Tailwind 3 · shadcn/ui (Radix) · Zustand · React Query · React Router 6

Motion: **GSAP 3 + ScrollTrigger + `@gsap/react`** for scroll/timelines/loops. **Framer Motion 11** for React presence and layout. CSS for 150–200ms hover. Do not add Lottie, anime.js, or react-spring.

## Read this, not the whole repo

| Task | Open |
|------|------|
| Visual work, tokens, theme, logo | [`.cursor/docs/design.md`](.cursor/docs/design.md) |
| GSAP, ScrollTrigger, Framer, which lib to use | [`.cursor/docs/libraries.md`](.cursor/docs/libraries.md) |
| Routes, stores, API, visual-only boundary | [`.cursor/docs/architecture.md`](.cursor/docs/architecture.md) |
| Call / Startup Intelligence pipelines (interview map) | [`docs/intelligence-flows.md`](docs/intelligence-flows.md) |
| Official docs URLs to `@Docs` | [`.cursor/docs/library-references.md`](.cursor/docs/library-references.md) |
| Landing / motion component behavior | [`.cursor/skills/conviction-motion/SKILL.md`](.cursor/skills/conviction-motion/SKILL.md) |

Canonical source files (edit these; do not reverse-engineer from memory):

| Concern | File |
|---------|------|
| CSS tokens | `src/index.css` (`:root` and `.dark` only, first ~110 lines) |
| Tailwind map | `tailwind.config.ts` |
| Routes | `src/App.tsx` |
| Theme + view-transition | `src/components/theme/ThemeProvider.tsx` |
| Landing motion | `src/pages/LandingPage.tsx` + `src/components/motion/*` |
| Testimonial ticker | `src/components/motion/Marquee.tsx` |
| App chrome | `src/components/layout/AppShell.tsx`, `Sidebar.tsx` |

## Hard constraints

- UI tasks are **visual-only**: classes, CSS, presentational markup, motion. Do not change routes, auth, API clients, form submit logic, or demo gating.
- Animate `transform` and `opacity` only.
- One motion idea per section. App shell: no magnetic buttons, tilt, or orbs.
- Honor `prefers-reduced-motion` except the testimonial marquee (continuous GSAP wrap; no pause-on-hover).
- Verify with `npm run typecheck`.

## How to start a task

1. Classify: visual · motion · feature · bug.
2. Read **one** doc from the table. Skip the others.
3. Open **one** canonical source file. Search inside it (`Grep`/`Read` with offset), do not load adjacent pages.
4. Implement the smallest diff.
5. Typecheck. Do not expand scope.
