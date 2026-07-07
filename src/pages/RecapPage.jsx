import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { backgrounds, fallbackGradients } from '../assets/backgrounds.js'

const EVENT_CODE = import.meta.env.VITE_EVENT_CODE || 'KOTWENTYATE'

function RecapPage() {
  const [submissions, setSubmissions] = useState([])
  const [guestCount, setGuestCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => { fetchRecap() }, [])

  const fetchRecap = async () => {
    const evtRes = await supabase.from('events').select('*').eq('code', EVENT_CODE).single()
    const eventId = evtRes.data?.id
    const [subRes, guestRes] = await Promise.all([
      supabase.from('submissions')
        .select('*, guests(name), missions(title, description)')
        .eq('status', 'approved')
        .order('created_at', { ascending: true }),
      supabase.from('guests').select('id').eq('event_id', eventId),
    ])
    setSubmissions(subRes.data || [])
    setGuestCount(guestRes.data?.length || 0)
    setLoading(false)
  }

  const shareUrl = window.location.href
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const bgStyle = backgrounds.recap
    ? { backgroundImage: `url(${backgrounds.recap})` }
    : { background: fallbackGradients.recap }

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

  const uniqueGuests = [...new Set(submissions.map(s => s.guests?.name))].filter(Boolean)

  return (
    <div style={{ minHeight: '100vh', background: '#1E1E2E' }}>
      {/* Hero — full bleed photo with overlay, like landing */}
      <div className="photo-screen" style={{ minHeight: '100vh', maxHeight: '100vh', position: 'relative', flexShrink: 0 }}>
        <div className="photo-screen-bg" style={bgStyle} />
        <div className="photo-screen-overlay" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.75) 80%, rgba(30,30,46,1) 100%)' }} />

        <div className="photo-screen-content" style={{ justifyContent: 'flex-end', padding: '0 24px calc(48px + env(safe-area-inset-bottom))' }}>

          {/* Checkmark circle */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7AB8E8, #9B8FD8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '2rem', color: 'white',
              boxShadow: '0 8px 32px rgba(107,115,232,0.5)',
            }}>✓</div>

            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2rem', color: 'white', marginBottom: 6, textShadow: '0 2px 12px rgba(0,0,0,0.4)', letterSpacing: '-0.02em' }}>
              mission<br />accomplished.
            </h1>
            <p style={{ color: 'rgba(180,160,255,0.9)', fontStyle: 'italic', fontWeight: 600, fontSize: '0.95rem', marginBottom: 8 }}>
              KO TWENTY ATE ♡
            </p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 24 }}>
              real moments.<br />real proof.<br />real memories.
            </p>
          </div>

          {/* Share recap pill button */}
          <button className="btn-pill" onClick={copyLink} style={{ marginBottom: 12 }}>
            {copied ? '✓ link copied!' : 'share recap'}
          </button>

          {/* View all missions text link */}
          <button
            className="btn-text-link"
            onClick={() => document.getElementById('reel')?.scrollIntoView({ behavior: 'smooth' })}
          >
            view all missions
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', background: '#252535', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { num: guestCount, label: 'Agents' },
          { num: submissions.length, label: 'Proofs' },
          { num: uniqueGuests.length, label: 'Memories' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', padding: '18px 0', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.9rem', fontWeight: 800, color: 'white' }}>{s.num}</div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Reel */}
      <div id="reel" style={{ background: '#1E1E2E' }}>
        {submissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'rgba(255,255,255,0.35)' }}>
            <p style={{ fontSize: '2rem', marginBottom: 12 }}>📭</p>
            <p>No submissions yet.</p>
          </div>
        ) : (
          submissions.map((s, i) => (
            <div key={s.id} style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 24, right: 20, fontFamily: 'Syne, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.04)', lineHeight: 1 }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.15rem', color: 'white', marginBottom: 2 }}>{s.guests?.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(180,160,255,0.85)', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>{s.missions?.title}</div>
              {s.media_url && (
                <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 10, background: 'rgba(255,255,255,0.05)' }}>
                  {s.media_type?.startsWith('video/') ? (
                    <video src={s.media_url} controls playsInline preload="metadata" style={{ width: '100%', display: 'block', maxHeight: 360, objectFit: 'cover' }} />
                  ) : (
                    <img src={s.media_url} alt="" loading="lazy" style={{ width: '100%', display: 'block', maxHeight: 360, objectFit: 'cover' }} />
                  )}
                </div>
              )}
              {s.caption && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', fontStyle: 'italic', lineHeight: 1.5 }}>"{s.caption}"</p>}
              <div style={{ marginTop: 10 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(180,160,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Lore Added</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* End card */}
      <div style={{ background: '#1E1E2E', textAlign: 'center', padding: '52px 24px 72px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7AB8E8, #9B8FD8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: '1.5rem', color: 'white',
          boxShadow: '0 6px 20px rgba(107,115,232,0.4)',
        }}>✓</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'white', marginBottom: 6 }}>the lore is canon.</h2>
        <p style={{ color: 'rgba(180,160,255,0.8)', fontStyle: 'italic', marginBottom: 20, fontWeight: 600 }}>KO TWENTY ATE ♡</p>
        <button className="btn-pill" onClick={copyLink} style={{ maxWidth: 260, margin: '0 auto', display: 'flex' }}>
          {copied ? '✓ copied!' : 'share recap'}
        </button>
      </div>
    </div>
  )
}

export default RecapPage
