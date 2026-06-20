import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import Layout from '../components/Layout.jsx'
import EvidenceCard from '../components/EvidenceCard.jsx'

function BoardPage() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchSubmissions()

    // Real-time updates
    const channel = supabase
      .channel('submissions-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'submissions',
      }, (payload) => {
        // Refetch to get joined data
        fetchSubmissions()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        guests(name),
        missions(title)
      `)
      .order('created_at', { ascending: false })

    if (!error) setSubmissions(data || [])
    setLoading(false)
  }

  const filtered = submissions.filter(s => {
    if (filter === 'approved') return s.status === 'approved'
    if (filter === 'pending') return s.status === 'pending'
    return true
  })

  return (
    <Layout>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '1.6rem',
              fontWeight: 800,
              lineHeight: 1.2,
            }}>
              Evidence Board
            </h1>
            <p className="text-small text-dim" style={{ marginTop: 2 }}>
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''} so far
            </p>
          </div>
          <span className="badge badge-amber">🔴 Live</span>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[['all', 'All'], ['approved', 'Canon'], ['pending', 'Pending']].map(([val, label]) => (
            <button
              key={val}
              className={`btn btn-sm ${filter === val ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(val)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="loading-screen">
            <div className="spinner" />
            <span>Loading the evidence...</span>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 8 }}>
              No submissions yet
            </p>
            <p className="text-small text-dim">
              The lore hasn't started yet. Get out there.
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(s => (
              <EvidenceCard key={s.id} submission={s} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default BoardPage
