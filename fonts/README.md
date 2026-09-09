# Fonts

The site's body/navigation typeface is **Futura Condensed Medium**. It's a commercial
font, so it isn't bundled here.

How the site handles it (see the `@font-face` block at the top of `css/style.css`):

1. If the visitor's device has Futura installed (all Macs, iPhones and iPads do), the
   local copy is used automatically.
2. Otherwise the browser looks for `fonts/FuturaCondensedMedium.woff2` (and `.woff`).
   If you have a web-font licence, drop the files here with those exact names and
   everyone will get the real thing.
3. If neither is available it falls back to **Barlow Condensed** from Google Fonts,
   which is loaded on every page.

**Grindy Brush** (`GrindyBrush.otf`) is the hand-lettered brush face used for the
review quotes and eyebrows. The file here is the 1001fonts demo, which is licensed
for **personal use only** (see `GrindyBrush-LICENCE-NOTE.txt`). Before launch either:

- buy the commercial licence from https://sronstudio.com/product/grindy-brush-font/
  and replace the file with the licensed one, or
- delete the `@font-face "Grindy Brush"` block from `css/style.css`, in which case
  the site falls back to **Kalam Bold** (Google Fonts, free), the closest free match.

The remaining typefaces are free and loaded from Google Fonts:

- **Anton** — heavy condensed display face for headings (matches the logo's weight)
- **Barlow** — regular-width body copy
- **Barlow Condensed** — fallback for the condensed nav/labels
- **Kalam** — fallback for the brush face
