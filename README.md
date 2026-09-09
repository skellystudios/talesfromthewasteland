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
poster.html           Internal tool: print-ready show poster generator (see below)
css/style.css         All styles (design tokens at the top)
css/poster.css        Styles for the poster generator only
js/main.js            Mobile nav, demo form handling, footer year, Meta Pixel
js/shows.js           SHOW DATES DATA + list / listing rendering
js/poster.js          Poster generator (canvas rendering, TinyURL, QR, PNG/PDF export)
assets/               Logos, hero image, gallery images, favicon
assets/poster/        Flattened poster artwork per cast line-up + templates.json
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

## Poster generator

`poster.html` builds a print-ready show poster from the Photoshop template without
opening Photoshop. It is not linked from the navigation and is marked `noindex`;
just open the URL directly. Everything runs in the browser — there is no server.

1. **Cast line-up** — pick which version of the artwork to use.
2. **Bottom lines** — type the two lines (date • time • price / venue • website).
   The preview re-draws as you type so you can juggle the wording for balance.
   Use *Insert •* for the separator, *Swap lines*, and the size / nudge sliders.
   If a line is too wide it is shrunk automatically and a hint appears.
3. **Venue logo** — upload a PNG (ideally transparent), SVG or JPG. By default it
   is rendered white, keeping the file's transparency. For a dark logo on a white
   background choose *White (from dark logo on light background)*. Scale and
   nudge it with the sliders.
4. **Link** — paste the ticket URL and click *Shorten with TinyURL*
   (falls back to is.gd). The short link is what the QR code encodes, so it stays
   easy to scan when printed. Tick *Use the full URL instead* to skip shortening.
5. **Export** — *Download PDF* or *Download PNG*.

Output is 4267 × 6033 px, identical to the Photoshop documents (361 × 511 mm at
300 dpi; scales cleanly to A3). The PDF page is 1024.08 × 1447.92 pt, the same as
the original exports, and the QR code is drawn as vectors on top of the raster.
Your work in progress is kept in the browser's local storage.

**Fonts.** The bottom lines use *Futura Condensed Medium*, which is built into
macOS/iOS. On a Mac the browser uses the system copy and the output matches the
template. On other machines the page warns you and falls back to Barlow Condensed
(from Google Fonts) — either use a Mac for the final export, or add a licensed
`fonts/FuturaCondensedMedium.woff2` (see `fonts/README.md`). Text is rasterised
into the export at 300 dpi, so no font file is embedded in the PDF.

**Adding a cast line-up.** In Photoshop, open the poster PSD, hide the bottom text
layer, the venue logo layer(s) and the QR code layer(s), and export the whole
document as a JPEG at full size (4267 × 6033). Then:

```
assets/poster/template-<id>.jpg           full size, used for export
assets/poster/template-<id>-preview.jpg   1000px wide, used for the live preview
assets/poster/template-<id>-thumb.jpg     200px wide, shown in the picker
```

and add an entry to `assets/poster/templates.json`:

```json
{ "id": "<id>", "label": "Shown under the thumbnail",
  "full": "assets/poster/template-<id>.jpg",
  "preview": "assets/poster/template-<id>-preview.jpg",
  "thumb": "assets/poster/template-<id>-thumb.jpg" }
```

The positions of the text, logo and QR panel are constants at the top of
`js/poster.js` (`LAYOUT`, in template pixels) and are shared by every line-up.

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
