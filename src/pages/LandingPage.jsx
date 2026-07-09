import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { isLocked, unlockLabel } from '../lib/lock.js'
import landingBg from '../assets/landing-bg.png'

const EVENT_CODE = import.meta.env.VITE_EVENT_CODE || 'KOTWENTYATE'

function normalizeName(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}


function LandingPage() {
  const [step, setStep] = useState('home')   // 'home' | 'name'
  const [intent, setIntent] = useState(null) // 'mission' | 'give'
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const openNameStep = (selectedIntent) => {
    setIntent(selectedIntent)
    setError('')
    setName('')
    setStep('name')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    const typedName = normalizeName(name)
    if (!typedName) {
      setError('Enter your name to continue.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: event, error: eventErr } = await supabase
        .from('events')
        .select('*')
        .eq('code', EVENT_CODE)
        .maybeSingle()

      if (eventErr) throw eventErr
      if (!event) throw new Error('Event not found yet. Ask Komal to set it up.')
      if (!event.is_active) throw new Error('This party has ended. The lore is already canon.')

      const { data: guests, error: guestErr } = await supabase
        .from('guests')
        .select('id, name, assigned_mission_id')
        .eq('event_id', event.id)

      if (guestErr) throw guestErr

      const matchedGuest = (guests || []).find(
        (g) => normalizeName(g.name) === typedName
      )

      if (!matchedGuest) {
        throw new Error("Hmm I don't see you on the lore list — try your full name or ask Komal.")
      }

      sessionStorage.setItem('lore_event_id', event.id)
      sessionStorage.setItem('lore_guest_id', matchedGuest.id)
      sessionStorage.setItem('lore_guest_name', matchedGuest.name)
      if (matchedGuest.assigned_mission_id) {
        sessionStorage.setItem('lore_mission_id', matchedGuest.assigned_mission_id)
      }

      if (intent === 'give') {
        navigate('/give-mission')
      } else {
        // 'mission' intent — locked until unlock_at
        if (isLocked(event)) {
          throw new Error(`Missions unlock ${unlockLabel(event)}. You can still send Komal a mission until then!`)
        }
        if (!matchedGuest.assigned_mission_id) {
          throw new Error("Your mission hasn't been assigned yet. Ask Komal!")
        }
        navigate('/mission')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="kta-scroll">
      <div className="kta-stage">
        {/* Full design image as background */}
        <img src={landingBg} alt="Ko Twenty Ate" className="kta-stage-bg" draggable={false} />

        {/* Real "host" button (top-right) — always visible even if the image crops */}
        <button
          type="button"
          className="kta-host-btn"
          onClick={() => navigate('/admin')}
        >
          host
        </button>

        {step === 'home' && (
          <div className="kta-bottom">
            <button
              type="button"
              className="kta-btn-primary"
              onClick={() => openNameStep('mission')}
            >
              Get My Mission
            </button>
            <button
              type="button"
              className="kta-btn-secondary"
              onClick={() => openNameStep('give')}
            >
              Give Komal a Mission
            </button>
          </div>
        )}

        {/* Name entry panel — appears after tapping a button */}
        {step === 'name' && (
          <div className="kta-name-overlay">
            <form className="kta-name-card" onSubmit={handleSubmit}>
              <p className="kta-name-title">
                {intent === 'give' ? "Who's sending this?" : 'Your mission is waiting.'}
              </p>
              <p className="kta-name-hint">
                {intent === 'give'
                  ? 'enter your name so Komal knows who to blame'
                  : 'enter your name exactly as Komal has it'}
              </p>

              <input
                type="text"
                className="kta-input"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError('') }}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
                maxLength={50}
              />

              {error && <div className="kta-error">{error}</div>}

              <button type="submit" className="btn-pill kta-continue" disabled={loading || !name.trim()}>
                {loading ? 'one sec…' : 'Continue'}
              </button>

              <button
                type="button"
                className="kta-back-link"
                onClick={() => { setStep('home'); setError(''); setName('') }}
              >
                back
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default LandingPage
