import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { backgrounds, fallbackGradients } from '../assets/backgrounds.js'

const VIBES = [
  { value: '', label: 'Pick a vibe (optional)' },
  { value: 'Wholesome', label: '🌸 Wholesome' },
  { value: 'Chaotic', label: '🌀 Chaotic' },
  { value: 'Flirty', label: '💋 Flirty' },
  { value: 'Main character', label: '🎬 Main character' },
  { value: 'Group activity', label: '🎉 Group activity' },
  { value: 'Dare, but classy', label: '🍸 Dare, but classy' },
]

function GiveMissionPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [vibe, setVibe] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const guestId   = sessionStorage.getItem('lore_guest_id')
  const guestName = sessionStorage.getItem('lore_guest_name')

  // If no guest context (arrived directly), send back to landing
  if (!guestId) {
    navigate('/')
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setError('Give the mission a title.'); return }

    setLoading(true)
    setError('')

    try {
      const { error: dbErr } = await supabase
        .from('komal_missions')
        .insert({
          submitted_by_guest_id: guestId,
          submitted_by_name: guestName || 'Anonymous',
          title: title.trim(),
          description: description.trim() || null,
          vibe: vibe || null,
          status: 'pending',
        })

      if (dbErr) throw dbErr
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Could not submit mission. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const bgStyle = backgrounds.submit
    ? { backgroundImage: `url(${backgrounds.submit})` }
    : { background: fallbackGradients.submit }

  // ── SUCCESS ──
  if (success) {
    return (
      <div className="photo-screen">
        <div className="photo-screen-bg" style={bgStyle} />
        <div className="photo-screen-overlay" />
        <div
          className="photo-screen-content"
          style={{ justifyContent: 'flex-end', padding: '0 24px calc(44px + env(safe-area-inset-bottom))' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #001FED, #0015AD)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px', fontSize: '2rem', color: 'white',
              boxShadow: '0 8px 32px rgba(107,115,232,0.5)',
            }}>✦</div>
            <h2 style={{
              fontSize: '1.55rem', fontWeight: 800, color: 'white',
              marginBottom: 10, letterSpacing: '-0.02em',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              Mission sent to Komal's lore vault.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              She may accept. She may ignore.<br />
              She may make this everyone's problem.
            </p>
          </div>

          <button
            className="btn-pill"
            onClick={() => { setSuccess(false); setTitle(''); setDescription(''); setVibe('') }}
            style={{ marginBottom: 10 }}
          >
            Submit Another Mission
          </button>
          <button className="btn-glass" onClick={() => navigate('/mission')}>
            Get My Mission
          </button>
        </div>
      </div>
    )
  }

  // ── FORM ──
  return (
    <div className="photo-screen">
      <div className="photo-screen-bg" style={bgStyle} />
      <div className="photo-screen-overlay" />

      <div
        className="photo-screen-content"
        style={{ padding: '56px 24px calc(44px + env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)',
            fontSize: '0.85rem', cursor: 'pointer', marginBottom: 20,
            padding: 0, fontFamily: 'inherit',
          }}
        >
          ← back
        </button>

        <h1 style={{
          fontSize: '1.6rem', fontWeight: 800, color: 'white',
          marginBottom: 6, letterSpacing: '-0.02em',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          Give Komal a Mission
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', marginBottom: 24, lineHeight: 1.6 }}>
          It's her birthday. Be funny. Be iconic.<br />
          Be slightly unhinged but legally safe.
        </p>

        {error && <div className="error-glass">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label-white">Mission title *</label>
            <input
              className="input-glass"
              type="text"
              placeholder="e.g. Do the worm on the dance floor"
              value={title}
              onChange={e => { setTitle(e.target.value); setError('') }}
              maxLength={100}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="label-white">Mission instructions</label>
            <textarea
              className="input-glass"
              placeholder="Add details, rules, or escalating stakes…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
            />
          </div>

          <div>
            <label className="label-white">Mission vibe</label>
            <select
              className="input-glass"
              value={vibe}
              onChange={e => setVibe(e.target.value)}
              style={{ appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
            >
              {VIBES.map(v => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn-pill"
            disabled={loading || !title.trim()}
            style={{ marginTop: 4 }}
          >
            {loading
              ? <><div className="spinner" style={{ width: 18, height: 18 }} /> submitting…</>
              : 'Submit Mission for Komal'
            }
          </button>
        </form>
      </div>
    </div>
  )
}

export default GiveMissionPage
