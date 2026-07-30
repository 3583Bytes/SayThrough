// Attention chime — a short two-tone "doorbell" to get a partner's
// attention without speaking (competitive parity: TD Snap's alert bell).
// Phase 1 is web, so this uses the Web Audio API; native builds (Phase 2)
// will play a bundled sound via expo-audio. No-ops where audio is absent.
export function playAttentionChime(): void {
  if (typeof window === 'undefined') return
  const Ctx: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctx) return
  try {
    const ctx = new Ctx()
    const start = ctx.currentTime
    // A5 → E6, a friendly ascending chime
    ;[880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t0 = start + i * 0.18
      const t1 = t0 + 0.16
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(0.5, t0 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t1)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t0)
      osc.stop(t1 + 0.02)
    })
    setTimeout(() => {
      ctx.close().catch(() => {})
    }, 700)
  } catch {
    // audio unavailable — silently ignore
  }
}
