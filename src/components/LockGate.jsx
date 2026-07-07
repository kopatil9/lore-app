import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { isLocked, unlockLabel } from '../lib/lock.js'
import { backgrounds, fallbackGradients } from '../assets/backgrounds.js'

const EVENT_CODE = import.meta.env.VITE_EVENT_CODE || 'KOTWENTYATE'

// Wraps guest-only pages (mission, submit, board) and blocks them
// until the event's unlock_at time. Guests can still go back and
// send Komal a mission from the landing page.
function LockGate({ children }) {
  const [state, setState] = useState('checking') // 'checking' | 'locked' | 'open'
  const [event, setEvent] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Admin/host can always preview, even before unlock.
    if (sessionStorage.getItem('lore_admin_authed') === 'true') {
      setState('open')
      return
    }
    supabase.from('events').select('*').eq('code', EVENT_CODE).maybeSingle()
      .then(({ data }) => {
        setEvent(data || null)
        setState(isLocked(data) ? 'locked' : 'open')
      })
  }, [])

  if (state === 'checking') {
    return (
      <div className="photo-screen">
        <div className="photo-screen-bg" style={{ background: fallbackGradients.mission }} />
        <div className="photo-screen-overlay" />
        <div className="photo-screen-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      </div>
    )
  }

  if (state === 'locked') {
    const bgStyle = backgrounds.mission
      ? { backgroundImage: `url(${backgrounds.mission})` }
      : { background: fallbackGradients.mission }

    return (
      <div className="photo-screen">
        <div className="photo-screen-bg" style={bgStyle} />
        <div className="photo-screen-overlay" />
        <div
          className="photo-screen-content"
          style={{ justifyContent: 'flex-end', padding: '0 24px calc(44px + env(safe-area-inset-bottom))' }}
        >
          <div className="mission-card-glass" style={{ marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: 12 }}>🔒</div>
            <h2 style={{
              fontSize: '1.4rem', fontWeight: 800, color: '#fff',
              marginBottom: 10, letterSpacing: '-0.02em',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              The lore is sealed… for now.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Missions, proof, and the evidence board unlock on
            </p>
            <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, marginTop: 6 }}>
              {unlockLabel(event)}
            </p>
          </div>

          <button className="btn-pill" onClick={() => navigate('/')} style={{ marginBottom: 10 }}>
            ← back to start
          </button>
          <button className="btn-glass" onClick={() => navigate('/give-mission')}>
            Give Komal a mission instead
          </button>

          <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
            come back when it's time.
          </p>
        </div>
      </div>
    )
  }

  return children
}

export default LockGate
