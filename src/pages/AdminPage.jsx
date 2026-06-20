import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import EvidenceCard from '../components/EvidenceCard.jsx'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'lore2024'

function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const [guests, setGuests] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [missions, setMissions] = useState([])
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const navigate = useNavigate()

  useEffect(() => {
    const saved = sessionStorage.getItem('lore_admin_authed')
    if (saved === 'true') setAuthed(true)
  }, [])

  useEffect(() => {
    if (authed) fetchData()
  }, [authed])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('lore_admin_authed', 'true')
      setAuthed(true)
    } else {
      setAuthError('Wrong password. Try again.')
    }
  }

  const fetchData = async () => {
    setLoading(true)
    const EVENT_CODE = import.meta.env.VITE_EVENT_CODE || 'ATE2024'

    const [evtRes, guestRes, subRes, missionRes] = await Promise.all([
      supabase.from('events').select('*').eq('code', EVENT_CODE).single(),
      supabase.from('guests').select('*, missions(title)').order('created_at'),
      supabase.from('submissions').select('*, guests(name), missions(title)').order('created_at', { ascending: false }),
      supabase.from('missions').select('*'),
    ])

    setEvent(evtRes.data)
    setGuests(guestRes.data || [])
    setSubmissions(subRes.data || [])
    setMissions(missionRes.data || [])
    setLoading(false)
  }

  const updateSubmissionStatus = async (id, status) => {
    await supabase.from('submissions').update({ status }).eq('id', id)
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  const reassignMission = async (guestId, missionId) => {
    await supabase.from('guests').update({ assigned_mission_id: missionId }).eq('id', guestId)
    fetchData()
  }

  const publishRecap = async () => {
    if (!event) return
    setPublishing(true)
    await supabase.from('events').update({ recap_published: true }).eq('id', event.id)
    setEvent(prev => ({ ...prev, recap_published: true }))
    setPublishing(false)
    navigate('/recap')
  }

  const toggleEventActive = async () => {
    if (!event) return
    await supabase.from('events').update({ is_active: !event.is_active }).eq('id', event.id)
    setEvent(prev => ({ ...prev, is_active: !prev.is_active }))
  }

  // ---- AUTH GATE ----
  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--amber)' }}>
              Lore
            </div>
            <div className="text-dim text-small" style={{ marginTop: 4 }}>Host Access</div>
          </div>

          <form onSubmit={handleLogin} className="card">
            {authError && <div className="error-box">{authError}</div>}
            <div className="form-group">
              <label className="label">Admin Password</label>
              <input
                type="password"
                className="input"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Enter Dashboard
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ---- LOADING ----
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading the command center...</span>
      </div>
    )
  }

  const completedCount = guests.filter(g => submissions.some(s => s.guest_id === g.id)).length
  const pendingCount = submissions.filter(s => s.status === 'pending').length

  return (
    <div style={{ minHeight: '100vh', maxWidth: 600, margin: '0 auto', padding: '24px 20px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: 'var(--amber)' }}>
            Host Dashboard
          </div>
          <div className="text-small text-dim">Mission: ATE</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn btn-sm ${event?.is_active ? 'btn-secondary' : 'btn-primary'}`}
            onClick={toggleEventActive}
          >
            {event?.is_active ? '🔴 Live' : '⚫ Ended'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-grid">
        <div className="admin-stat">
          <div className="admin-stat-num">{guests.length}</div>
          <div className="admin-stat-label">Guests</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">{submissions.length}</div>
          <div className="admin-stat-label">Submissions</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">{completedCount}</div>
          <div className="admin-stat-label">Completed</div>
        </div>
      </div>

      {/* Mission Accomplished CTA */}
      <div className="card card-amber" style={{ textAlign: 'center', marginBottom: 24 }}>
        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>
          Ready to close the night?
        </p>
        <p className="text-small text-dim" style={{ marginBottom: 16 }}>
          This will publish the recap and make the lore canon.
        </p>
        <button
          className="btn btn-primary"
          onClick={publishRecap}
          disabled={publishing}
          style={{ maxWidth: 280, margin: '0 auto' }}
        >
          {publishing ? '🔮 Publishing...' : '🏆 Mission Accomplished'}
        </button>
        {event?.recap_published && (
          <div style={{ marginTop: 12 }}>
            <a href="/recap" className="text-amber text-small">View Recap →</a>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['overview', 'Guests'], ['submissions', 'Submissions'], ['missions', 'Missions']].map(([tab, label]) => (
          <button
            key={tab}
            className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab(tab)}
          >
            {label}
            {tab === 'submissions' && pendingCount > 0 && (
              <span style={{
                background: 'var(--red)',
                borderRadius: '999px',
                padding: '1px 6px',
                fontSize: '0.7rem',
                marginLeft: 4,
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Guests tab */}
      {activeTab === 'overview' && (
        <div className="admin-row">
          {guests.length === 0 && (
            <div className="empty-state">
              <div className="icon">👥</div>
              <p>No guests yet. Share the link!</p>
            </div>
          )}
          {guests.map(guest => {
            const guestSubs = submissions.filter(s => s.guest_id === guest.id)
            return (
              <div key={guest.id} className="admin-guest-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="admin-guest-name">{guest.name}</div>
                    <div className="text-small text-dim" style={{ marginBottom: 8 }}>
                      {guest.missions?.title || 'No mission assigned'}
                    </div>
                    <span className={`badge ${guestSubs.length > 0 ? 'badge-green' : 'badge-dim'}`}>
                      {guestSubs.length > 0 ? `✦ ${guestSubs.length} submission${guestSubs.length > 1 ? 's' : ''}` : 'No submission yet'}
                    </span>
                  </div>
                  {/* Reassign mission */}
                  <select
                    className="input"
                    style={{ width: 'auto', fontSize: '0.8rem', padding: '6px 10px' }}
                    value={guest.assigned_mission_id || ''}
                    onChange={e => reassignMission(guest.id, e.target.value)}
                  >
                    <option value="">Reassign...</option>
                    {missions.map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Submissions tab */}
      {activeTab === 'submissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {submissions.length === 0 && (
            <div className="empty-state">
              <div className="icon">📭</div>
              <p>No submissions yet.</p>
            </div>
          )}
          {submissions.map(s => (
            <EvidenceCard
              key={s.id}
              submission={s}
              showActions
              onApprove={(id) => updateSubmissionStatus(id, 'approved')}
              onReject={(id) => updateSubmissionStatus(id, 'rejected')}
            />
          ))}
        </div>
      )}

      {/* Missions tab */}
      {activeTab === 'missions' && (
        <div className="admin-row">
          {missions.map(m => {
            const assignedGuest = guests.find(g => g.assigned_mission_id === m.id)
            const subCount = submissions.filter(s => s.mission_id === m.id).length
            return (
              <div key={m.id} className="admin-guest-card">
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 4 }}>
                  {m.title}
                </div>
                <p className="text-small text-dim" style={{ marginBottom: 8 }}>{m.description}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {assignedGuest && (
                    <span className="badge badge-amber">👤 {assignedGuest.name}</span>
                  )}
                  <span className={`badge ${subCount > 0 ? 'badge-green' : 'badge-dim'}`}>
                    {subCount} proof{subCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AdminPage
