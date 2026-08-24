// Visitor counting for the SayThrough MARKETING PAGES only.
//
// Deliberately not loaded by the app at /app/. The app promises that nothing
// leaves the device, its users are largely children with disabilities, and it
// is built as a single-domain PWA precisely so school districts can whitelist
// one host — a cross-domain ping from inside the app would break all three,
// and would be filtered out on school networks anyway.
//
// What this sends: a random per-tab id and the page path. No cookies, no
// persistent identifier, nothing about who the visitor is. The id lives in
// sessionStorage, so it is gone when the tab closes and never links one visit
// to the next.
(function () {
  'use strict'

  var ENDPOINT = 'https://dashboard.3583bytes.com'
  var APP_NAME = 'SayThrough'
  var INTERVAL_MS = 60 * 1000 // service treats a visitor as gone after 5 min

  // Honour Do Not Track / Global Privacy Control, and never run on the app.
  var nav = window.navigator
  if (
    nav.doNotTrack === '1' ||
    window.doNotTrack === '1' ||
    nav.msDoNotTrack === '1' ||
    nav.globalPrivacyControl === true
  ) return
  if (location.pathname.indexOf('/app') === 0) return
  if (!window.crypto || !window.crypto.subtle) return // needs a secure context

  function visitorId() {
    try {
      var existing = sessionStorage.getItem('presence-id')
      if (existing) return existing
      var bytes = new Uint8Array(8)
      crypto.getRandomValues(bytes)
      var id = 'web-'
      for (var i = 0; i < bytes.length; i++) {
        id += bytes[i].toString(16).padStart(2, '0')
      }
      sessionStorage.setItem('presence-id', id)
      return id
    } catch (e) {
      return null // private mode with storage disabled — just don't count
    }
  }

  function sha256Hex(value) {
    var data = new TextEncoder().encode(value)
    return crypto.subtle.digest('SHA-256', data).then(function (buffer) {
      var out = ''
      var view = new Uint8Array(buffer)
      for (var i = 0; i < view.length; i++) {
        out += view[i].toString(16).padStart(2, '0')
      }
      return out
    })
  }

  var id = visitorId()
  if (!id) return

  function beat() {
    // Only while the tab is actually visible, so a forgotten background tab
    // does not inflate the "online now" number all day.
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
        // Counting a visitor is never worth breaking a page over.
      })
  }

  beat()
  setInterval(beat, INTERVAL_MS)
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') beat()
  })
})()
