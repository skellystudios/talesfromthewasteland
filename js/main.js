/* =====================================================================
   META PIXEL
   Paste your Pixel ID between the quotes to switch tracking on. Leave it
   empty and nothing loads. PageView fires on every page; the show listing
   page fires ViewContent, and every Book button fires InitiateCheckout
   (see js/shows.js). Any utm_* / fbclid params on the page are passed
   through to the ticket site's URL.
   ===================================================================== */
var META_PIXEL_ID = "";

(function () {
  if (META_PIXEL_ID) {
    /* Standard Meta base code */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
  }

  // Used by shows.js. Safe to call even when the pixel isn't configured.
  window.wlTrack = function (name, params) {
    if (typeof window.fbq === 'function') window.fbq('track', name, params || {});
  };
})();

(function () {
  // ---- Mobile navigation toggle ----
  var toggle = document.querySelector('.nav__toggle');
  var links = document.querySelector('.nav__links');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('is-open')) {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!links.classList.contains('is-open')) return;
      if (e.target.closest('.nav')) return;
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  // ---- Forms without a real endpoint yet ----
  // Any form with data-demo="true" shows an inline confirmation instead of
  // submitting. Remove that attribute (and set a real action) once the form is
  // wired to Mailchimp / Formspree / your email provider.
  document.querySelectorAll('form[data-demo="true"]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var msg = document.createElement('div');
      msg.className = 'form__success';
      msg.setAttribute('role', 'status');
      msg.textContent = form.getAttribute('data-success') ||
        'Thanks! Your message has been received.';
      form.replaceWith(msg);
    });
  });

  // ---- Footer year ----
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  // ---- Gallery lightbox ----
  var gallery = document.querySelector('.gallery');
  if (gallery) {
    var items = Array.prototype.slice.call(gallery.querySelectorAll('a'));
    var index = 0;
    var overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Photo');
    overlay.innerHTML =
      '<button class="lightbox__close" type="button" aria-label="Close">&times;</button>' +
      '<button class="lightbox__prev" type="button" aria-label="Previous photo">&#8249;</button>' +
      '<img alt="">' +
      '<button class="lightbox__next" type="button" aria-label="Next photo">&#8250;</button>';
    document.body.appendChild(overlay);

    var img = overlay.querySelector('img');
    var closeBtn = overlay.querySelector('.lightbox__close');

    function show(i) {
      index = (i + items.length) % items.length;
      var link = items[index];
      var thumb = link.querySelector('img');
      img.src = link.href;
      img.alt = thumb ? thumb.alt : '';
    }

    function open(i) {
      show(i);
      overlay.classList.add('is-open');
      document.body.classList.add('lightbox-open');
      closeBtn.focus();
    }

    function close() {
      overlay.classList.remove('is-open');
      document.body.classList.remove('lightbox-open');
      img.src = '';
    }

    items.forEach(function (link, i) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        open(i);
      });
    });

    closeBtn.addEventListener('click', close);
    overlay.querySelector('.lightbox__prev').addEventListener('click', function (e) {
      e.stopPropagation();
      show(index - 1);
    });
    overlay.querySelector('.lightbox__next').addEventListener('click', function (e) {
      e.stopPropagation();
      show(index + 1);
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  }
})();
