import { useEffect, useRef } from 'react'

export function StudentQuizShell({ children, backgroundImage, centerContent = false }) {
  const style = backgroundImage
    ? {
        background: `url(${backgroundImage}) center / cover no-repeat`,
        backgroundAttachment: 'fixed',
        backgroundColor: 'transparent',
      }
    : undefined

  return (
    <main
      data-student-quiz
      className={`sq-container${centerContent ? ' sq-container-center' : ''}`}
      style={style}
    >
      {children}
    </main>
  )
}

export function LogoBadge() {
  return (
    <div className="sq-logo-badge clay-element">
      <img src="/logo.avif" alt="QuizForm" className="size-5" />
      <span className="text-base font-semibold">QuizForm</span>
    </div>
  )
}

export function StudentQuizLoading() {
  return (
    <div className="sq-step-enter absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
      <i className="ti ti-loader-2 sq-spin " style={{ fontSize: '1.5rem', color: 'var(--sq-accent)' }} aria-hidden="true" />
      <p className="sq-muted" style={{ marginTop: '0.75rem', marginBottom: 0 }}>Loading quiz…</p>
    </div>
  )
}

export function StudentQuizNotStarted({ title, startAt, startAtMs, onReachedStart }) {
  const daysGroupRef = useRef(null)
  const daysHundredsHostRef = useRef(null)
  const daysTensHostRef = useRef(null)
  const daysOnesHostRef = useRef(null)

  const hoursTensHostRef = useRef(null)
  const hoursOnesHostRef = useRef(null)

  const minutesTensHostRef = useRef(null)
  const minutesOnesHostRef = useRef(null)

  const secondsTensHostRef = useRef(null)
  const secondsOnesHostRef = useRef(null)

  const ticksRef = useRef({
    dH: null,
    dT: null,
    dO: null,
    hT: null,
    hO: null,
    mT: null,
    mO: null,
    sT: null,
    sO: null,
  })
  const counterRef = useRef(null)

  useEffect(() => {
    if (
      !daysGroupRef.current ||
      !daysHundredsHostRef.current ||
      !daysTensHostRef.current ||
      !daysOnesHostRef.current ||
      !hoursTensHostRef.current ||
      !hoursOnesHostRef.current ||
      !minutesTensHostRef.current ||
      !minutesOnesHostRef.current ||
      !secondsTensHostRef.current ||
      !secondsOnesHostRef.current
    ) {
      return
    }
    if (typeof startAtMs !== 'number' || !Number.isFinite(startAtMs)) return

    // Module import path for Tick differs per bundler; @pqina/flip also exposes Tick as default export.
    // We'll lazily import it here to avoid bundler interop issues.
    let cancelled = false

    ;(async () => {
      const mod = await import('@pqina/flip')
      if (cancelled) return
      const TickMod = mod?.default ?? mod
      if (!TickMod?.DOM?.create || !TickMod?.count?.down) return

      const createDigitTick = () =>
        TickMod.DOM.create({
          credits: false,
          value: '0',
          view: {
            children: [
              {
                view: 'flip',
              },
            ],
          },
        })

      const dH = createDigitTick()
      const dT = createDigitTick()
      const dO = createDigitTick()
      const hT = createDigitTick()
      const hO = createDigitTick()
      const mT = createDigitTick()
      const mO = createDigitTick()
      const sT = createDigitTick()
      const sO = createDigitTick()

      daysHundredsHostRef.current.replaceChildren(dH.root)
      daysTensHostRef.current.replaceChildren(dT.root)
      daysOnesHostRef.current.replaceChildren(dO.root)
      hoursTensHostRef.current.replaceChildren(hT.root)
      hoursOnesHostRef.current.replaceChildren(hO.root)
      minutesTensHostRef.current.replaceChildren(mT.root)
      minutesOnesHostRef.current.replaceChildren(mO.root)
      secondsTensHostRef.current.replaceChildren(sT.root)
      secondsOnesHostRef.current.replaceChildren(sO.root)

      ticksRef.current = { dH, dT, dO, hT, hO, mT, mO, sT, sO }

      // Count down to quiz start.
      const targetIso = new Date(startAtMs).toISOString()
      counterRef.current = TickMod.count.down(targetIso, { format: ['d', 'h', 'm', 's'], interval: 1000 })

      counterRef.current.onupdate = (value) => {
        // value is [days, hours, minutes, seconds]
        const d = Number(value?.[0] ?? 0)
        const h = Number(value?.[1] ?? 0)
        const m = Number(value?.[2] ?? 0)
        const s = Number(value?.[3] ?? 0)

        const days = Math.max(0, d)
        const showHundreds = days >= 100
        daysGroupRef.current?.classList.toggle('sq-days-hundreds-hidden', !showHundreds)

        const ddd = String(Math.min(999, days)).padStart(3, '0')
        const hh = String(Math.max(0, h)).padStart(2, '0')
        const mm = String(Math.max(0, m)).padStart(2, '0')
        const ss = String(Math.max(0, s)).padStart(2, '0')

        const ticks = ticksRef.current
        if (ticks.dH) ticks.dH.value = ddd[0]
        if (ticks.dT) ticks.dT.value = ddd[1]
        if (ticks.dO) ticks.dO.value = ddd[2]
        if (ticks.hT) ticks.hT.value = hh[0]
        if (ticks.hO) ticks.hO.value = hh[1]
        if (ticks.mT) ticks.mT.value = mm[0]
        if (ticks.mO) ticks.mO.value = mm[1]
        if (ticks.sT) ticks.sT.value = ss[0]
        if (ticks.sO) ticks.sO.value = ss[1]
      }

      counterRef.current.onended = () => {
        if (typeof onReachedStart === 'function') onReachedStart()
      }
    })()

    return () => {
      cancelled = true
      try { counterRef.current?.stop?.() } catch {}
      counterRef.current = null

      const ticks = ticksRef.current
      try { ticks.dH?.destroy?.() } catch {}
      try { ticks.dT?.destroy?.() } catch {}
      try { ticks.dO?.destroy?.() } catch {}
      try { ticks.hT?.destroy?.() } catch {}
      try { ticks.hO?.destroy?.() } catch {}
      try { ticks.mT?.destroy?.() } catch {}
      try { ticks.mO?.destroy?.() } catch {}
      try { ticks.sT?.destroy?.() } catch {}
      try { ticks.sO?.destroy?.() } catch {}
      ticksRef.current = { dH: null, dT: null, dO: null, hT: null, hO: null, mT: null, mO: null, sT: null, sO: null }

      try { daysHundredsHostRef.current?.replaceChildren() } catch {}
      try { daysTensHostRef.current?.replaceChildren() } catch {}
      try { daysOnesHostRef.current?.replaceChildren() } catch {}
      try { hoursTensHostRef.current?.replaceChildren() } catch {}
      try { hoursOnesHostRef.current?.replaceChildren() } catch {}
      try { minutesTensHostRef.current?.replaceChildren() } catch {}
      try { minutesOnesHostRef.current?.replaceChildren() } catch {}
      try { secondsTensHostRef.current?.replaceChildren() } catch {}
      try { secondsOnesHostRef.current?.replaceChildren() } catch {}
    }
  }, [startAtMs, onReachedStart])

  return (
    <div className="sq-card sq-step-enter clay-element" style={{ textAlign: 'center' }}>
      <i className="ti ti-clock" style={{ fontSize: '2rem', color: 'var(--sq-accent)', marginBottom: '0.75rem', display: 'block' }} aria-hidden="true" />
      <h1 className="sq-title" style={{ textAlign: 'center' }}>{title}</h1>
      <p className="sq-muted">This quiz has not started yet.</p>
      <p className="sq-muted">Opens at <strong style={{ color: 'var(--sq-text)' }}>{startAt}</strong></p>

      <div className="sq-flip-countdown-wrap">
        <div className="sq-flip-countdown" aria-label="Countdown to quiz start">
          <div className="sq-flip-unit-col">
            <div ref={daysGroupRef} className="sq-flip-digits sq-days-hundreds-hidden">
              <div ref={daysHundredsHostRef} />
              <div ref={daysTensHostRef} />
              <div ref={daysOnesHostRef} />
            </div>
            <div className="sq-flip-unit-label">days</div>
          </div>
          <div className="sq-flip-unit-col">
            <div className="sq-flip-digits">
              <div ref={hoursTensHostRef} />
              <div ref={hoursOnesHostRef} />
            </div>
            <div className="sq-flip-unit-label">hours</div>
          </div>
          <div className="sq-flip-unit-col">
            <div className="sq-flip-digits">
              <div ref={minutesTensHostRef} />
              <div ref={minutesOnesHostRef} />
            </div>
            <div className="sq-flip-unit-label">minutes</div>
          </div>
          <div className="sq-flip-unit-col">
            <div className="sq-flip-digits">
              <div ref={secondsTensHostRef} />
              <div ref={secondsOnesHostRef} />
            </div>
            <div className="sq-flip-unit-label">seconds</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function StudentQuizClosed({ title }) {
  return (
    <div className="sq-card sq-step-enter clay-element" style={{ textAlign: 'center' }}>
      <i className="ti ti-lock" style={{ fontSize: '2rem', color: 'var(--sq-text-muted)', marginBottom: '0.75rem', display: 'block' }} aria-hidden="true" />
      <h1 className="sq-title" style={{ textAlign: 'center' }}>{title ?? 'Quiz'}</h1>
      <p className="sq-muted" style={{ marginBottom: 0 }}>This quiz is not available - it may be closed or the link is invalid.</p>
    </div>
  )
}

export function StudentQuizPaused({ title }) {
  return (
    <div className="sq-card sq-step-enter clay-element" style={{ textAlign: 'center' }}>
      <i className="ti ti-player-pause" style={{ fontSize: '2rem', color: 'var(--sq-warn)', marginBottom: '0.75rem', display: 'block' }} aria-hidden="true" />
      <h1 className="sq-title" style={{ textAlign: 'center' }}>{title ?? 'Quiz'}</h1>
      <p style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--sq-text)' }}>Quiz Paused</p>
      <p className="sq-muted" style={{ marginBottom: 0 }}>This quiz has been temporarily paused by the teacher. Please wait and try again later.</p>
    </div>
  )
}

export function StudentQuizCompletedNotice({ title, completedNotice }) {
  return (
    <div className="sq-card sq-step-enter clay-element" style={{ textAlign: 'center' }}>
      <i className="ti ti-circle-check" style={{ fontSize: '2rem', color: 'var(--sq-success)', marginBottom: '0.75rem', display: 'block' }} aria-hidden="true" />
      <h1 className="sq-title" style={{ textAlign: 'center' }}>{title}</h1>
      <p className="sq-muted">This quiz attempt is already completed.</p>
      <p className="sq-muted" style={{ marginBottom: 0 }}>{completedNotice || 'You have already submitted this quiz and cannot start it again.'}</p>
    </div>
  )
}

export function StudentQuizSubmitting() {
  return (
    <div className="sq-card sq-step-enter clay-element" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
      <i className="ti ti-loader-2 sq-spin" style={{ fontSize: '2rem', color: 'var(--sq-accent)' }} aria-hidden="true" />
      <p style={{ fontWeight: 600, marginTop: '0.85rem', marginBottom: '0.25rem' }}>Submitting your answers...</p>
      <p className="sq-muted" style={{ marginBottom: 0 }}>Hang tight - your results will appear in a moment.</p>
    </div>
  )
}
