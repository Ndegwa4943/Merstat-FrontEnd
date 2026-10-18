# AGENTS.md — Working agreements for AI agents and humans

## Architecture (single source of truth)

- **Layouts** — only `BaseLayout.astro` exists. New pages import it.
- **Components** — `<Nav />`, `<Footer />`, `<SEO />` are shared. Pages MUST
  use `<SEO />`; do not write raw `<meta>` tags in pages.
- **Styling** — only `tokens.css`, `fonts.css`, `base.css`, `utilities.css`.
  Component styles live in `<style>` blocks inside Astro components.
- **Content** — every page section that lists services / case studies / jobs /
  methods / trainings pulls from `src/content/*` collections. Never hardcode
  arrays of content in `.astro` files.
- **i18n** — use `useTranslations(getLangFromUrl(Astro.url))` for user-visible
  strings. Never hardcode strings in templates; add them to `src/i18n/ui.ts`.
- **JSON-LD** — builders live in `src/utils/jsonld.ts`. Add a new builder if
  the type isn't there; don't handwrite JSON-LD in pages.

## Conventions

- **File names**: kebab-case for content files (`dced-systems-mel.md`).
- **Routes**: trailing slash (`/services/`, `/services/dced-systems-mel/`).
- **Frontmatter**: every collection field is defined in `src/content.config.ts`.
  Build fails on schema mismatch.
- **Images**: AVIF first, WebP fallback, JPEG last. Always `width`/`height`.
  Use Astro's `<Image />` component for responsive `srcset`.
- **CSS**: prefer tokens (`var(--space-4)`, `var(--color-accent)`) over raw values.
- **Accessibility**: every interactive control needs a `min-height: 44px`,
  every `<img>` needs an `alt`, every form `<input>` needs a `<label>`.
- **Forms**: every form must have honeypot (`netlify-honeypot="bot-field"`)
  and a `form-name` hidden input matching the `name` attribute.
- **Links**: internal links use trailing-slash absolute paths (`/services/`,
  not `services.html`).

## Workflow for a content change

1. Edit the relevant `.md` file in `src/content/`.
2. `npm run dev` and check the change at `http://localhost:4321/`.
3. Run `npm run format:fix` and `npm run lint:fix`.
4. Commit. CI runs Lighthouse + pa11y.

## Workflow for a new page

1. Add the route under `src/pages/` (e.g. `src/pages/insights/index.astro`).
2. Add content collection if needed (`src/content.config.ts`).
3. Add translations to `src/i18n/ui.ts`.
4. Add nav link to `src/utils/site.ts` `NAV_LINKS`.
5. Add JSON-LD builder to `src/utils/jsonld.ts` if new type needed.
6. Update sitemap priority in `astro.config.mjs` if needed.

## Workflow for a new form

1. Create `src/components/forms/MyForm.astro`.
2. Use `<form name="…" method="POST" netlify-honeypot="bot-field">`.
3. Always include a hidden `<input type="hidden" name="form-name" value="…">`.
4. Add the Cloudflare Turnstile widget.
5. Add the success redirect URL: `action="/thanks?intent=myform"`.
6. Update `src/pages/thanks.astro` to show a relevant message for `intent=myform`.

## Forbidden

- ❌ Don't write raw HTML in pages when a component exists.
- ❌ Don't write `<style>` blocks outside of `.astro` files.
- ❌ Don't bypass content collections and hardcode content in pages.
- ❌ Don't add third-party scripts without updating the perf budget.
- ❌ Don't add new colours or font sizes — add a token first.
- ❌ Don't commit `dist/`, `.astro/`, `node_modules/`.

## Things to remember

- `<Form>` is `name="..."` (HTML attribute). Netlify uses this to detect the form.
- Pages without `<SEO />` will lack canonical, OG, and JSON-LD. Don't skip it.
- `<Hero />` takes `eyebrow`, `headline`, `lead`, and CTAs. Don't reinvent it.
- Sitemap and RSS auto-generate from content collections via the integrations.
