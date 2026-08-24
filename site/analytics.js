// Reports to the Presence service so SayThrough shows up alongside the other
// apps on dashboard.3583bytes.com.
//
// The id is random and lives in sessionStorage: it is gone when the tab
// closes and never links one visit to the next. Nothing else is sent — no
// cookie, no referrer, and nothing anyone types or says.
//
// It posts to a different domain because saythrough.com is served by GitHub
// Pages, which is static and returns 405 to any POST. Some school filters
// block unlisted domains, so counts will be low on those networks. Counting
// fails silently there and nothing breaks.
(function () {
  'use strict'

  var ENDPOINT = 'https://dashboard.3583bytes.com'
  var APP_NAME = 'SayThrough Site'
  var INTERVAL_MS = 60 * 1000 // Presence drops a client after 5 minutes

  var nav = window.navigator
  if (
    nav.doNotTrack === '1' ||
    window.doNotTrack === '1' ||
    nav.msDoNotTrack === '1' ||
    nav.globalPrivacyControl === true
  ) return
  if (!window.crypto || !window.crypto.subtle) return // needs a secure context

  try {
    if (localStorage.getItem('saythrough-usage-counting') === 'off') return
  } catch (e) {
    /* storage disabled — nothing to remember anyway */
  }

  function visitorId() {
    try {
      var existing = sessionStorage.getItem('presence-id')
      if (existing) return existing
      var bytes = new Uint8Array(8)
      crypto.getRandomValues(bytes)
      var id = 'web-'
      for (var i = 0; i < bytes.length; i++) id += bytes[i].toString(16).padStart(2, '0')
      sessionStorage.setItem('presence-id', id)
      return id
    } catch (e) {
      return null // private mode with storage disabled — just don't count
    }
  }

  function sha256Hex(value) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then(function (buf) {
      var out = ''
      var view = new Uint8Array(buf)
      for (var i = 0; i < view.length; i++) out += view[i].toString(16).padStart(2, '0')
      return out
    })
  }

  var id = visitorId()
  if (!id) return

  function beat() {
    // Only while the tab is visible, so a forgotten background tab does not
    // sit in the "online now" count all day.
    if (document.visibilityState === 'hidden') return
    sha256Hex(id)
      .then(function (key) {
        return fetch(ENDPOINT + '/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Secret-Key': key },
          body: JSON.stringify({ game_name: APP_NAME, player_id: id }),
          keepalive: true,
        })
      })
      .catch(function () {
        // Counting a visit is never worth breaking a page over.
      })
  }

  beat()
  setInterval(beat, INTERVAL_MS)
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') beat()
  })
})()
