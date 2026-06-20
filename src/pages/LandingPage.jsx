import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

const EVENT_CODE = import.meta.env.VITE_EVENT_CODE || 'ATE2024'

function LandingPage() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleEnter = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Enter your name to get your mission.')

    setLoading(true)
    setError('')

    try {
      // Get event
      const { data: event, error: eventErr } = await supabase
        .from('events')
        .select('*')
        .eq('code', EVENT_CODE)
        .single()

      if (eventErr || !event) throw new Error('Event not found. Check the app setup.')
      if (!event.is_active) throw new Error('This party has ended. The lore is already canon.')

      // Get missions and already-assigned mission IDs
      const { data: missions } = await supabase
        .from('missions')
        .select('*')
        .eq('event_id', event.id)

      const { data: existingGuests } = await supabase
        .from('guests')
        .select('assigned_mission_id')
        .eq('event_id', event.id)

      if (!missions || missions.length === 0) {
        throw new Error('No missions found. Ask the host to set up the missions.')
      }

      // Pick least-used mission
      const usedCounts = {}
      existingGuests?.forEach(g => {
        if (g.assigned_mission_id) {
          usedCounts[g.assigned_mission_id] = (usedCounts[g.assigned_mission_id] || 0) + 1
        }
      })

      const sorted = [...missions].sort((a, b) => {
        return (usedCounts[a.id] || 0) - (usedCounts[b.id] || 0)
      })

      // Add randomness among least-used missions
      const minCount = usedCounts[sorted[0].id] || 0
      const leastUsed = sorted.filter(m => (usedCounts[m.id] || 0) === minCount)
      const chosenMission = leastUsed[Math.floor(Math.random() * leastUsed.length)]

      // Create guest
      const { data: guest, error: guestErr } = await supabase
        .from('guests')
        .insert({
          event_id: event.id,
          name: name.trim(),
          assigned_mission_id: chosenMission.id,
        })
        .select()
        .single()

      if (guestErr) throw guestErr

      // Store in session
      sessionStorage.setItem('lore_guest_id', guest.id)
      sessionStorage.setItem('lore_guest_name', guest.name)
      sessionStorage.setItem('lore_mission_id', chosenMission.id)
      sessionStorage.setItem('lore_event_id', event.id)

      navigate('/mission')
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing-wrap">
      <div className="landing-bg-glow" />

      <div className="landing-content">
        <div className="landing-wordmark">Lore</div>
        <div className="landing-event">Mission: ATE</div>

        <p className="landing-tagline">
          You've been assigned a mission. Complete it before the night ends.
          Submit proof. At midnight, the lore becomes canon.
        </p>

        <form onSubmit={handleEnter}>
          {error && <div className="error-box">{error}</div>}

          <div className="form-group">
            <label className="label" htmlFor="name">Your Name</label>
            <input
              id="name"
              className="input"
              type="text"
              placeholder="What do they call you?"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="off"
              autoFocus
              maxLength={50}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <><div className="spinner" style={{ width: 18, height: 18, margin: 0 }} /> Assigning mission...</>
            ) : (
              'Enter the Lore →'
            )}
          </button>

          <div className="text-center mt-md">
            <span className="text-dim text-small">No proof, no lore.</span>
          </div>
        </form>

        <div style={{ marginTop: 'auto', paddingTop: 40 }}>
          <a
            href="/board"
            className="btn btn-ghost w-full text-center"
            style={{ display: 'block' }}
          >
            📸 View the Evidence Board
          </a>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
