/* =====================================================================
   POSTER GENERATOR  (poster.html)
   ---------------------------------------------------------------------
   Everything runs in the browser:
     - the fixed artwork (sky, title, quotes, cast) is a flattened JPEG per
       cast line-up in assets/poster/ (exported from the Photoshop files
       with the text, venue logo and QR layers hidden);
     - the two bottom lines, the venue logo and the QR code are drawn on
       top with <canvas> at whatever scale is needed (1000px preview, or
       the full 4267x6033 document for export);
     - links are shortened with TinyURL (is.gd as a fallback) and turned
       into a QR code with qrcode-generator;
     - the PDF is assembled with pdf-lib at the template's page size.

   Coordinates below are in template pixels (4267 wide x 6033 tall) and
   were measured from the "folk house" PSD. See assets/poster/templates.json
   for the list of cast line-ups.
   ===================================================================== */

(function () {
  'use strict';

  var DOC = { w: 4267, h: 6033 };
  var PDF_PAGE = { w: 1024.08, h: 1447.92 }; // points, as in the original PDFs

  var LAYOUT = {
    text: {
      cx: 2229,          // measured centre of both lines (midway between logo and QR panel)
      cy: 5714,          // vertical centre of the two-line block (caps 5593–5686 and 5740–5833)
      fontSize: 122.3,   // 29pt x 4.217 layer transform
      lineHeight: 147,   // auto leading 1.2
      tracking: -0.01,   // -10/1000 em
      capHeight: 0.75,   // rendered cap height incl. overshoot (94px / 122px)
      maxWidth: 2960     // clear space between logo and QR panel
    },
    qr: { x: 3780, y: 5562, size: 309, radius: 26, pad: 24 },
    logo: { x: 209, cy: 5714, maxW: 800, maxH: 312 } // original logo box: x 209–673, y 5557–5868
  };

  var FONT_FAMILY = '"Futura Condensed Medium", "Futura-CondensedMedium", "Barlow Condensed", "Arial Narrow", sans-serif';
  var STORAGE_KEY = 'wl-poster-v1';

  var $ = function (id) { return document.getElementById(id); };

  var els = {
    form: $('poster-form'),
    versions: $('version-list'),
    line1: $('line1'), line2: $('line2'),
    insertBullet: $('insert-bullet'), swapLines: $('swap-lines'), allCaps: $('all-caps'),
    textScale: $('text-scale'), textScaleOut: $('text-scale-out'),
    textDy: $('text-dy'), textDyOut: $('text-dy-out'),
    fitHint: $('fit-hint'),
    logoFile: $('logo-file'), logoMode: $('logo-mode'), logoClear: $('logo-clear'),
    logoScale: $('logo-scale'), logoScaleOut: $('logo-scale-out'),
    logoDx: $('logo-dx'), logoDxOut: $('logo-dx-out'),
    logoDy: $('logo-dy'), logoDyOut: $('logo-dy-out'),
    url: $('link-url'), shorten: $('shorten'), useFull: $('use-full'),
    shortStatus: $('short-status'), qrEncodes: $('qr-encodes'),
    qrScale: $('qr-scale'), qrScaleOut: $('qr-scale-out'),
    qrDx: $('qr-dx'), qrDxOut: $('qr-dx-out'),
    qrDy: $('qr-dy'), qrDyOut: $('qr-dy-out'),
    fileName: $('file-name'),
    downloadPdf: $('download-pdf'), downloadPng: $('download-png'),
    exportStatus: $('export-status'), resetAll: $('reset-all'),
    preview: $('preview'), previewLoading: $('preview-loading'),
    fontWarning: $('font-warning')
  };

  if (!els.form) return;

  /* ---------------- State ---------------- */

  var defaults = {
    version: null,
    line1: '', line2: '',
    allCaps: true, textScale: 100, textDy: 0,
    logoData: null, logoMode: 'white-alpha', logoScale: 100, logoDx: 0, logoDy: 0,
    url: '', shortUrl: '', useFull: false,
    qrScale: 100, qrDx: 0, qrDy: 0,
    fileName: ''
  };
  var state = Object.assign({}, defaults);

  function loadState() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') Object.assign(state, saved);
    } catch (e) { /* ignore */ }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Probably the logo pushed us over the quota — save everything else.
      try {
        var copy = Object.assign({}, state, { logoData: null });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
      } catch (e2) { /* give up quietly */ }
    }
  }

  /* ---------------- Assets ---------------- */

  var templates = [];        // from templates.json
  var imageCache = {};       // url -> Promise<HTMLImageElement>
  var logoImage = null;      // HTMLImageElement of the uploaded logo
  var logoProcessed = null;  // { mode, canvas } — recoloured version
  var qrModel = null;        // qrcode-generator instance
  var qrText = '';
  var fontReady = null;      // Promise

  function loadImage(src) {
    if (!imageCache[src]) {
      imageCache[src] = new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { delete imageCache[src]; reject(new Error('Could not load ' + src)); };
        img.src = src;
      });
    }
    return imageCache[src];
  }

  function currentTemplate() {
    for (var i = 0; i < templates.length; i++) {
      if (templates[i].id === state.version) return templates[i];
    }
    return templates[0] || null;
  }

  function ensureFont() {
    if (fontReady) return fontReady;
    if (!document.fonts || !document.fonts.load) {
      fontReady = Promise.resolve(false);
      return fontReady;
    }
    fontReady = document.fonts.load('600 40px "Futura Condensed Medium"').then(function () {
      var ok = false;
      document.fonts.forEach(function (face) {
        if (/Futura Condensed Medium/i.test(face.family) && face.status === 'loaded') ok = true;
      });
      if (!ok && document.fonts.check) ok = document.fonts.check('40px "Futura Condensed Medium"');
      return ok;
    }).catch(function () { return false; });
    return fontReady;
  }

  /* ---------------- Drawing ---------------- */

  function displayText(s) {
    s = (s || '').replace(/\s+/g, ' ').trim();
    return state.allCaps ? s.toUpperCase() : s;
  }

  // Draws one line of text centred at (cx, baseline), shrinking it if it is
  // wider than maxWidth. Returns true if it had to shrink.
  function drawLine(ctx, text, cx, baseline, fontPx, maxWidth) {
    if (!text) return false;
    var shrunk = false;
    var size = fontPx;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    for (var attempt = 0; attempt < 40; attempt++) {
      ctx.font = '500 ' + size + 'px ' + FONT_FAMILY;
      if ('letterSpacing' in ctx) ctx.letterSpacing = (LAYOUT.text.tracking * size) + 'px';
      var w = ctx.measureText(text).width;
      if (w <= maxWidth || size < fontPx * 0.4) break;
      size = size * Math.min(0.97, maxWidth / w);
      shrunk = true;
    }
    ctx.fillText(text, cx, baseline);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    return shrunk;
  }

  function drawText(ctx, s) {
    var T = LAYOUT.text;
    var k = state.textScale / 100;
    var fontPx = T.fontSize * k * s;
    var lineH = T.lineHeight * k * s;
    var capH = T.capHeight * fontPx;
    var cy = (T.cy + state.textDy) * s;
    var cx = T.cx * s;
    // Keep the text clear of the QR panel if it has been enlarged or moved left.
    var maxW = Math.min(T.maxWidth, 2 * (qrPanel().x - 60 - T.cx)) * s;

    var l1 = displayText(state.line1);
    var l2 = displayText(state.line2);
    var shrunk = false;

    if (l1 && l2) {
      var blockH = lineH + capH;
      var top = cy - blockH / 2;
      shrunk = drawLine(ctx, l1, cx, top + capH, fontPx, maxW) || shrunk;
      shrunk = drawLine(ctx, l2, cx, top + capH + lineH, fontPx, maxW) || shrunk;
    } else if (l1 || l2) {
      shrunk = drawLine(ctx, l1 || l2, cx, cy + capH / 2, fontPx, maxW);
    }
    return shrunk;
  }

  // Recolours the uploaded logo according to state.logoMode and caches it.
  function processedLogo() {
    if (!logoImage) return null;
    if (logoProcessed && logoProcessed.mode === state.logoMode && logoProcessed.src === logoImage.src) {
      return logoProcessed.canvas;
    }
    var w = logoImage.naturalWidth || logoImage.width;
    var h = logoImage.naturalHeight || logoImage.height;
    // SVGs report their intrinsic size; make sure we rasterise them large enough for print.
    var scale = Math.max(1, Math.min(4, 1400 / Math.max(w, h)));
    var c = document.createElement('canvas');
    c.width = Math.round(w * scale);
    c.height = Math.round(h * scale);
    var ctx = c.getContext('2d');
    ctx.drawImage(logoImage, 0, 0, c.width, c.height);

    if (state.logoMode === 'white-alpha') {
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.globalCompositeOperation = 'source-over';
    } else if (state.logoMode === 'white-luma') {
      var data = ctx.getImageData(0, 0, c.width, c.height);
      var px = data.data;
      for (var i = 0; i < px.length; i += 4) {
        var lum = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
        var a = px[i + 3] / 255;
        px[i] = 255; px[i + 1] = 255; px[i + 2] = 255;
        px[i + 3] = Math.round((1 - lum) * a * 255);
      }
      ctx.putImageData(data, 0, 0);
    }
    logoProcessed = { mode: state.logoMode, src: logoImage.src, canvas: c };
    return c;
  }

  function drawLogo(ctx, s) {
    var logo = processedLogo();
    if (!logo) return;
    var L = LAYOUT.logo;
    var k = state.logoScale / 100;
    var maxW = L.maxW * k, maxH = L.maxH * k;
    var r = Math.min(maxW / logo.width, maxH / logo.height);
    var w = logo.width * r, h = logo.height * r;
    var x = L.x + state.logoDx;
    var y = L.cy + state.logoDy - h / 2;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(logo, x * s, y * s, w * s, h * s);
  }

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // The white panel in template px after the user's size / nudge adjustments.
  // Scaling is anchored to the panel's right edge and vertical centre so a
  // bigger code grows into the poster rather than off the edge.
  function qrPanel() {
    var Q = LAYOUT.qr;
    var k = state.qrScale / 100;
    var size = Q.size * k;
    var right = Q.x + Q.size + state.qrDx;
    var cy = Q.y + Q.size / 2 + state.qrDy;
    return { x: right - size, y: cy - size / 2, size: size, radius: Q.radius * k, pad: Q.pad * k };
  }

  // Returns the QR geometry in template px so the PDF can draw it as vectors too.
  function qrGeometry() {
    if (!qrModel) return null;
    var Q = qrPanel();
    var n = qrModel.getModuleCount();
    var inner = Q.size - Q.pad * 2;
    var cell = inner / n;
    return { n: n, cell: cell, x0: Q.x + Q.pad, y0: Q.y + Q.pad, panel: Q };
  }

  function drawQr(ctx, s) {
    var g = qrGeometry();
    if (!g) return;
    var Q = g.panel;
    ctx.fillStyle = '#ffffff';
    roundedRect(ctx, Q.x * s, Q.y * s, Q.size * s, Q.size * s, Q.radius * s);
    ctx.fill();
    ctx.fillStyle = '#000000';
    for (var r = 0; r < g.n; r++) {
      for (var c = 0; c < g.n; c++) {
        if (!qrModel.isDark(r, c)) continue;
        // Snap module edges to whole pixels so neighbouring squares never show seams.
        var x = Math.round((g.x0 + c * g.cell) * s);
        var y = Math.round((g.y0 + r * g.cell) * s);
        var x2 = Math.round((g.x0 + (c + 1) * g.cell) * s);
        var y2 = Math.round((g.y0 + (r + 1) * g.cell) * s);
        ctx.fillRect(x, y, x2 - x, y2 - y);
      }
    }
  }

  // Draws the whole poster onto ctx. `template` is the flattened artwork image.
  function drawPoster(ctx, template) {
    var s = ctx.canvas.width / DOC.w;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(template, 0, 0, ctx.canvas.width, ctx.canvas.height);
    var shrunk = drawText(ctx, s);
    drawLogo(ctx, s);
    drawQr(ctx, s);
    return { shrunk: shrunk };
  }

  /* ---------------- Preview ---------------- */

  var previewCtx = els.preview.getContext('2d');
  var renderQueued = false;

  function scheduleRender() {
    if (renderQueued) return;
    renderQueued = true;
    var run = function () {
      if (!renderQueued) return;
      renderQueued = false;
      renderPreview();
    };
    // rAF coalesces rapid typing into one draw, but it is paused in background /
    // unfocused tabs, so fall back to a short timer.
    requestAnimationFrame(run);
    setTimeout(run, 50);
  }

  function renderPreview() {
    var t = currentTemplate();
    if (!t) return;
    els.previewLoading.hidden = false;
    Promise.all([loadImage(t.preview), ensureFont()]).then(function (res) {
      var img = res[0];
      els.preview.width = img.naturalWidth;
      els.preview.height = img.naturalHeight;
      var out = drawPoster(previewCtx, img);
      els.fitHint.hidden = !out.shrunk;
      els.previewLoading.hidden = true;
    }).catch(function (err) {
      els.previewLoading.textContent = err.message;
    });
  }

  /* ---------------- QR + shortening ---------------- */

  function normaliseUrl(u) {
    u = (u || '').trim();
    if (!u) return '';
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) u = 'https://' + u;
    return u;
  }

  function buildQr() {
    var target = state.useFull ? normaliseUrl(state.url) : (state.shortUrl || '');
    if (!target && !state.useFull && state.url) target = ''; // waiting to be shortened
    if (target === qrText && qrModel) return;
    qrText = target;
    qrModel = null;
    if (target) {
      try {
        var q = window.qrcode(0, 'M'); // typeNumber 0 = smallest that fits
        q.addData(target);
        q.make();
        qrModel = q;
      } catch (e) {
        qrModel = null;
      }
    }
    if (target) {
      els.qrEncodes.textContent = 'QR code encodes: ' + target + (qrModel ? ' (' + qrModel.getModuleCount() + '×' + qrModel.getModuleCount() + ' modules)' : '');
    } else if (state.url) {
      els.qrEncodes.textContent = 'Click “Shorten with TinyURL” (or tick “Use the full URL”) to generate the QR code.';
    } else {
      els.qrEncodes.textContent = 'No link yet — the QR panel is left off the poster.';
    }
  }

  function setShortStatus(msg, cls) {
    els.shortStatus.textContent = msg;
    els.shortStatus.className = 'poster-hint' + (cls ? ' poster-hint--' + cls : '');
  }

  function shortenWithTinyUrl(url) {
    return fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(url))
      .then(function (r) { if (!r.ok) throw new Error('TinyURL ' + r.status); return r.text(); })
      .then(function (t) {
        t = t.trim();
        if (!/^https?:\/\/tinyurl\.com\//i.test(t)) throw new Error('Unexpected TinyURL reply');
        return t;
      });
  }

  function shortenWithIsGd(url) {
    return fetch('https://is.gd/create.php?format=json&url=' + encodeURIComponent(url))
      .then(function (r) { if (!r.ok) throw new Error('is.gd ' + r.status); return r.json(); })
      .then(function (j) {
        if (!j.shorturl) throw new Error(j.errormessage || 'is.gd failed');
        return j.shorturl;
      });
  }

  function shorten() {
    var url = normaliseUrl(state.url);
    if (!url) { setShortStatus('Paste a link first.', 'err'); return; }
    try { new URL(url); } catch (e) { setShortStatus('That doesn’t look like a valid URL.', 'err'); return; }
    els.shorten.disabled = true;
    setShortStatus('Shortening…');
    shortenWithTinyUrl(url)
      .catch(function () { return shortenWithIsGd(url); })
      .then(function (shortUrl) {
        state.shortUrl = shortUrl;
        state.useFull = false;
        els.useFull.checked = false;
        setShortStatus('Short link: ' + shortUrl, 'ok');
        saveState();
        buildQr();
        scheduleRender();
      })
      .catch(function (err) {
        setShortStatus('Couldn’t shorten the link (' + err.message + '). Tick “Use the full URL instead”, or try again.', 'err');
      })
      .then(function () { els.shorten.disabled = false; });
  }

  /* ---------------- Export ---------------- */

  function setExportStatus(msg, cls) {
    els.exportStatus.textContent = msg;
    els.exportStatus.className = 'poster-hint' + (cls ? ' poster-hint--' + cls : '');
  }

  function slugify(s) {
    return (s || '').toLowerCase().replace(/[£$€]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function exportFileName(ext) {
    var base = state.fileName.trim() || ('wasteland-poster-' + slugify(displayText(state.line2).split('•')[0]) || 'wasteland-poster');
    base = base.replace(/\.(pdf|png)$/i, '');
    return base + '.' + ext;
  }

  function renderFullSize() {
    var t = currentTemplate();
    return Promise.all([loadImage(t.full), ensureFont()]).then(function (res) {
      var img = res[0];
      var c = document.createElement('canvas');
      c.width = DOC.w;
      c.height = DOC.h;
      var ctx = c.getContext('2d');
      drawPoster(ctx, img);
      return c;
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error('Export failed')); }, type, quality);
    });
  }

  function download(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  function busy(on) {
    els.downloadPdf.disabled = on;
    els.downloadPng.disabled = on;
    els.form.classList.toggle('is-busy', on);
  }

  function exportPng() {
    busy(true);
    setExportStatus('Rendering at full size…');
    renderFullSize()
      .then(function (c) { return canvasToBlob(c, 'image/png'); })
      .then(function (blob) {
        download(blob, exportFileName('png'));
        setExportStatus('PNG downloaded (' + Math.round(blob.size / 1048576 * 10) / 10 + ' MB).', 'ok');
      })
      .catch(function (err) { setExportStatus('Export failed: ' + err.message, 'err'); })
      .then(function () { busy(false); });
  }

  function exportPdf() {
    if (!window.PDFLib) { setExportStatus('The PDF library didn’t load — check your connection and reload.', 'err'); return; }
    busy(true);
    setExportStatus('Rendering at full size…');
    var PDFDocument = window.PDFLib.PDFDocument, rgb = window.PDFLib.rgb;
    renderFullSize()
      .then(function (c) { return canvasToBlob(c, 'image/jpeg', 0.95); })
      .then(function (blob) { return blob.arrayBuffer(); })
      .then(function (jpgBytes) {
        setExportStatus('Building PDF…');
        return PDFDocument.create().then(function (doc) {
          doc.setTitle('Tales From The Wasteland — ' + displayText(state.line2 || state.line1));
          doc.setProducer('talesfromthewasteland poster generator');
          var page = doc.addPage([PDF_PAGE.w, PDF_PAGE.h]);
          return doc.embedJpg(jpgBytes).then(function (img) {
            page.drawImage(img, { x: 0, y: 0, width: PDF_PAGE.w, height: PDF_PAGE.h });

            // Re-draw the QR code as vector squares so it stays perfectly sharp.
            var g = qrGeometry();
            if (g) {
              var k = PDF_PAGE.w / DOC.w;          // template px -> pt
              var toY = function (yPx) { return PDF_PAGE.h - yPx * k; };
              var Q = g.panel;
              // White square under the modules (inside the rounded panel that is already in the raster)
              page.drawRectangle({
                x: (Q.x + Q.radius / 2) * k, y: toY(Q.y + Q.size - Q.radius / 2),
                width: (Q.size - Q.radius) * k, height: (Q.size - Q.radius) * k,
                color: rgb(1, 1, 1), borderWidth: 0
              });
              // Merge horizontal runs of dark modules into single rectangles (fewer objects, no seams)
              for (var r = 0; r < g.n; r++) {
                var c0 = -1;
                for (var col = 0; col <= g.n; col++) {
                  var dark = col < g.n && qrModel.isDark(r, col);
                  if (dark && c0 < 0) c0 = col;
                  if (!dark && c0 >= 0) {
                    var x = (g.x0 + c0 * g.cell) * k;
                    var w = (col - c0) * g.cell * k;
                    var yTop = g.y0 + r * g.cell;
                    page.drawRectangle({
                      x: x, y: toY(yTop + g.cell), width: w, height: g.cell * k,
                      color: rgb(0, 0, 0), borderWidth: 0
                    });
                    c0 = -1;
                  }
                }
              }
            }
            return doc.save();
          });
        });
      })
      .then(function (bytes) {
        var blob = new Blob([bytes], { type: 'application/pdf' });
        download(blob, exportFileName('pdf'));
        setExportStatus('PDF downloaded (' + Math.round(blob.size / 1048576 * 10) / 10 + ' MB).', 'ok');
      })
      .catch(function (err) { setExportStatus('Export failed: ' + err.message, 'err'); })
      .then(function () { busy(false); });
  }

  /* ---------------- UI wiring ---------------- */

  function syncOutputs() {
    els.textScaleOut.value = state.textScale + '%';
    els.textDyOut.value = (state.textDy > 0 ? '+' : '') + state.textDy;
    els.logoScaleOut.value = state.logoScale + '%';
    els.logoDxOut.value = (state.logoDx > 0 ? '+' : '') + state.logoDx;
    els.logoDyOut.value = (state.logoDy > 0 ? '+' : '') + state.logoDy;
    els.qrScaleOut.value = state.qrScale + '%';
    els.qrDxOut.value = (state.qrDx > 0 ? '+' : '') + state.qrDx;
    els.qrDyOut.value = (state.qrDy > 0 ? '+' : '') + state.qrDy;
  }

  function applyStateToInputs() {
    els.line1.value = state.line1;
    els.line2.value = state.line2;
    els.allCaps.checked = !!state.allCaps;
    els.textScale.value = state.textScale;
    els.textDy.value = state.textDy;
    els.logoMode.value = state.logoMode;
    els.logoScale.value = state.logoScale;
    els.logoDx.value = state.logoDx;
    els.logoDy.value = state.logoDy;
    els.url.value = state.url;
    els.useFull.checked = !!state.useFull;
    els.qrScale.value = state.qrScale;
    els.qrDx.value = state.qrDx;
    els.qrDy.value = state.qrDy;
    els.fileName.value = state.fileName;
    if (state.shortUrl) setShortStatus('Short link: ' + state.shortUrl, 'ok');
    syncOutputs();
  }

  function bindText(el, key) {
    el.addEventListener('input', function () {
      state[key] = el.value;
      saveState();
      scheduleRender();
    });
  }

  function bindRange(el, key) {
    el.addEventListener('input', function () {
      state[key] = Number(el.value);
      syncOutputs();
      saveState();
      scheduleRender();
    });
  }

  bindText(els.line1, 'line1');
  bindText(els.line2, 'line2');
  bindRange(els.textScale, 'textScale');
  bindRange(els.textDy, 'textDy');
  bindRange(els.logoScale, 'logoScale');
  bindRange(els.logoDx, 'logoDx');
  bindRange(els.logoDy, 'logoDy');
  bindRange(els.qrScale, 'qrScale');
  bindRange(els.qrDx, 'qrDx');
  bindRange(els.qrDy, 'qrDy');

  els.allCaps.addEventListener('change', function () {
    state.allCaps = els.allCaps.checked; saveState(); scheduleRender();
  });

  var lastLineInput = els.line1;
  [els.line1, els.line2].forEach(function (el) {
    el.addEventListener('focus', function () { lastLineInput = el; });
  });

  els.insertBullet.addEventListener('click', function () {
    var el = lastLineInput;
    var v = el.value;
    var start = el.selectionStart != null ? el.selectionStart : v.length;
    var end = el.selectionEnd != null ? el.selectionEnd : v.length;
    var before = v.slice(0, start).replace(/\s+$/, '');
    var after = v.slice(end).replace(/^\s+/, '');
    var sep = ' • ';
    el.value = before + sep + after;
    var pos = before.length + sep.length;
    el.focus();
    el.setSelectionRange(pos, pos);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  els.swapLines.addEventListener('click', function () {
    var tmp = state.line1; state.line1 = state.line2; state.line2 = tmp;
    els.line1.value = state.line1; els.line2.value = state.line2;
    saveState(); scheduleRender();
  });

  function setLogoFromDataUrl(dataUrl) {
    if (!dataUrl) {
      logoImage = null; logoProcessed = null;
      state.logoData = null;
      scheduleRender();
      return;
    }
    var img = new Image();
    img.onload = function () {
      logoImage = img; logoProcessed = null;
      state.logoData = dataUrl;
      saveState();
      scheduleRender();
    };
    img.onerror = function () {
      logoImage = null; logoProcessed = null; state.logoData = null;
      alert('That image could not be read. Try a PNG, SVG or JPG.');
    };
    img.src = dataUrl;
  }

  els.logoFile.addEventListener('change', function () {
    var f = els.logoFile.files && els.logoFile.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () { setLogoFromDataUrl(String(reader.result)); };
    reader.readAsDataURL(f);
  });

  els.logoClear.addEventListener('click', function () {
    els.logoFile.value = '';
    setLogoFromDataUrl(null);
    saveState();
  });

  els.logoMode.addEventListener('change', function () {
    state.logoMode = els.logoMode.value; saveState(); scheduleRender();
  });

  els.url.addEventListener('input', function () {
    var v = els.url.value;
    if (v !== state.url) {
      state.url = v;
      state.shortUrl = '';   // the old short link no longer matches
      setShortStatus('');
    }
    saveState(); buildQr(); scheduleRender();
  });

  els.shorten.addEventListener('click', shorten);

  els.useFull.addEventListener('change', function () {
    state.useFull = els.useFull.checked; saveState(); buildQr(); scheduleRender();
  });

  els.fileName.addEventListener('input', function () { state.fileName = els.fileName.value; saveState(); });

  els.downloadPng.addEventListener('click', exportPng);
  els.downloadPdf.addEventListener('click', exportPdf);

  els.resetAll.addEventListener('click', function () {
    if (!confirm('Clear the text, logo and link and start again?')) return;
    var version = state.version;
    state = Object.assign({}, defaults, { version: version });
    logoImage = null; logoProcessed = null; els.logoFile.value = '';
    setShortStatus('');
    applyStateToInputs();
    saveState();
    buildQr();
    scheduleRender();
  });

  els.form.addEventListener('submit', function (e) { e.preventDefault(); });

  /* ---------------- Boot ---------------- */

  function renderVersionPicker() {
    els.versions.innerHTML = '';
    templates.forEach(function (t) {
      var label = document.createElement('label');
      label.className = 'poster-version';
      var input = document.createElement('input');
      input.type = 'radio'; input.name = 'version'; input.value = t.id;
      input.checked = t.id === state.version;
      var img = document.createElement('img');
      img.src = t.thumb; img.alt = ''; img.loading = 'lazy';
      var span = document.createElement('span');
      span.textContent = t.label;
      label.appendChild(input); label.appendChild(img); label.appendChild(span);
      input.addEventListener('change', function () {
        if (!input.checked) return;
        state.version = t.id;
        saveState();
        renderPreview();
        loadImage(t.full).catch(function () {}); // warm the export image in the background
      });
      els.versions.appendChild(label);
    });
  }

  loadState();
  applyStateToInputs();

  ensureFont().then(function (ok) { els.fontWarning.hidden = !!ok; });

  fetch('assets/poster/templates.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('templates.json ' + r.status); return r.json(); })
    .then(function (json) {
      templates = json.templates || [];
      if (!templates.length) throw new Error('No templates listed in assets/poster/templates.json');
      if (!currentTemplate() || state.version == null) state.version = templates[0].id;
      else state.version = currentTemplate().id;
      renderVersionPicker();
      if (state.logoData) setLogoFromDataUrl(state.logoData);
      buildQr();
      renderPreview();
    })
    .catch(function (err) {
      els.previewLoading.textContent = err.message;
    });
})();
