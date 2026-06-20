import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import Layout from '../components/Layout.jsx'

function MissionPage() {
  const [mission, setMission] = useState(null)
  const [guestName, setGuestName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const guestId = sessionStorage.getItem('lore_guest_id')
    const name = sessionStorage.getItem('lore_guest_name')
    const missionId = sessionStorage.getItem('lore_mission_id')

    if (!guestId || !missionId) {
      navigate('/')
      return
    }

    setGuestName(name || 'Agent')
    fetchMission(missionId)
  }, [navigate])

  const fetchMission = async (missionId) => {
    try {
      const { data, error: err } = await supabase
        .from('missions')
        .select('*')
        .eq('id', missionId)
        .single()

      if (err) throw err
      setMission(data)
    } catch (err) {
      setError('Could not load your mission. Go back and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="loading-screen">
          <div className="spinner" />
          <span>Decrypting your mission...</span>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="error-box" style={{ marginTop: 40 }}>{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          ← Back to Start
        </button>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ paddingTop: 8, paddingBottom: 16 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 32 }}>
          Welcome, <strong style={{ color: 'var(--cream)' }}>{guestName}</strong>.
          Your mission awaits.
        </p>

        {mission && (
          <div className="mission-display">
            <div className="mission-eyebrow">⬡ Your Mission</div>
            <h1 className="mission-title">{mission.title}</h1>
            <p className="mission-description">{mission.description}</p>
          </div>
        )}

        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/submit')}
          >
            Submit Proof →
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/board')}
          >
            📸 View Evidence Board
          </button>
        </div>

        <p
          className="text-center text-dim text-small"
          style={{ marginTop: 24 }}
        >
          Complete your mission before the night ends.
        </p>
      </div>
    </Layout>
  )
}

export default MissionPage
