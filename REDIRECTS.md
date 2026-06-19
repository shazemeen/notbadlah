# Redirects & DNS — old subdomains into the unified site

The unification merges three properties into one Cloudflare Pages project served
from `notbadlah.com`. The two old subdomains must 301 into the new subfolders so
their SEO and any shared links are preserved.

| From (old) | To (new) | Status |
|---|---|---|
| `nextgenmillionaire.notbadlah.com/*` | `https://notbadlah.com/full-time` | 301 |
| `nextgenmillionaire-plus.notbadlah.com/*` | `https://notbadlah.com/full-time/plus` | 301 |

## Why these aren't in `public/_redirects`

Cloudflare Pages `_redirects` matches on **path only**, never on hostname. A
request to a *different subdomain* is a different DNS hostname and never reaches
this project's `_redirects`. So the subdomain redirects must be done at the
**zone level** in the Cloudflare dashboard. (Friendly same-host path aliases like
`/get-covered → /insure` ARE handled in `public/_redirects`.)

## Manual steps (Cloudflare dashboard — I cannot do these for you)

These touch DNS + account-level config, so apply them yourself:

1. **DNS** — ensure each old subdomain resolves through Cloudflare (orange-cloud
   proxied). If they currently point at the old Pages projects, keep a proxied
   record so a Redirect Rule can act on the request.
2. **Redirect Rules** (Rules → Redirect Rules) on the `notbadlah.com` zone — add
   two dynamic rules:
   - When hostname equals `nextgenmillionaire.notbadlah.com`
     → 301 to `concat("https://notbadlah.com/full-time")`  (preserve nothing / send to section root)
   - When hostname equals `nextgenmillionaire-plus.notbadlah.com`
     → 301 to `https://notbadlah.com/full-time/plus`
   (Bulk Redirects is an equivalent alternative if you prefer a static list.)
3. **Custom domains / project cleanup** — once the redirects are verified, the
   old standalone Pages projects for NGM / NGM+ can be retired. Don't delete them
   until the redirects are confirmed live, so rollback stays easy.
4. **Old NGM leads (separate D1)** — the old full-time site used its own D1
   (`NGM_DB`) in its own project. Those historical leads are NOT migrated by this
   repo. If you want them in the unified `notbadlah-db`, export from the old D1
   and import — a one-time manual step.
