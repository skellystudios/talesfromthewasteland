# Tales From The Wasteland — website

Static site for the post-apocalyptic improvised comedy show. Plain HTML, CSS and a
few lines of JavaScript — no build step, no framework. Upload the folder to any
static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages, plain FTP) and it works.

## Run it locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

(Any static server works — opening `index.html` directly also works, but fonts from
Google may be blocked on `file://` in some browsers.)

## Structure

```
index.html            Home — hero, intro, next few shows, reviews, how it works
shows.html            All upcoming dates (tour-dates style list)
show.html             Listing page for one show — show.html?show=<slug>
about.html            About the Show
gallery.html          Gallery
newsletter.html       Newsletter sign-up form
work-with-us.html     Bookings / workshops / contact form
cast.html             Cast & Creatives
css/style.css         All styles (design tokens at the top)
js/main.js            Mobile nav, demo form handling, footer year, Meta Pixel
js/shows.js           SHOW DATES DATA + list / listing rendering
assets/               Logos, hero image, gallery images, favicon
fonts/                Drop licensed Futura Condensed Medium web-font files here
design/               The original mockup, kept for reference
```

## Things to replace before launch

The site is fully built, but a few pieces of content are placeholders because the
source material wasn't available:

| What | Where | Notes |
| --- | --- | --- |
| **Hero artwork** | `assets/hero-bg.jpg`, `assets/cast-group.{png,webp}`, `assets/cast-group-mobile.{png,webp}`, `assets/quote-*.png` | Layered in CSS: the supplied 1024×576 desert render is the section background (used untouched), the transparent cast cut-out sits over it as an `<img>` (`.hero__cast`, anchored bottom-right on desktop, centred over a cropped background block on mobile), and the two hand-lettered quotes are transparent PNGs. Cast files are straight downscales of the supplied `cast-group.png` (1400px and 760px wide; WebP first, PNG fallback). `hero.jpg` is the old flattened composite, kept only as the `og:image`. A ≥1920px-wide export of the background would look sharper on large screens. |
| **Tagline strip** | `assets/tagline.png` | Keyed from the supplied artwork. |
| **Gallery photos** | `assets/gallery/*.jpg` | Lee Pullen production stills from 8 May 2026, resized for the web. |
| **Cast bios** | `cast.html` | Names and photos (from the draft site, downscaled to 720×900 in `assets/cast/`) are in. Only Pete has a bio; add a `<p>` under each performer's role. |
| **Show dates** | `js/shows.js` | The three entries are **sample data** with `example.com` ticket links. Replace them with real dates (see "Show dates" below). |
| **Meta Pixel ID** | `js/main.js` → `META_PIXEL_ID` | Empty = no tracking loaded. |
| **Newsletter form** | `newsletter.html` | Set the `action` to your provider's endpoint (Mailchimp field names `EMAIL`/`FNAME` are already used) and remove `data-demo="true"`. |
| **Contact form / email** | `work-with-us.html` | Same as above (Formspree, Netlify Forms, etc.). Replace `hello@example.com`. |
| **Facebook link** | footer, every page | Currently a generic facebook.com link. |
| **Futura web font** | `fonts/` | See `fonts/README.md`. |

## Show dates

All dates live in one array at the top of `js/shows.js`; each field is documented
there. The home page shows the next four, `shows.html` shows them all, and
`show.html?show=<slug>` is the listing page for one show. Shows whose date has
passed disappear automatically; when nothing is upcoming the "announced on
Instagram first" notice is shown instead.

The listing page is designed to feel like the start of a ticket purchase so that
Meta ads can be pointed at `show.html?show=<slug>` and attributed:

- `PageView` fires on every page (once `META_PIXEL_ID` is set in `js/main.js`).
- `ViewContent` fires on the listing page, with the show slug and lowest price.
- `InitiateCheckout` fires when any **Book** button is clicked.
- Any `utm_*` / `fbclid` parameters on the page are appended to the venue's ticket
  URL so the click can be followed through on their side too.
- Each listing page also emits `TheaterEvent` structured data for Google.

`status` controls the button: `on-sale` / `selling-fast` show **Book now**,
`coming-soon` shows **Get notified** (→ newsletter), `sold-out` disables it.

## Logo files

- `assets/logo-yellow.png` — the original yellow watercolour logo with the black
  background keyed out (transparent PNG). Used in the desktop hero.
- `assets/logo-yellow-mobile.png` — stacked yellow watercolour lockup used in the
  mobile hero.
- `assets/logo-white-mobile.png` — white silhouette of the mobile lockup. Used in
  the nav and footer.
- `assets/logo-white.png` — flat white silhouette of the desktop lockup, with the
  distressing removed. Kept as a spare.

Both were generated from the supplied JPEG; if you have the original vector logo,
exporting from that will give crisper results at large sizes.

## Design tokens

Colours, fonts and the hero gradient live in `:root` at the top of `css/style.css`.
Section backgrounds use `.section--dark`, `.section--dark2`, `.section--sand` and
`.section--yellow`; headings use `.display` with `.h-xl / .h-lg / .h-md`.
