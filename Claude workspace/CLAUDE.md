# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is the **Solvr** monorepo. The active project is **Weblivo** — a web agency portfolio with three fictional demo client sites. All Weblivo files live in `weblivo/`. There is also an unrelated Flask app under `Vendera/`.

The `weblivo/` folder is mirrored to a separate deployment repo at `~/Documents/GitHub/botbyra-portfolio/`. **Every change to `weblivo/` must be copied to that repo and committed in both places.**

## Repository structure

```
Solvr/
├── weblivo/                  # Active project — Weblivo portfolio
│   ├── index.html          # Weblivo agency homepage (Space Mono, dark/orange)
│   ├── demo-frisor.html    # Lumina Frisørsalong demo site
│   ├── demo-gym.html       # APEX Treningssenter demo site
│   ├── demo-restaurant.html# Brasa Restaurant demo site
│   ├── booking-frisor.html # Booking form for Lumina (demo only)
│   ├── booking-gym.html    # Membership form for APEX (demo only)
│   ├── booking-restaurant.html # Reservation form for Brasa (demo only)
│   └── vercel.json         # Static deployment config for Vercel
├── Design/                 # Design system specs (YAML frontmatter + markdown)
│   ├── DESIGN frisør.md    # Lumina design system (pastel, DM Serif Display)
│   ├── DESIGN gym.md       # APEX design system (dark/yellow, Bebas Neue)
│   ├── DESIGN resturant.md # Brasa design system (warm dark, EB Garamond)
│   └── DESIGN hjemmeside.md# Weblivo homepage design system
├── Context files/          # Session notes (ignore for code tasks)
├── Vendera/                # Separate Flask app (unrelated to Weblivo)
├── serve.py / wsgi.py      # Flask entry points for Vendera
└── botbyra-portfolio/      # Snapshot of old portfolio (not the active deploy target)
```

## Two-repo workflow

All Weblivo changes must land in **both** repos:
1. `~/Documents/GitHub/Solvr/weblivo/` — source of truth
2. `~/Documents/GitHub/botbyra-portfolio/` — Vercel deployment repo (flat, no subdirectory)

After editing files in `weblivo/`, copy them:
```bash
cp Solvr/weblivo/<file>.html botbyra-portfolio/<file>.html
```

Then commit both repos (see Git section below).

## Git — persistent lock file workaround

`rm` on `.git/index.lock` and `.git/refs/heads/main.lock` fails (Operation not permitted). Use `mv` instead:
```bash
mv .git/refs/heads/main.lock .git/refs/heads/main.lock.bak
mv .git/index.lock .git/index.lock.bak
```

Normal `git commit` may also fail. Use the **low-level commit workflow**:

```bash
# 1. Hash changed files
BLOB=$(git hash-object -w path/to/file.html)

# 2. Build new tree (list ALL files in the directory, replacing changed blobs)
NEW_TREE=$(printf "100644 blob $BLOB\tfile.html\n..." | git mktree)

# 3. Create commit (always use kaushik7244@gmail.com — Vercel blocks other emails)
NEW_COMMIT=$(
  GIT_AUTHOR_NAME="Kaushik" GIT_AUTHOR_EMAIL="kaushik7244@gmail.com" \
  GIT_COMMITTER_NAME="Kaushik" GIT_COMMITTER_EMAIL="kaushik7244@gmail.com" \
  git commit-tree $NEW_TREE -p $(cat .git/refs/heads/main) -m "message"
)

# 4. Update branch ref directly
echo "$NEW_COMMIT" > .git/refs/heads/main

# 5. Sync index so GitHub Desktop shows no stale changes
git read-tree HEAD
```

**Solvr is a monorepo** — when building the root tree for Solvr commits, include ALL subdirectories (`Context files`, `Design`, `Server setup`, `Vendera`, `botbyra-portfolio`, `weblivo`) using their existing tree hashes, only replacing the `weblivo` subtree:
```bash
WEBLIVO_TREE=$(printf "..." | git mktree)  # build weblivo subtree first
ROOT=$(printf \
  "100644 blob $GI\t.gitignore\n\
040000 tree $CF\tContext files\n\
040000 tree $DS\tDesign\n\
040000 tree $SS\tServer setup\n\
040000 tree $VE\tVendera\n\
040000 tree $BP\tbotbyra-portfolio\n\
040000 tree $WEBLIVO_TREE\tweblivo\n\
100644 blob $SP\tserve.py\n\
100644 blob $WP\twsgi.py" | git mktree)
```

## Design systems

Each demo site has its own strict visual identity — always match the correct one:

| Site | File | Fonts | Key colors | Shape language |
|------|------|-------|------------|----------------|
| Lumina Frisørsalong | `demo-frisor.html` | DM Serif Display (italic headings), Plus Jakarta Sans | bg `#fff8f2`, primary `#7c5357`, primary-container `#e8b4b8` | Pill/ultra-rounded (`--r-full: 9999px`, `--r-lg: 2rem`) |
| APEX Treningssenter | `demo-gym.html` | Bebas Neue (headings), Inter | bg `#0a0a0a`, yellow `#f5d400` | Sharp/square (border-radius: 0) |
| Brasa Restaurant | `demo-restaurant.html` | EB Garamond (italic headings), Manrope | bg `#1a1208`, terra `#b85c38`, text `#f1e0ce` | Subtle radius (4px) |
| Weblivo homepage | `index.html` | Space Mono, Inter | bg `#131313`, orange `#ff5c00` | Sharp/pixel aesthetic |

Full design specs are in `Design/DESIGN <name>.md`.

## Demo bar (present on all 6 pages)

Every page has a sticky/fixed demo bar at the very top (`z-index: 9999`, height 44px). It contains:
- Left: pill button(s) linking back — `← Weblivo` on demo sites; `← Weblivo` + `← [Demo site]` on booking pages
- Right: `• Demo` badge

The bar color matches each site's accent color. CSS class: `.demo-bar-back` (pill style), `.demo-bar-badge`.

## Booking pages

All three booking pages (`booking-*.html`) are **demo only** — forms do not submit anywhere. They must:
- Show a prominent demo notice above the form ("Ingen informasjon blir lagret eller sendt")
- On submit: hide the form, show a success state that reiterates it's a demo
- Match their respective demo site's design system exactly

## Deployment

`botbyra-portfolio/` deploys automatically to Vercel on push to `main`. The Vercel project is connected to the `botbyra-portfolio` GitHub repo. Push via GitHub Desktop after committing.

Commit email **must** be `kaushik7244@gmail.com` — Vercel rejects deployments from other authors.

## Git in the Cowork sandbox (works — simpler than mktree)

In this environment normal git **does** work. `git add <paths>` + `git commit -- <paths>` succeeds even though it prints `unable to unlink ... Operation not permitted` warnings (non-fatal). The heavy `commit-tree`/`mktree` workflow above is only needed if normal commit truly fails. After committing, clear leftover locks so GitHub Desktop is happy:
```bash
for L in index.lock HEAD.lock next-index-*.lock objects/maintenance.lock refs/heads/*.lock; do
  [ -e .git/$L ] && mv .git/$L .git/$L.bak
done
```
Commit only the website files explicitly (e.g. `git commit -- weblivo/*.html`) so unrelated staged changes aren't swept in.

## Session handoff — last updated 2026-06-25

State at end of session (switching chats):
- **Rehumanized all 7 Weblivo pages' body copy** (36 text segments) to read more naturally, and **fixed the pixel cursor** in `index.html` (it was solid `#ff5c00`, invisible over the orange "Se demo" buttons — now an orange square with a 1px white border: `width='10' fill='%23ffffff'` wrapping the `8x8` orange).
- Committed in **both** repos, author `kaushik7244@gmail.com`:
  - Solvr (`Teodarian/Valora`): `566eae4`
  - botbyra-portfolio (`Kaushik7244/botbyra-portfolio`): `8b9e2c5`
- **NOT yet pushed** — user pushes both via GitHub Desktop (Vercel auto-deploys botbyra-portfolio).
- Also added `Solvr/OUTREACH-GUIDE.md` (sales/outreach playbook) and a Notion "Outreach" page under Solvr HQ.
- The deploy repo still has a pre-existing staged deletion of its own `CLAUDE.md` (left untouched).
