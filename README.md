# Merstat — Marketing Site

[![CI status](https://github.com/merstat/merstat-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/merstat/merstat-frontend/actions/workflows/ci.yml)

Marketing site for **Merstat Development Limited**, a Nairobi-based development
consulting firm. The site is built with [Astro 5](https://astro.build) and
deployed on [Netlify](https://www.netlify.com).

> Building programs. Measuring change. Sustaining impact.

## Stack

- **Astro 5** — content-driven static site with typed content collections (Zod).
- **Sveltia CMS** — git-backed headless CMS for non-technical editors at `/admin/`.
- **Netlify Forms** + **Cloudflare Turnstile** — serverless form pipeline with privacy-preserving spam protection.
- **Netlify Function** + **Cloudflare R2** — CV uploads bypass Netlify's 8 MB cap and keep PII out of Netlify's DB.
- **Plausible Analytics** — cookieless, GDPR-clean, ~1 KB script.
- **`web-vitals`** — real-user Core Web Vitals forwarded to Plausible custom events.
- **Pagefind** — static, build-time, multilingual search.
- **TypeScript** strict mode throughout.

## Quickstart

```bash
# Install
npm ci

# Dev server (http://localhost:4321)
npm run dev

# Build
npm run build

# Preview built site
npm run preview

# Type check
npm run check

# Lint and format
npm run lint
npm run format
```

## Architecture

```
src/
├── components/         # Shared Astro components
│   ├── forms/          # ContactForm, TrainingForm, CareerForm
│   ├── SEO.astro       # Single source of truth for <head>
│   ├── Nav.astro       # Hamburger nav with native <details> disclosure
│   ├── Footer.astro    # NAP, social, legal
│   ├── Hero.astro      # Page-top hero
│   └── ServiceCard.astro, CaseStudyCard.astro, JobCard.astro
├── content/            # Typed content collections (Markdown + frontmatter)
│   ├── services/       # 13 services
│   ├── case-studies/   # 4 anonymised case studies (Proofmap 6-block)
│   ├── methods/        # 10 methodologies
│   ├── trainings/      # 11 training tracks
│   ├── jobs/           # 6 open roles
│   ├── pages/          # Long-form Markdown bodies (home, about)
│   ├── posts/          # Insights blog (future)
│   └── team/           # Team bios (future)
├── content.config.ts   # Zod schemas for every collection
├── i18n/               # Translation dictionary (en, sw, fr)
├── layouts/            # BaseLayout (page wrapper)
├── pages/              # File-based routes
│   ├── index.astro
│   ├── about.astro
│   ├── services/       # index + [slug].astro (Knapsack 7-element template)
│   ├── results.astro
│   ├── trainings.astro
│   ├── careers.astro
│   ├── contact.astro
│   ├── thanks.astro
│   └── 404.astro
├── styles/             # Single source of CSS truth
│   ├── tokens.css      # Design tokens (--color-*, --space-*, --fs-*)
│   ├── fonts.css       # Self-hosted Inter variable font
│   ├── base.css        # Reset, typography baseline, focus ring, skip link
│   └── utilities.css   # .glass-card, .section, .grid, .btn, .badge, .prose
└── utils/              # site.ts (constants), jsonld.ts (structured data)

public/
├── images/             # Partner logos, hero, team.svg
├── fonts/inter-var.woff2
├── admin/              # Sveltia CMS mount
├── method-notes/       # Lead-magnet PDFs (upload when ready)
├── og/                 # Open Graph fallback SVGs
├── manifest.webmanifest
├── robots.txt
└── favicon.svg

netlify/
└── functions/r2-presign.mjs  # Presigned Cloudflare R2 PUT URLs

.github/workflows/
├── ci.yml              # lint, build, a11y, lighthouse
└── deploy.yml          # Production deploy to Netlify
```

## Editing content

There are three ways to edit content:

### 1. Sveltia CMS (recommended for non-developers)

Visit `https://merstat.org/admin/`. Log in with GitHub. Edit services,
case studies, methods, training tracks, jobs, posts, and team members in a
friendly UI. Changes commit to `main` and trigger a deploy.

### 2. Markdown in `src/content/`

Each content type is a folder under `src/content/`. Files have YAML
frontmatter validated by Zod schemas in `src/content.config.ts`. Build
will fail if frontmatter doesn't match.

```bash
# Add a new service
$EDITOR src/content/services/new-service.md

# Add a new job
$EDITOR src/content/jobs/new-role.md
```

### 3. Direct GitHub edits

Edit any `.md` file in `src/content/` via the GitHub web UI.

## Adding a new service page

1. Create `src/content/services/my-service.md`:

```md
---
title: 'My Service'
shortTitle: 'My Service'
tagline: 'A clear value-prop sentence'
summary: '1-2 sentences for cards'
description: 'Meta description (155 chars)'
icon: 'fa-leaf'
order: 50
heroOutcome: 'Outcome-led headline (Knapsack)'
empathy: '1-2 sentence problem framing'
outcomes:
  - 'Outcome bullet 1'
  - 'Outcome bullet 2'
process:
  - title: 'Step 1'
    body: 'What happens in step 1'
  - title: 'Step 2'
    body: 'What happens in step 2'
proof:
  - 'Trust bullet 1'
faqs:
  - question: 'Q?'
    answer: 'A.'
---

Body content goes here as Markdown.
```

2. Run `npm run dev` — the new page appears at `/services/my-service/`.

## Performance, accessibility, and SEO budgets

The repo enforces these budgets in CI (`lighthouserc.cjs`, `.pa11yci.json`):

- **LCP** ≤ 2.5 s, **INP** ≤ 200 ms, **CLS** ≤ 0.1 (p75, mobile)
- **Lighthouse Performance ≥ 90, A11y ≥ 95, Best Practices ≥ 90, SEO ≥ 90**
- **pa11y**: zero new WCAG 2.2 AA failures per PR
- **HTML** ≤ 30 KB / page, **CSS** ≤ 30 KB, **Fonts** ≤ 100 KB total
- **Third-party origins** ≤ 2 (Plausible + Cloudflare Turnstile when configured)

## Deployment

Three workflows drive the project:

| Workflow      | Triggers             | What it does                                                               |
| ------------- | -------------------- | -------------------------------------------------------------------------- |
| `ci.yml`      | every push, every PR | install, lint, build, smoke test, a11y, Lighthouse                         |
| `preview.yml` | every PR             | builds and deploys a Netlify preview, comments the URL on the PR           |
| `deploy.yml`  | push to `main`       | builds and deploys to Netlify production (protected by GitHub environment) |

### First-time setup

1. Connect the GitHub repo to Netlify at `https://app.netlify.com/start`.
2. Netlify will detect `netlify.toml` and configure the build automatically.
3. Add the secrets listed in [`docs/SECRETS.md`](./docs/SECRETS.md) to both
   GitHub (Actions secrets) and Netlify (environment variables).
4. Create the `production` GitHub environment with required reviewers.
5. Add `secrets.NETLIFY_AUTH_TOKEN` and `secrets.NETLIFY_SITE_ID`.

### Branch protection (recommended)

On `https://github.com/MUNENE1212/Merstat-FrontEnd/settings/branches`:

- Protect `main`.
- Require pull request before merging.
- Require approvals: 1.
- Require status checks to pass before merging:
  - `Lint & type check`
  - `Build`
  - `Accessibility (pa11y)`
  - `Lighthouse CI`
- Require linear history (squash or rebase).
- Do not allow force pushes.

## Forms

Three forms post to Netlify Forms with honeypot + Cloudflare Turnstile:

- **Service request** — `ContactForm.astro` on `/contact/`
- **Training booking** — `TrainingForm.astro` on `/trainings/`
- **Career application** — `CareerForm.astro` on `/careers/`

CV uploads go through a Netlify Function that issues a Cloudflare R2
presigned URL — keeping PII out of Netlify's database.

**Before deploy**, set the following env vars in Netlify:

- `PUBLIC_TURNSTILE_SITEKEY` — Cloudflare Turnstile site key (public)
- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile secret (for server-side validation)
- `PUBLIC_PLAUSIBLE_DOMAIN` — `merstat.org`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` — for CV uploads

## Localisation

Translation dictionary in `src/i18n/ui.ts`. Currently ships English.
Swahili and French dictionaries are stubbed — fill them in before launching
those locales. Astro i18n config in `astro.config.mjs`.

## Migration from legacy `/templates/`

The legacy static HTML is gone. `netlify.toml` still includes 301
redirects from the old paths (`/Bookus`, `/Aboutus`,
`/Results&Methods`) to the new canonical URLs — leave these in place
for one full year after launch, then audit Search Console for any
remaining inbound links and remove the redirects once 404 traffic is
zero.

See [`docs/ROLLBACK.md`](./docs/ROLLBACK.md) for the rollback procedure.

## License

© Merstat Development Limited. All rights reserved.
See [`LICENSE`](./LICENSE).
