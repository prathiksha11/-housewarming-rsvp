# A New Chapter Begins 🌺

A completely independent, animated Bengali Pattachitra-inspired housewarming invitation and RSVP website. The illustration is based on the home's actual appearance. No Higgsfield branding or account is required for visitors.

**Event:** Saturday, November 7, 2026, dinner beginning at 6:00 PM (Mountain Time).

**Venue:** 1295 W Giantsbane Dr, Meridian, ID 83642.

**Repository:** https://github.com/prathiksha11/-housewarming-rsvp

**Expected public invitation:** https://prathiksha11.github.io/-housewarming-rsvp/

> The repository name starts with a **hyphen**. Include that hyphen in its URL.

## Enable GitHub Pages once

1. Visit **Settings → Pages** inside this repository.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. The existing workflow at `.github/workflows/deploy.yml` publishes the website when it runs on `main`.
4. If deployment ran before Pages was enabled and failed, visit **Actions → Deploy Housewarming Invitation → Run workflow** and run it on `main`.

The first successful workflow run crops the approved Pattachitra invitation artwork to create the house painting, banana-leaf arch, border motifs, birds and footer. It saves the image assets into `assets/` in GitHub and includes them in the published Pages artifact. Later deployments are self-hosted and do not need the original artwork CDN.

The visible design and animations work immediately after publishing: floating folk-art petals, subtle house-illustration tilt, scroll reveals, a countdown, directions and a downloadable calendar event.

## RSVP collection and anonymous live count

The invitation supports the Cloudflare Worker at `https://housewarming-rsvp.prathiksha11.workers.dev` and its private D1 database. Only `GET /count` is public; it returns the sum of party sizes for accepted responses. The website does not request or display the response list, names, dietary details, or messages.

`config.js` selects the provider with `rsvpProvider`: `cloudflare` uses the protected Worker, while `formspree` retains the previous form service. The public Turnstile site key belongs in this file. The **secret key belongs only in the Worker's encrypted `TURNSTILE_SECRET` variable**, never in GitHub.

The Worker must validate the Turnstile token and hostname before writing an RSVP. It uses the D1 binding `housewarming-rsvp` and the existing `rsvps` table. Acceptances save the full party size; declines save zero. A retry of the same submission keeps its request ID so a network interruption does not insert a second row. A fresh submission or a different device is not deduplicated automatically; review duplicate household replies in the private D1 console.

Responses recorded previously in Formspree remain there and are **not included** in the D1 total until migrated. Do not publish exports or keys to move them. The owner can review responses in Cloudflare's D1 database console; no paid service is needed within the free tier's limits.

Before enabling the provider, open `?rsvp-preview=1#rsvp` on the published invitation to verify the widget and the backend. The preview exposes a connection-check button that submits only a synthetic invalid-token decline to confirm server rejection. It does not count as a real guest.

`node --test tests/rsvp.test.cjs` checks acceptance/decline payloads, verification gating, retry IDs, the anonymous truck count, and network failure handling. GitHub Actions runs these checks before deployment.

## Files

- `index.html`: invitation, event details and form.
- `styles.css`: ornate folk-art visual styling and responsive animations.
- `script.js`: petals, hover effects, countdown and calendar download.
- `rsvp.js`: attendance choices, validation, form submission and thank-you effect.
- `config.js`: date, location and optional form endpoint.
- `scripts/generate_assets.py`: one-time crop and image preservation script.
- `.github/workflows/deploy.yml`: GitHub Pages automated deployment.
- `assets/`: illustration images committed during the first successful deployment.

## Privacy

This is a public repository and published invitation. The full street address can be seen by anyone with the link. The `robots.txt` and `noindex` directives discourage search indexing but **do not restrict access**. Do not commit your guest list, keys, or private response exports.

This website is built with plain HTML, CSS and JavaScript, with no branding or website-builder subscription requirements.


## iPhone/mobile display fix (October 25, 2026)

The invitation has been updated to use solid ivory backgrounds rather than composited image blending and masks on Safari. Section text no longer starts invisible while waiting on scroll observers. Mobile type sizes and spacing were tightened, while small decorative animations remain. Styles are cache-busted: refresh the page if you opened the previous version.

## Friendly URL without an account username

GitHub Pages links are always `USERNAME.github.io/REPOSITORY/` unless you configure a custom domain. Renaming this repo to `prithvi` produces `prathiksha11.github.io/prithvi/`, but **does not remove the username**. For a name-only public URL, connect a separately owned domain to GitHub Pages or use a new GitHub account or organization with the preferred name. Do not change CNAME until DNS is ready.

