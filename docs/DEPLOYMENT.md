# Deploying merstat.org to Netlify

Two halves: **code** (done, in this repo) and **DNS** (you do this by hand in
two browser tabs). The code half is finished — this document is the checklist
for the DNS half.

---

## Part 1 — Code (already done in this repo)

| What | Status |
| --- | --- |
| Canonical domain switched to `https://merstat.org` | done |
| `astro.config.mjs` → `site:` | done |
| `src/utils/site.ts` → `SITE.url`, emails | done |
| `public/robots.txt`, `public/humans.txt` | done |
| `public/admin/config.js` (Sveltia CMS) | done |
| CI / deploy / preview workflows `SITE_URL` | done |
| `netlify.toml` placeholder env vars removed | done |
| Placeholder `R2_ENDPOINT` removed (would have broken the CV function) | done |

Verify locally before deploying:

```bash
npm run build
grep -o 'https://merstat\.org' dist/sitemap-0.xml | head
```

---

## Part 2 — Netlify: create the site and connect GitHub

1. Sign in at <https://app.netlify.com>.
2. **Add new site → Import an existing project** → pick
   `MUNENE1212/Merstat-FrontEnd` (**your** repo, not `Ndegwa4943/`).
3. Build settings — these are already in `netlify.toml`, so accept the
   defaults and just confirm:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: *(leave blank)*
4. Click **Deploy site**. You get a random URL like
   `https://brave-curie-12345.netlify.app`. It works immediately.
5. Open **Site settings → Domain management → Add a domain** and type
   `merstat.org`. Add `www.merstat.org` too (Netlify adds the www pairing
   itself — you do not need to add it separately).
6. Copy the **4 Netlify name servers** shown on that page. They look like:
   ```
   ns1-ns4.your-provider.net   (exact values shown in your Netlify UI)
   ```
   Paste them into the box in Part 3.

> **Do not** create DNS records for merstat.org at Shujaa yourself. Once you
> delegate to Netlify DNS, every record lives in Netlify. See Part 5.

---

## Part 3 — Shujaa client area: change the name servers

This is the step you said you didn't know. In the Shujaa client area:

1. Log in to your hosting/domain client area.
2. Go to **Domains** (sometimes **My Domains** or **Domain Portfolio**).
3. Click `merstat.org`, then **Manage / Manage Domain**.
4. Find **Nameservers** — it may be under a "DNS" tab or a "Nameserver"
   tab. Set it to **Custom nameservers** (not "Use Shujaa's defaults").
5. Paste the 4 nameservers from Netlify, one per box, and **Save**.

**Before you save: export your current records.** If you already have MX
records (a mail server), SPF, or DKIM at Shujaa, changing nameservers
deletes them and mail stops. Screenshot or note down every existing record
first. If Merstat has a mailbox on this domain, you need those MX records
recreated inside Netlify DNS in Part 5.

Propagating takes anywhere from 5 minutes to 24 hours (usually under an
hour). Nothing is broken while it propagates — the Netlify subdomain keeps
serving.

---

## Part 4 — Netlify: create the DNS records

Go back to **Netlify → your site → Domain management → DNS records**.

Netlify usually pre-creates the apex + www records. Confirm these exist:

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| A | `@` (apex) | *(Netlify's load balancer — auto-filled, leave it)* | 3600 |
| CNAME | `www` | `<your-site>.netlify.app` | 3600 |

Then click **Check DNS configuration**. It goes green when propagation
completes.

**Do not use these by hand** — for reference only, if you ever switch back
to Shujaa-hosted DNS, the apex A record is `75.2.60.5` and `www` is a CNAME
to `<your-site>.netlify.app`. Note that a single apex A record loses CDN
edge routing; that is exactly why delegating nameservers is better.

### Mail records (only if Merstat uses `@merstat.org` email)

Netlify DNS **does not host mail**. If you need `contact@merstat.org` to
receive mail, add MX/TXT records pointing at your mail provider —
Cloudflare Email Routing (free), Zoho, Google Workspace, or your host.
Until then the addresses in the site config are valid-looking but dead.

---

## Part 5 — Netlify: environment variables

**Site settings → Environment variables.** Set these in the UI, *not* in
`netlify.toml` (file-based values override the UI):

```
PUBLIC_TURNSTILE_SITEKEY    = <real key from Cloudflare Turnstile>
TURNSTILE_SECRET_KEY        = <real secret>
PUBLIC_PLAUSIBLE_DOMAIN     = merstat.org
R2_ACCOUNT_ID               = <Cloudflare account id>
R2_ACCESS_KEY_ID            = <R2 API token key>
R2_SECRET_ACCESS_KEY        = <R2 API token secret>
R2_BUCKET                   = merstat-uploads
R2_REGION                   = auto
R2_ENDPOINT                 = https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_BASE              = https://uploads.merstat.org
```

Turnstile keys come from <https://dash.cloudflare.com> → Turnstile → Add
site. Add both `merstat.org` and `www.merstat.org` as hostnames.

---

## Part 6 — GitHub Actions secrets (if you use the CI deploy path)

The repo has its own deploy workflow at `.github/workflows/deploy.yml`,
separate from Netlify's git integration. Pick **one**, or you'll get two
deploys racing:

- **Netlify git integration** (simplest) — do nothing, it already works.
  Then delete or disable `.github/workflows/deploy.yml` and `preview.yml`.
- **GitHub Actions** — set two secrets at
  <https://github.com/MUNENE1212/Merstat-FrontEnd/settings/secrets/actions>:
  - `NETLIFY_AUTH_TOKEN` — from
    <https://app.netlify.com/user/applications#personal-access-tokens>
  - `NETLIFY_SITE_ID` — Site settings → Site details → API ID

Full table: `docs/SECRETS.md`.

---

## Part 7 — Sveltia CMS (`/admin/`)

`public/admin/config.js` uses the **git-gateway** backend on branch `main`.
Enable it:

- Netlify → **Identity → Enable Identity**
- Netlify → **Identity → Services → Git Gateway → Enable**
- Netlify → **Identity → Registration → Invite yourself** (and each editor)

Visit `https://merstat.org/admin/` and log in. Editors then manage services,
case studies, jobs, trainings, methods, posts, and team through the UI —
each save is a commit and a rebuild.

---

## Part 8 — Verify

```bash
# DNS
dig +short merstat.org A
dig +short www.merstat.org

# Site + HTTPS
curl -sI https://merstat.org | head -1
curl -sI https://www.merstat.org | head -1
curl -s https://merstat.org/robots.txt

# Function
curl -s -X POST https://merstat.org/.netlify/functions/r2-presign \
  -H 'Content-Type: application/json' \
  -d '{"filename":"cv.pdf","contentType":"application/pdf"}' | head -c 200
```

Then in Netlify: **Site settings → HTTP → HTTPS** should show
"Automatically managed" with a green certificate, and **Site overview** should
show no pending domain verification.

### Pre-launch checklist

- [ ] Both apex and `www` load over HTTPS with a valid cert
- [ ] Contact form submits and lands on `/thanks?intent=contact`
- [ ] Careers form CV upload reaches R2 (no `R2 credentials missing`)
- [ ] `/admin/` loads and you can log in
- [ ] `https://merstat.org/sitemap-index.xml` lists `merstat.org` URLs
- [ ] Search Console: submit the sitemap at
      <https://search.google.com/search-console>

---

## Rollback

`docs/ROLLBACK.md`. To roll back DNS, set the name servers back to whatever
Shujaa had before Part 3 — which is why you recorded them.