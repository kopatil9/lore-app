import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import EvidenceCard from '../components/EvidenceCard.jsx'

// Group raw submission rows into carousel cards by batch_id.
// Rows without a batch_id (older data) become their own single-photo card.
function groupSubmissions(rows) {
  const groups = new Map()
  for (const row of rows) {
    const key = row.batch_id || row.id
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        guest_id: row.guest_id,
        guests: row.guests,
        missions: row.missions,
        caption: row.caption,
        status: row.status,
        created_at: row.created_at,
        media: [],
        rowIds: [],
        mediaUrls: [],
      })
    }
    const g = groups.get(key)
    g.media.push({ id: row.id, url: row.media_url, type: row.media_type })
    g.rowIds.push(row.id)
    g.mediaUrls.push(row.media_url)
  }
  // newest first
  return [...groups.values()].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

function BoardPage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const currentGuestId = sessionStorage.getItem('lore_guest_id')
  const isAdmin = sessionStorage.getItem('lore_admin_authed') === 'true'

  useEffect(() => {
    fetchSubmissions()
    const channel = supabase
      .channel('submissions-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => fetchSubmissions())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*, guests(name), missions(title)')
      .order('created_at', { ascending: false })
    if (!error) {
      setGroups(groupSubmissions(data || []))
    }
    setLoading(false)
  }

  const handleDelete = async (group) => {
    // Delete every row in the batch
    const { error: dbErr } = await supabase
      .from('submissions').delete().in('id', group.rowIds)
    if (dbErr) {
      alert(`Could not delete: ${dbErr.message}`)
      return
    }

    // Best-effort: remove files from storage
    try {
      const marker = '/lore-media/'
      const paths = group.mediaUrls
        .map(u => {
          const idx = u.indexOf(marker)
          return idx === -1 ? null : decodeURIComponent(u.slice(idx + marker.length))
        })
        .filter(Boolean)
      if (paths.length) await supabase.storage.from('lore-media').remove(paths)
    } catch {
      // non-fatal
    }

    setGroups(prev => prev.filter(g => g.id !== group.id))
  }

  const filtered = groups.filter(g => {
    if (filter === 'approved') return g.status === 'approved'
    if (filter === 'pending')  return g.status === 'pending'
    return true
  })

  return (
    <div className="white-screen">
      <div className="white-header">
        <div>
          <div className="white-header-title">evidence board</div>
          <div style={{ fontSize: '0.72rem', color: '#9999AA', marginTop: 1 }}>
            {groups.length} moment{groups.length !== 1 ? 's' : ''} captured
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: '#9999AA' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6B73E8', display: 'inline-block' }} />
          live
        </div>
      </div>

      <div className="white-content" style={{ paddingTop: 14, paddingBottom: 100 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[['all','All'],['approved','Canon'],['pending','Pending']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              padding: '6px 16px', borderRadius: 999, border: filter === val ? 'none' : '1px solid #EBEBF0',
              background: filter === val ? '#6B73E8' : 'white',
              color: filter === val ? 'white' : '#9999AA',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>

        {loading && (
          <div className="loading-screen" style={{ minHeight: '40vh' }}>
            <div className="spinner spinner-dark" /><span>Loading...</span>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p style={{ fontWeight: 700, fontFamily: 'Syne, sans-serif', color: '#1A1A1A', marginBottom: 6 }}>Nothing yet</p>
            <p style={{ fontSize: '0.85rem' }}>Get out there and make some lore.</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="board-masonry">
            {filtered.map(g => (
              <EvidenceCard
                key={g.id}
                group={g}
                canDelete={isAdmin || (!!currentGuestId && g.guest_id === currentGuestId)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        {[
          { path: '/mission', label: 'Mission', icon: '✦' },
          { path: '/board',   label: 'Evidence', icon: '⊞', active: true },
          { path: '/submit',  label: 'Submit', icon: '↑' },
        ].map(item => (
          <a key={item.path} href={item.path} className={item.active ? 'active' : ''}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  )
}

export default BoardPage
