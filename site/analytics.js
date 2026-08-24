// Usage counting for SayThrough.
//
// Sends ONE thing: which of a handful of named events happened. No id, no
// cookie, no session, no referrer, nothing typed, nothing about who you are.
// The server keeps counts and cannot reconstruct an individual from them —
// see stats-service/index.js.
//
// It reports to stats.saythrough.com rather than a separate domain because
// school districts whitelist by domain; a different host would simply be
// blocked on the networks this app is built for.
(function () {
  'use strict'

  var ENDPOINT = 'https://stats.saythrough.com'

  var nav = window.navigator
  if (
    nav.doNotTrack === '1' ||
    window.doNotTrack === '1' ||
    nav.msDoNotTrack === '1' ||
    nav.globalPrivacyControl === true
  ) return

  // Honour the app's own opt-out, so one switch covers both surfaces.
  try {
    if (localStorage.getItem('saythrough-usage-counting') === 'off') return
  } catch (e) {
    /* storage disabled — carry on, there is nothing to remember anyway */
  }

  function send(event, pagePath) {
    var body = JSON.stringify(pagePath ? { event: event, path: pagePath } : { event: event })
    try {
      if (nav.sendBeacon) {
        nav.sendBeacon(ENDPOINT + '/event', new Blob([body], { type: 'application/json' }))
        return
      }
    } catch (e) {
      /* fall through to fetch */
    }
    fetch(ENDPOINT + '/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
      keepalive: true,
    }).catch(function () {
      // Counting a visit is never worth breaking a page over.
    })
  }

  // Only the known marketing paths are ever reported; the server drops
  // anything else regardless, but there is no reason to send it.
  var KNOWN = ['/', '/guides/', '/guides/quick-start/', '/guides/what-is-aac/', '/404']
  var here = location.pathname
  send('pageview', KNOWN.indexOf(here) === -1 ? undefined : here)

  window.saythroughCount = send
})()
