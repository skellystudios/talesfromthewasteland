/* =====================================================================
   SHOW DATES
   ---------------------------------------------------------------------
   This is the only file you need to edit to add, change or remove a show.
   Every page (home, shows.html, show.html) reads from this list.

   Fields:
     slug        Unique id used in the URL: show.html?show=<slug>
                 Keep it lowercase, letters/numbers/hyphens only.
     date        ISO date, YYYY-MM-DD. Shows in the past are hidden automatically.
     endDate     (optional) last night of a run, e.g. a 3-night stint.
     time        Start time, 24h "HH:MM".
     doors       (optional) doors time, 24h "HH:MM".
     city        Shown big in the list, like a tour poster.
     venue       Venue name.
     address     (optional) full postal address for the listing page.
     mapUrl      (optional) Google Maps link.
     price       Human-readable, e.g. "£14 / £12 concessions".
     priceFrom   Number, lowest ticket price. Used for the "From £X" button.
     ageGuidance e.g. "16+"
     runtime     e.g. "2 hrs incl. interval"
     ticketUrl   The venue / ticketing site the Book button sends people to.
     status      "on-sale" | "selling-fast" | "sold-out" | "coming-soon"
     title       (optional) special-edition name, e.g. "Pride Special",
                 "Camden Fringe". Shown as a tag in the list and on the page.
     blurb       (optional) a paragraph about this particular show, shown at
                 the top of the listing page.
     note        (optional) anything else — accessibility, parking, a special
                 guest, "part of X festival", etc.

   Past shows can stay in the list: they drop out of "upcoming" automatically
   and appear under "Where we've been" on shows.html.
   ===================================================================== */

window.WASTELAND_SHOWS = [

  /* ---------- 2026 (from the original draft site) ---------- */
  {
    slug: "bristol-folk-house-pride-special-2026-07-10",
    date: "2026-07-10",
    time: "20:00",
    city: "Bristol",
    venue: "Bristol Folk House",
    address: "40a Park Street, Bristol BS1 5JG",
    mapUrl: "https://maps.google.com/?q=Bristol+Folk+House",
    price: "£12.90",
    priceFrom: 12.90,
    ageGuidance: "16+",
    runtime: "2 hrs incl. interval",
    ticketUrl: "https://hdfst.uk/e147438",
    status: "on-sale",
    title: "Pride Special",
    blurb: "This Pride special celebrates the colourful, chaotic, and wonderfully diverse communities that thrive after the end of the world. Expect mutants, raiders, questionable fashion choices, and enough queer joy to survive any apocalypse. All profits from this show will be donated to Bristol Pride to support its work promoting equality, inclusion, and LGBTQ+ rights.",
    note: ""
  },
  {
    slug: "camden-fringe-2026-08-20",
    date: "2026-08-20",
    endDate: "2026-08-22",
    time: "21:00",
    city: "London",
    venue: "Hen & Chickens Theatre",
    address: "109 St Paul's Road, Highbury, London N1 2NA",
    mapUrl: "https://maps.google.com/?q=Hen+and+Chickens+Theatre",
    price: "£10",
    priceFrom: 10,
    ageGuidance: "16+",
    runtime: "50 mins",
    ticketUrl: "https://camdenfringe.com/events/tales-from-the-wasteland-post-apocalyptic-improv/",
    status: "on-sale",
    title: "Camden Fringe",
    blurb: "We return to Camden Fringe for three nights, for a third year, with an even bigger show.",
    note: "Three performances: Thu 20, Fri 21 and Sat 22 August, all at 9pm. Pick your night on the Camden Fringe site."
  },
  {
    slug: "loco-klub-2026-09-03",
    date: "2026-09-03",
    time: "19:30",
    city: "Bristol",
    venue: "Loco Klub",
    address: "Bristol Temple Meads, Bristol BS1 6QH",
    mapUrl: "https://maps.google.com/?q=Loco+Klub+Bristol",
    price: "£11.90",
    priceFrom: 11.90,
    ageGuidance: "18+",
    runtime: "2 hrs incl. interval",
    ticketUrl: "https://hdfst.uk/e152139",
    status: "on-sale",
    title: "",
    blurb: "",
    note: "Loco Klub is under Temple Meads station — follow the signs from the station forecourt."
  },
  {
    slug: "tobacco-factory-2026-11-14",
    date: "2026-11-14",
    time: "20:00",
    city: "Bristol",
    venue: "Tobacco Factory Theatres — Spielman Theatre",
    address: "Raleigh Road, Southville, Bristol BS3 1TF",
    mapUrl: "https://maps.google.com/?q=Tobacco+Factory+Theatres",
    price: "£14 / £12 concessions",
    priceFrom: 12,
    ageGuidance: "16+",
    runtime: "1 hr 40 mins incl. interval",
    ticketUrl: "https://tobaccofactorytheatres.com/shows/tales-from-the-wasteland-post-apocalyptic-improv-2",
    status: "on-sale",
    note: ""
  }
];

/* =====================================================================
   Rendering — you shouldn't need to touch anything below this line.
   ===================================================================== */
(function () {
  var shows = window.WASTELAND_SHOWS || [];

  // ---------- helpers ----------
  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function parseDate(iso) {
    var p = iso.split("-").map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }

  function fmt(date, opts) {
    // en-GB gives "Fri, 16 Oct 2026" — drop the comma for a poster-style "Fri 16 Oct 2026"
    return new Intl.DateTimeFormat("en-GB", opts).format(date).replace(/,/g, "");
  }

  function fmtTime(hhmm) {
    if (!hhmm) return "";
    var p = hhmm.split(":").map(Number);
    var h = p[0] % 12 || 12;
    var suffix = p[0] >= 12 ? "pm" : "am";
    return p[1] ? h + ":" + pad(p[1]) + suffix : h + suffix;
  }

  // "Fri 16 Oct 2026" or "Fri 4 – Sat 5 Dec 2026"
  function fmtDateRange(show) {
    var start = parseDate(show.date);
    if (!show.endDate || show.endDate === show.date) {
      return fmt(start, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    }
    var end = parseDate(show.endDate);
    var sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    var a = sameMonth
      ? fmt(start, { weekday: "short", day: "numeric" })
      : fmt(start, { weekday: "short", day: "numeric", month: "short" });
    var b = fmt(end, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    return a + " \u2013 " + b;
  }

  function isUpcoming(show) {
    var last = parseDate(show.endDate || show.date);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return last >= today;
  }

  function upcoming() {
    return shows.filter(isUpcoming).sort(function (a, b) {
      return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    });
  }

  function fmtPrice(n) {
    return "\u00a3" + (Number.isInteger(n) ? n : n.toFixed(2));
  }

  function past() {
    return shows.filter(function (s) { return !isUpcoming(s); }).sort(function (a, b) {
      return a.date > b.date ? -1 : a.date < b.date ? 1 : 0;
    });
  }

  function statusLabel(status) {
    return {
      "on-sale": "On sale",
      "selling-fast": "Selling fast",
      "sold-out": "Sold out",
      "coming-soon": "On sale soon"
    }[status] || "";
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function detailUrl(show) {
    return "show.html?show=" + encodeURIComponent(show.slug);
  }

  // Pass any utm_* / fbclid params on this page through to the ticket site so the
  // click can be attributed end-to-end. Harmless if the ticket site ignores them.
  function bookUrl(show) {
    var url = show.ticketUrl;
    try {
      var here = new URLSearchParams(window.location.search);
      var pass = [];
      here.forEach(function (v, k) {
        if (/^utm_/i.test(k) || k === "fbclid") pass.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
      });
      if (pass.length) url += (url.indexOf("?") === -1 ? "?" : "&") + pass.join("&");
    } catch (e) { /* ignore */ }
    return url;
  }

  // Meta Pixel (and anything else) hook. main.js defines window.wlTrack; if it's
  // absent this is a no-op.
  function track(name, params) {
    if (typeof window.wlTrack === "function") window.wlTrack(name, params);
  }

  function bookButton(show, cls, hidePrice) {
    if (show.status === "sold-out") {
      return '<span class="btn btn--disabled ' + (cls || "") + '" aria-disabled="true">Sold out</span>';
    }
    if (show.status === "coming-soon") {
      return '<a class="btn ' + (cls || "") + '" href="https://www.instagram.com/wasteland_improv/" target="_blank" rel="noopener">Get notified</a>';
    }
    var label = (!hidePrice && show.priceFrom) ? "Book now \u00b7 from " + fmtPrice(show.priceFrom) : "Book now";
    return '<a class="btn btn--solid ' + (cls || "") + '" href="' + esc(bookUrl(show)) + '" target="_blank" rel="noopener" data-book="' + esc(show.slug) + '">' + label + '</a>';
  }

  // ---------- list ----------
  function renderList(el) {
    var limit = parseInt(el.getAttribute("data-limit"), 10);
    var list = upcoming();
    if (limit) list = list.slice(0, limit);

    var empty = document.querySelector(el.getAttribute("data-empty") || "[data-shows-empty]");
    var more = document.querySelector(el.getAttribute("data-more") || "[data-shows-more]");

    if (!list.length) {
      el.innerHTML = "";
      if (empty) empty.hidden = false;
      if (more) more.hidden = true;
      return;
    }
    if (empty) empty.hidden = true;
    if (more) more.hidden = upcoming().length <= list.length;

    el.innerHTML = list.map(function (show) { return showRow(show); }).join("");
  }

  function showRow(show, opts) {
    opts = opts || {};
    var d = parseDate(show.date);
    var gone = !!opts.past;
    var status = gone ? "Past" : statusLabel(show.status);
    var actions = '<a class="btn btn--ghost" href="' + detailUrl(show) + '">Details</a>' +
      (gone ? "" : '<a class="btn btn--solid" href="' + detailUrl(show) + '">Book now</a>');
    return (
      '<li class="show show--' + esc(gone ? "past" : show.status) + '">' +
        '<a class="show__link" href="' + detailUrl(show) + '" aria-label="' + esc(show.venue + ", " + show.city + " \u2014 " + fmtDateRange(show)) + '"></a>' +
        '<div class="show__date">' +
          '<span class="show__dow">' + fmt(d, { weekday: "short" }) + '</span>' +
          '<b>' + d.getDate() + '</b>' +
          '<span>' + fmt(d, { month: "short" }) + (show.endDate && show.endDate !== show.date ? ' <em>+</em>' : '') + '</span>' +
        '</div>' +
        '<div class="show__where">' +
          '<div class="show__city display">' + esc(show.city) +
            (show.title ? ' <span class="show__tag">' + esc(show.title) + '</span>' : '') + '</div>' +
          '<div class="show__venue">' + esc(show.venue) + '</div>' +
          '<div class="show__meta">' + esc(fmtDateRange(show)) + ' \u00b7 ' + esc(fmtTime(show.time)) +
            (status ? ' <span class="show__status">' + status + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="show__actions">' + actions + '</div>' +
      '</li>'
    );
  }

  // ---------- past shows ----------
  function renderPast(el) {
    var list = past();
    var section = el.closest("[data-shows-past-section]");
    if (!list.length) { if (section) section.hidden = true; return; }
    if (section) section.hidden = false;
    el.innerHTML = list.map(function (show) { return showRow(show, { past: true }); }).join("");
  }

  // ---------- listing page ----------
  function renderDetail(el) {
    var slug = new URLSearchParams(window.location.search).get("show");
    var show = shows.filter(function (s) { return s.slug === slug; })[0];

    if (!show) {
      el.innerHTML =
        '<div class="wrap">' +
          '<div class="notice"><p>We couldn\u2019t find that show. It may have been and gone.</p>' +
          '<p><a class="btn" href="shows.html">See all upcoming shows</a></p></div>' +
        '</div>';
      document.title = "Show not found \u2014 Tales From The Wasteland";
      return;
    }

    var d = parseDate(show.date);
    var gone = !isUpcoming(show);
    var title = "Tales From The Wasteland" + (show.title ? ": " + show.title : "") + " \u2014 " + show.venue + ", " + show.city;
    document.title = title + " \u2014 " + fmtDateRange(show);

    var facts = [
      ["Date", fmtDateRange(show)],
      ["Start", fmtTime(show.time) + (show.doors ? " (doors " + fmtTime(show.doors) + ")" : "")],
      ["Running time", show.runtime],
      ["Age guidance", show.ageGuidance],
      ["Tickets", show.price],
      ["Venue", show.venue + (show.address ? "<br><span class=\"muted\">" + esc(show.address) + "</span>" : "") +
        (show.mapUrl ? ' <a href="' + esc(show.mapUrl) + '" target="_blank" rel="noopener">Map</a>' : "")]
    ].filter(function (f) { return f[1]; });

    var others = upcoming().filter(function (s) { return s.slug !== show.slug; }).slice(0, 4);

    el.innerHTML =
      '<section class="show-page">' +
        '<div class="wrap show-layout">' +
          '<div class="show-layout__intro">' +
            '<a class="backlink" href="shows.html">\u2190 All dates</a>' +
            '<span class="eyebrow">' + (gone ? 'This show has been and gone \u00b7 ' : '') + esc(fmtDateRange(show)) + ' \u00b7 ' + esc(fmtTime(show.time)) + '</span>' +
            '<h1 class="display h-xl">Tales From The Wasteland' + (show.title ? ' <span class="page-head__tag">' + esc(show.title) + '</span>' : '') + '</h1>' +
            '<p class="page-head__venue">' + esc(show.venue) + ' \u00b7 ' + esc(show.city) + '</p>' +
            '<p class="show-layout__lede">' + (show.blurb ? esc(show.blurb) : 'An improvised post-apocalyptic adventure comedy, built live on the night from a single audience suggestion. Every show is a one-off.') + '</p>' +
          '</div>' +

          '<aside class="show-layout__side">' +
            '<div class="booking">' +
              '<dl class="facts">' +
                facts.map(function (f) { return '<div><dt>' + f[0] + '</dt><dd>' + f[1] + '</dd></div>'; }).join("") +
              '</dl>' +
              (gone
                ? '<a class="btn btn--ghost btn--lg btn--block" href="shows.html">See upcoming dates</a>'
                : bookButton(show, "btn--lg btn--block")) +
              (!gone && show.status !== "sold-out" && show.status !== "coming-soon"
                ? '<p class="booking__note">You\u2019ll complete your booking on the venue\u2019s website.</p>'
                : '') +
            '</div>' +
          '</aside>' +

          '<div class="show-layout__body prose">' +
            '<h2 class="display h-md">About the show</h2>' +
            '<p>Before the show you\u2019ll be asked: <strong>if the world was ending, what\u2019s the one thing you\u2019d want to survive?</strong> One answer is pulled at random and our cast of wastelanders build an entire narrative show around it \u2014 characters, factions, villains and all \u2014 entirely on the spot.</p>' +
            '<p>Expect raiders, mutants and violence over scarce resources in an absurd dark comedy inspired by <em>Mad Max</em>, <em>The Last of Us</em> and <em>Fallout</em>.</p>' +
            (show.note ? '<h3 class="display">Venue notes</h3><p>' + esc(show.note) + '</p>' : '') +
            '<h3 class="display">Need to know</h3>' +
            '<ul>' +
              '<li>Contains dark themes, violence and cannibalism. Seriously, cannibalism comes up way too often.</li>' +
              '<li>One written suggestion before the show. Nobody gets dragged on stage.</li>' +
              '<li>Tickets are sold by the venue. The Book button takes you to their box office.</li>' +
            '</ul>' +
          '</div>' +
        '</div>' +
      '</section>' +

      (others.length
        ? '<section class="section section--dark2">' +
            '<div class="wrap">' +
              '<div class="section__head"><span class="eyebrow">Can\u2019t make this one?</span><h2 class="display h-lg">Other upcoming dates</h2></div>' +
              '<ul class="shows" data-shows-list data-limit="4" data-exclude="' + esc(show.slug) + '"></ul>' +
              '<p class="more"><a class="btn btn--ghost" href="shows.html">All dates</a></p>' +
            '</div>' +
          '</section>'
        : '');

    // Render the "other dates" list, minus the current show.
    var otherList = el.querySelector("[data-shows-list]");
    if (otherList) {
      var saved = shows;
      shows = others;
      renderList(otherList);
      shows = saved;
    }

    // Structured data — helps Google show this as an event.
    var ld = {
      "@context": "https://schema.org",
      "@type": "TheaterEvent",
      "name": "Tales From The Wasteland",
      "startDate": show.date + "T" + show.time + ":00",
      "eventStatus": "https://schema.org/EventScheduled",
      "location": { "@type": "Place", "name": show.venue, "address": show.address || show.city },
      "performer": { "@type": "TheaterGroup", "name": "Tales From The Wasteland" },
      "offers": { "@type": "Offer", "url": show.ticketUrl, "price": show.priceFrom, "priceCurrency": "GBP",
        "availability": (gone || show.status === "sold-out") ? "https://schema.org/SoldOut" : "https://schema.org/InStock" }
    };
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);

    if (!gone) track("ViewContent", {
      content_name: title,
      content_ids: [show.slug],
      content_type: "product",
      value: show.priceFrom || 0,
      currency: "GBP"
    });
  }

  // ---------- boot ----------
  document.querySelectorAll("[data-shows-list]:not([data-exclude])").forEach(renderList);
  document.querySelectorAll("[data-shows-past]").forEach(renderPast);
  var detail = document.querySelector("[data-show-detail]");
  if (detail) renderDetail(detail);

  // Book clicks → InitiateCheckout (fires before the new tab opens; no delay needed).
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-book]");
    if (!a) return;
    var show = shows.filter(function (s) { return s.slug === a.getAttribute("data-book"); })[0];
    track("InitiateCheckout", {
      content_name: show ? show.venue + ", " + show.city : a.getAttribute("data-book"),
      content_ids: [a.getAttribute("data-book")],
      content_type: "product",
      value: show && show.priceFrom ? show.priceFrom : 0,
      currency: "GBP"
    });
  });
})();
