import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

const EVENT_CODE = import.meta.env.VITE_EVENT_CODE || 'ATE2024'

function RecapPage() {
  const [submissions, setSubmissions] = useState([])
  const [event, setEvent] = useState(null)
  const [guestCount, setGuestCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchRecap()
  }, [])

  const fetchRecap = async () => {
    const [evtRes, subRes, guestRes] = await Promise.all([
      supabase.from('events').select('*').eq('code', EVENT_CODE).single(),
      supabase
        .from('submissions')
        .select('*, guests(name), missions(title, description)')
        .eq('status', 'approved')
        .order('created_at', { ascending: true }),
      supabase.from('guests').select('id').eq('event_id',
        (await supabase.from('events').select('id').eq('code', EVENT_CODE).single()).data?.id
      ),
    ])

    setEvent(evtRes.data)
    setSubmissions(subRes.data || [])
    setGuestCount(guestRes.data?.length || 0)
    setLoading(false)
  }

  const shareUrl = window.location.href

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Assembling the lore reel...</span>
      </div>
    )
  }

  const uniqueGuests = [...new Set(submissions.map(s => s.guests?.name))].filter(Boolean)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Hero */}
      <div className="recap-hero">
        <div className="recap-event-title">✦ The Lore Reel ✦</div>
        <h1 className="recap-headline">Mission: ATE</h1>
        <p className="recap-tagline">The lore is canon.</p>
      </div>

      {/* Stats bar */}
      <div className="recap-stats">
        <div className="recap-stat">
          <span className="recap-stat-num">{guestCount}</span>
          <span className="recap-stat-label">Agents</span>
        </div>
        <div className="recap-stat">
          <span className="recap-stat-num">{submissions.length}</span>
          <span className="recap-stat-label">Submissions</span>
        </div>
        <div className="recap-stat">
          <span className="recap-stat-num">{uniqueGuests.length}</span>
          <span className="recap-stat-label">Missions Logged</span>
        </div>
      </div>

      {/* Share bar */}
      <div style={{ padding: '0 24px 24px', maxWidth: 600, margin: '0 auto' }}>
        <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            className="input"
            readOnly
            value={shareUrl}
            style={{ flex: 1, fontSize: '0.8rem' }}
            onClick={e => e.target.select()}
          />
          <button className="btn btn-primary btn-sm" onClick={copyLink} style={{ whiteSpace: 'nowrap' }}>
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Reel */}
      {submissions.length === 0 ? (
        <div className="empty-state" style={{ padding: '80px 24px' }}>
          <div className="icon">📭</div>
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 8 }}>
            No submissions yet
          </p>
          <p className="text-small text-dim">The night is still young.</p>
        </div>
      ) : (
        <div className="recap-reel" style={{ maxWidth: 600, margin: '0 auto' }}>
          {submissions.map((s, i) => (
            <div key={s.id} className="recap-reel-card">
              <div className="recap-reel-num">
                {String(i + 1).padStart(2, '0')}
              </div>

              <div className="recap-reel-guest">{s.guests?.name}</div>
              <div className="recap-reel-mission">{s.missions?.title}</div>

              {s.media_url && (
                <div className="recap-reel-media">
                  {s.media_type?.startsWith('video/') ? (
                    <video
                      src={s.media_url}
                      controls
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={s.media_url}
                      alt={`${s.guests?.name}'s proof`}
                      loading="lazy"
                    />
                  )}
                </div>
              )}

              {s.caption && (
                <p className="recap-reel-caption">"{s.caption}"</p>
              )}

              <div style={{ marginTop: 12 }}>
                <span className="badge badge-amber">✦ Lore Added</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* End screen */}
      <div className="recap-end">
        <div className="recap-end-title">The lore is canon.</div>
        <p className="text-dim" style={{ marginBottom: 32 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '3rem',
            fontWeight: 800,
            color: 'var(--amber)',
            letterSpacing: '-0.03em',
          }}>
            Lore
          </div>
        </div>
        <p className="text-small text-dim" style={{ marginTop: 8, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Mission: ATE
        </p>
      </div>
    </div>
  )
}

export default RecapPage
