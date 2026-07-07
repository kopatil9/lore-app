import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { backgrounds, fallbackGradients } from '../assets/backgrounds.js'

function MissionPage() {
  const [mission, setMission] = useState(null)
  const [guestName, setGuestName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const guestId   = sessionStorage.getItem('lore_guest_id')
    const name      = sessionStorage.getItem('lore_guest_name')
    const missionId = sessionStorage.getItem('lore_mission_id')

    if (!guestId || !missionId) { navigate('/'); return }

    setGuestName(name || 'Agent')

    Promise.all([
      supabase.from('missions').select('*').eq('id', missionId).single(),
      supabase.from('submissions').select('id').eq('guest_id', guestId).eq('mission_id', missionId).limit(1),
    ]).then(([missionRes, submissionRes]) => {
      if (missionRes.error) setError('Could not load your mission. Go back and try again.')
      else setMission(missionRes.data)

      setHasSubmitted(!!(submissionRes.data && submissionRes.data.length > 0))
      setLoading(false)
    })
  }, [navigate])

  const bgStyle = backgrounds.mission
    ? { backgroundImage: `url(${backgrounds.mission})` }
    : { background: fallbackGradients.mission }

  if (loading) {
    return (
      <div className="photo-screen">
        <div className="photo-screen-bg" style={bgStyle} />
        <div className="photo-screen-overlay" />
        <div className="photo-screen-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="photo-screen">
      <div className="photo-screen-bg" style={bgStyle} />
      <div className="photo-screen-overlay" />

      <div
        className="photo-screen-content"
        style={{ justifyContent: 'flex-end', padding: '0 24px calc(44px + env(safe-area-inset-bottom))' }}
      >
        <p style={{
          textAlign: 'center',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)',
          marginBottom: 14,
        }}>
          hey {guestName} ✦
        </p>

        {mission && (
          <div className="mission-card-glass" style={{ marginBottom: 20 }}>
            <p style={{
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 10,
              fontWeight: 700,
            }}>
              {guestName}'s mission
            </p>
            <h2 style={{
              fontSize: '1.55rem',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: 12,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              {mission.title}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.92rem', lineHeight: 1.65 }}>
              {mission.description}
            </p>
          </div>
        )}

        {error && <div className="error-glass" style={{ marginBottom: 14 }}>{error}</div>}

        {hasSubmitted ? (
          <div
            style={{
              width: '100%',
              padding: '17px 28px',
              borderRadius: 999,
              background: 'rgba(76,175,125,0.18)',
              border: '1.5px solid rgba(76,175,125,0.45)',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span style={{
              display: 'inline-flex', width: 20, height: 20, borderRadius: '50%',
              background: '#4CAF7D', color: 'white', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.72rem', fontWeight: 800,
            }}>✓</span>
            Mission Complete
          </div>
        ) : (
          <button
            className="btn-pill"
            onClick={() => navigate('/submit')}
            style={{ marginBottom: 10 }}
          >
            I Accept the Mission
          </button>
        )}

        <button className="btn-glass" onClick={() => navigate('/board')}>
          view evidence board
        </button>

        {hasSubmitted && (
          <button
            type="button"
            onClick={() => navigate('/submit')}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)',
              fontSize: '0.82rem', cursor: 'pointer', marginTop: 12,
              padding: 0, fontFamily: 'inherit', textAlign: 'center', width: '100%',
            }}
          >
            submit more proof
          </button>
        )}

        <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
          no proof, no lore.
        </p>
      </div>
    </div>
  )
}

export default MissionPage
