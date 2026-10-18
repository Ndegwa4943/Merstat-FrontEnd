# Repository secrets

This document lists the GitHub Actions secrets and variables required by
the workflows in `.github/workflows/`.

## Where to set them

`https://github.com/MUNENE1212/Merstat-FrontEnd/settings/secrets/actions`

## Required for `deploy.yml` and `preview.yml`

| Secret | What | Where to get it |
| --- | --- | --- |
| `NETLIFY_AUTH_TOKEN` | Personal access token for Netlify | `https://app.netlify.com/user/applications#personal-access-tokens` |
| `NETLIFY_SITE_ID` | The site's ID (UUID) | Netlify → Site settings → Site details → "API ID" |

The workflow reads the values from secrets at runtime. The token is
scoped to a single Netlify account; rotate every 90 days.

## Required in Netlify (for the runtime site)

These are **not** GitHub secrets — they live in the Netlify UI for the site:

`https://app.netlify.com/sites/<site>/settings/env`

| Variable | Required for | Description |
| --- | --- | --- |
| `PUBLIC_TURNSTILE_SITEKEY` | Forms | Cloudflare Turnstile public site key |
| `TURNSTILE_SECRET_KEY` | Forms (server-side validation) | Cloudflare Turnstile secret |
| `PUBLIC_PLAUSIBLE_DOMAIN` | Analytics | Plausible site domain (`merstat.org`) |
| `R2_ACCOUNT_ID` | CV upload function | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | CV upload function | R2 API token — Access Key |
| `R2_SECRET_ACCESS_KEY` | CV upload function | R2 API token — Secret Key |
| `R2_BUCKET` | CV upload function | R2 bucket name |
| `R2_REGION` | CV upload function | R2 region (`auto` recommended) |
| `R2_PUBLIC_BASE` | CV download | `https://uploads.merstat.org` (or your custom domain) |
| `SLACK_WEBHOOK_URL` | Form notifications (optional) | Slack incoming webhook |
| `DISCORD_WEBHOOK_URL` | Form notifications (optional) | Discord webhook |

## Optional for code review automation

| Secret | Used by | Description |
| --- | --- | --- |
| `CODECOV_TOKEN` | Optional Codecov upload | Codecov project token, only if you wire up Codecov |

## GitHub environment

The `deploy.yml` workflow targets the `production` GitHub environment.
Configure it at `https://github.com/MUNENE1212/Merstat-FrontEnd/settings/environments/new`
with name `production` and add `main` as a deployment branch.

Environment protection rules (recommended):
- Required reviewers: 1 from `@MUNENE1212`
- Wait timer: 0 minutes
- Deployment branches: `main` only

This ensures every production deploy needs an explicit human approval.
