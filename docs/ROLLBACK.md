# Rollback

If a deploy introduces a regression, you can roll back in three ways.

## 1. Netlify UI (fastest, ~30 s)

1. Netlify → Site → Deploys.
2. Find the last known-good deploy.
3. Click **Publish deploy**.

## 2. Git revert + push (slow, ~3 min)

```bash
git revert <bad-commit-sha>
git push origin main
```

The CI pipeline runs the full quality gate before deploying. If you need
to bypass CI, use option 1.

## 3. Lock to a known-good commit (last resort)

Netlify → Site settings → Build & deploy → Continuous deployment →
"Stop auto publishing" → manually publish a specific branch or commit.

## DNS rollback

If the domain stops resolving after the Netlify name-server cutover:

1. Shujaa client area → `merstat.org` → **Nameservers**.
2. Switch back to Shujaa's default nameservers (or the previous custom
   ones) and save.
3. Propagation is 5 minutes to 24 hours.

Record the pre-cutover name servers before changing them — see
`docs/DEPLOYMENT.md` Part 3.

## Hot fixes

For an emergency, ship the smallest possible change as a hotfix branch:

```bash
git checkout main
git pull
git checkout -b hotfix/<thing>
# edit
npm run format:fix
git commit -m "hotfix: <thing>"
git push -u origin hotfix/<thing>
# Open PR — keep scope minimal
# Merge with admin-merge or wait for CI
```
