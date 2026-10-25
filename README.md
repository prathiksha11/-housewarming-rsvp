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

## Turn on real RSVP collection

GitHub Pages has no database or form storage. Until a working Formspree form is configured, the button deliberately says **RSVP opens soon**, so guests are not given a false submission confirmation.

1. Create a Formspree form (https://formspree.io) named **Housewarming RSVP**.
2. Copy its public endpoint, for example `https://formspree.io/f/abcdefgh`.
3. Edit `config.js` in this repository:
   ```js
   formEndpoint: "https://formspree.io/f/YOUR_FORM_ID",
   ```
4. Commit that change. The GitHub Actions workflow automatically republishes the invitation.
5. Submit a test RSVP and confirm it appears in your Formspree inbox.

The RSVP collects a name, optional email, attending/declining, party size, companion names, dietary preferences and optional notes. It shows a success message only after a successful response from the form service.

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
