// §19.7 — language SUGGESTION for the marketing site.
//
// Deliberately not a redirect on first visit. GitHub Pages cannot vary a
// response by Accept-Language, so any detection has to run in the browser
// after the page paints; auto-redirecting there would (a) flash the wrong
// language, (b) hide the localised pages from crawlers, which arrive with
// English headers from US IPs, and (c) trap anyone who actually wants the
// page they asked for. So: offer, once, dismissibly.
//
// A saved choice IS honoured on later visits, because at that point it is the
// visitor's stated preference rather than our guess. Crawlers are unaffected
// by construction — they have no localStorage, so they always see the page as
// authored.
(function () {
  var KEY = 'saythrough-site-lang'
  var LANGS = ['en', 'es', 'it', 'pl', 'pt']
  // The banner speaks the language it is OFFERING, not the one on screen.
  var COPY = {
    es: { text: 'Esta página también está en español.', go: 'Ver en español', close: 'Cerrar' },
    it: { text: 'Questa pagina è disponibile anche in italiano.', go: 'Vedi in italiano', close: 'Chiudi' },
    pl: { text: 'Ta strona jest też po polsku.', go: 'Zobacz po polsku', close: 'Zamknij' },
    pt: { text: 'Esta página também está em português.', go: 'Ver em português', close: 'Fechar' },
    en: { text: 'This page is also available in English.', go: 'View in English', close: 'Dismiss' },
  }

  function read(k) { try { return localStorage.getItem(k) } catch (e) { return null } }
  function write(k, v) { try { localStorage.setItem(k, v) } catch (e) {} }

  var pageLang = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase()

  // Where a given language lives for THIS page.
  //
  // The switcher already knows: the build renders it per page, and for a
  // market-scoped page (a comparison that only exists in one language) it
  // points the other languages at their home page rather than at a URL that
  // was never written. Reading its hrefs keeps the banner and the remembered
  // choice honest — computing the path here instead used to offer English a
  // translation of the Polish-only MÓWik comparison, which is a 404.
  function urlFor(lang) {
    var link = document.querySelector('[data-lang-switch] a[lang^="' + lang + '"]')
    if (link) return link.getAttribute('href')
    // No switcher (or no entry for this language): fall back to the same path
    // under the other prefix, which is right for every ordinary page.
    var path = location.pathname.replace(/^\/(es|it|pl|pt)(?=\/|$)/, '') || '/'
    return (lang === 'en' ? '' : '/' + lang) + path + location.search + location.hash
  }

  // Clicking the switcher is an explicit choice; remember it.
  var nav = document.querySelectorAll('[data-lang-switch] a')
  for (var i = 0; i < nav.length; i++) {
    nav[i].addEventListener('click', function () {
      var l = (this.getAttribute('lang') || 'en').slice(0, 2).toLowerCase()
      write(KEY, l)
    })
  }

  var saved = read(KEY)
  if (saved && LANGS.indexOf(saved) !== -1) {
    // Honour a previous explicit choice, but never loop.
    if (saved !== pageLang) location.replace(urlFor(saved))
    return
  }

  // No stored choice: suggest, based on the browser's languages, once.
  if (read(KEY + '-dismissed')) return
  var wanted = null
  var prefs = navigator.languages || [navigator.language || '']
  for (var j = 0; j < prefs.length && !wanted; j++) {
    var code = String(prefs[j]).slice(0, 2).toLowerCase()
    if (LANGS.indexOf(code) !== -1 && code !== pageLang) wanted = code
    // A browser that prefers the page's own language ends the search.
    else if (code === pageLang) break
  }
  if (!wanted) return

  var copy = COPY[wanted]
  var bar = document.createElement('div')
  bar.className = 'lang-banner'
  bar.setAttribute('role', 'region')
  bar.setAttribute('lang', wanted)
  bar.innerHTML =
    '<span>' + copy.text + '</span>' +
    '<a class="lang-banner-go" href="' + urlFor(wanted) + '">' + copy.go + '</a>' +
    '<button type="button" class="lang-banner-x" aria-label="' + copy.close + '">✕</button>'

  bar.querySelector('.lang-banner-go').addEventListener('click', function () {
    write(KEY, wanted)
  })
  bar.querySelector('.lang-banner-x').addEventListener('click', function () {
    write(KEY + '-dismissed', '1')
    bar.remove()
  })
  document.body.insertBefore(bar, document.body.firstChild)
})()
