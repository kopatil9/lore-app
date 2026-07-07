import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import EvidenceCard from '../components/EvidenceCard.jsx'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'lorehost'
const EVENT_CODE = import.meta.env.VITE_EVENT_CODE || 'KOTWENTYATE'
const EVENT_NAME = 'Ko Twenty Ate'

const P = {
  blue: '#6B73E8',
  purple: '#9B8FD8',
  dark: '#171722',
  mid: '#555566',
  light: '#9999AA',
  border: '#EBEBF0',
  card: '#FFFFFF',
  bg: '#F7F7FB',
  danger: '#C0392B',
}

function normalizeName(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

const KOMAL_STATUS_OPTIONS = ['pending', 'accepted', 'completed', 'rejected']

function AdminPage() {
  const navigate = useNavigate()

  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const [event, setEvent] = useState(null)
  const [guests, setGuests] = useState([])
  const [missions, setMissions] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [komalMissions, setKomalMissions] = useState([])
  // Komal evidence uploader
  const [evidenceForId, setEvidenceForId] = useState(null)   // which komal_mission is open
  const [evidenceFiles, setEvidenceFiles] = useState([])
  const [evidenceCaption, setEvidenceCaption] = useState('')
  const [evidenceUploading, setEvidenceUploading] = useState(false)
  const [evidenceError, setEvidenceError] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('guests')

  const [singleName, setSingleName] = useState('')
  const [singleTitle, setSingleTitle] = useState('')
  const [singleDesc, setSingleDesc] = useState('')
  const [singleLoading, setSingleLoading] = useState(false)
  const [singleMessage, setSingleMessage] = useState('')
  const [singleError, setSingleError] = useState('')

  const [bulkText, setBulkText] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkMessage, setBulkMessage] = useState('')
  const [bulkError, setBulkError] = useState('')

  const [creatingEvent, setCreatingEvent] = useState(false)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('lore_admin_authed') === 'true') setAuthed(true)
  }, [])

  useEffect(() => {
    if (authed) fetchData()
    else setLoading(false)
  }, [authed])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('lore_admin_authed', 'true')
      setAuthed(true)
      setAuthError('')
      setPassword('')
    } else {
      setAuthError('Wrong password.')
    }
  }

  const logout = () => {
    sessionStorage.removeItem('lore_admin_authed')
    setAuthed(false)
    navigate('/')
  }

  const fetchData = async () => {
    setLoading(true)

    const { data: evt, error: evtErr } = await supabase
      .from('events').select('*').eq('code', EVENT_CODE).maybeSingle()

    if (evtErr) { console.error(evtErr); setLoading(false); return }

    setEvent(evt || null)

    if (!evt) {
      setGuests([]); setMissions([]); setSubmissions([]); setKomalMissions([])
      setLoading(false)
      return
    }

    const [guestRes, missionRes, submissionRes, komalRes] = await Promise.all([
      supabase.from('guests')
        .select('*, missions(id,title,description)')
        .eq('event_id', evt.id)
        .order('created_at', { ascending: true }),
      supabase.from('missions')
        .select('*').eq('event_id', evt.id).order('created_at', { ascending: true }),
      supabase.from('submissions')
        .select('*, guests(name), missions(title,description)')
        .eq('event_id', evt.id).order('created_at', { ascending: false }),
      supabase.from('komal_missions')
        .select('*').order('created_at', { ascending: false }),
    ])

    if (!guestRes.error) setGuests(guestRes.data || [])
    if (!missionRes.error) setMissions(missionRes.data || [])
    if (!submissionRes.error) setSubmissions(submissionRes.data || [])
    if (!komalRes.error) setKomalMissions(komalRes.data || [])

    setLoading(false)
  }

  const createEvent = async () => {
    setCreatingEvent(true)
    const { data, error } = await supabase.from('events')
      .insert({ name: EVENT_NAME, code: EVENT_CODE, is_active: true, recap_published: false })
      .select().single()
    if (error) alert(error.message)
    else { setEvent(data); await fetchData() }
    setCreatingEvent(false)
  }

  const addOrUpdateGuestMission = async ({ guestName, title, description }) => {
    if (!event) throw new Error('Create the event first.')
    const cleanName = guestName.trim()
    const cleanTitle = title.trim()
    const cleanDesc = description.trim()
    if (!cleanName) throw new Error('Guest name is required.')
    if (!cleanTitle) throw new Error('Mission title is required.')

    const { data: mission, error: missionErr } = await supabase.from('missions')
      .insert({ event_id: event.id, title: cleanTitle, description: cleanDesc || null })
      .select().single()
    if (missionErr) throw missionErr

    const existingGuest = guests.find(g => normalizeName(g.name) === normalizeName(cleanName))

    if (existingGuest) {
      const { error: updateErr } = await supabase.from('guests')
        .update({ name: cleanName, assigned_mission_id: mission.id }).eq('id', existingGuest.id)
      if (updateErr) throw updateErr
      return `Updated ${cleanName}'s mission.`
    }

    const { error: guestErr } = await supabase.from('guests')
      .insert({ event_id: event.id, name: cleanName, assigned_mission_id: mission.id })
    if (guestErr) throw guestErr
    return `Added ${cleanName}.`
  }

  const handleSingleAdd = async () => {
    setSingleLoading(true); setSingleError(''); setSingleMessage('')
    try {
      const msg = await addOrUpdateGuestMission({ guestName: singleName, title: singleTitle, description: singleDesc })
      setSingleMessage(msg); setSingleName(''); setSingleTitle(''); setSingleDesc('')
      await fetchData()
    } catch (err) { setSingleError(err.message || 'Could not save.') }
    finally { setSingleLoading(false) }
  }

  const handleBulkAdd = async () => {
    setBulkLoading(true); setBulkError(''); setBulkMessage('')
    try {
      const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
      if (!lines.length) throw new Error('Paste at least one line.')
      let saved = 0; const errors = []
      for (const line of lines) {
        const parts = line.split('|').map(p => p.trim())
        if (parts.length < 3) { errors.push(`Skipped: ${line}`); continue }
        const [guestName, title, description] = parts
        try { await addOrUpdateGuestMission({ guestName, title, description }); saved++ }
        catch (err) { errors.push(`${guestName}: ${err.message}`) }
      }
      setBulkMessage(`Saved ${saved} mission${saved === 1 ? '' : 's'}.${errors.length ? ` ${errors.length} skipped.` : ''}`)
      setBulkText(''); await fetchData()
    } catch (err) { setBulkError(err.message || 'Could not bulk add.') }
    finally { setBulkLoading(false) }
  }

  const reassignMission = async (guestId, missionId) => {
    const { error } = await supabase.from('guests')
      .update({ assigned_mission_id: missionId || null }).eq('id', guestId)
    if (error) alert(error.message)
    else await fetchData()
  }

  const deleteGuest = async (guestId) => {
    if (!window.confirm('Remove this guest?')) return
    const { error } = await supabase.from('guests').delete().eq('id', guestId)
    if (error) alert(error.message)
    else await fetchData()
  }

  const updateSubmissionStatus = async (id, status) => {
    const { error } = await supabase.from('submissions').update({ status }).eq('id', id)
    if (error) alert(error.message)
    else setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  // Apply a status to every row in a batch (grouped carousel card)
  const updateGroupStatus = async (group, status) => {
    const { error } = await supabase.from('submissions').update({ status }).in('id', group.rowIds)
    if (error) alert(error.message)
    else setSubmissions(prev => prev.map(s => group.rowIds.includes(s.id) ? { ...s, status } : s))
  }

  // Delete a whole batch (all photos) + best-effort remove files from storage.
  const deleteGroup = async (group) => {
    const { error } = await supabase.from('submissions').delete().in('id', group.rowIds)
    if (error) { alert(error.message); return }
    try {
      const marker = '/lore-media/'
      const paths = (group.mediaUrls || [])
        .map(u => { const i = u.indexOf(marker); return i === -1 ? null : decodeURIComponent(u.slice(i + marker.length)) })
        .filter(Boolean)
      if (paths.length) await supabase.storage.from('lore-media').remove(paths)
    } catch { /* non-fatal */ }
    setSubmissions(prev => prev.filter(s => !group.rowIds.includes(s.id)))
  }

  // Group raw submission rows into carousel cards by batch_id
  const groupedSubmissions = (() => {
    const groups = new Map()
    for (const row of submissions) {
      const key = row.batch_id || row.id
      if (!groups.has(key)) {
        groups.set(key, {
          id: key, guest_id: row.guest_id, guests: row.guests, missions: row.missions,
          caption: row.caption, status: row.status, created_at: row.created_at,
          media: [], rowIds: [], mediaUrls: [],
        })
      }
      const g = groups.get(key)
      g.media.push({ id: row.id, url: row.media_url, type: row.media_type })
      g.rowIds.push(row.id)
      g.mediaUrls.push(row.media_url)
    }
    return [...groups.values()].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  })()

  const updateKomalMissionStatus = async (id, status) => {
    const { error } = await supabase.from('komal_missions').update({ status }).eq('id', id)
    if (error) alert(error.message)
    else setKomalMissions(prev => prev.map(m => m.id === id ? { ...m, status } : m))
  }

  // Find or create the special "Komal" guest so her evidence shows on the board.
  const getOrCreateKomalGuest = async () => {
    const existing = guests.find(g => normalizeName(g.name) === 'komal')
    if (existing) return existing
    const { data, error } = await supabase.from('guests')
      .insert({ event_id: event.id, name: 'Komal' })
      .select().single()
    if (error) throw error
    return data
  }

  // Upload photos as evidence for one of Komal's accepted missions.
  const submitKomalEvidence = async (km) => {
    if (!evidenceFiles.length) { setEvidenceError('Add at least one photo or video.'); return }
    setEvidenceUploading(true); setEvidenceError('')
    try {
      const komalGuest = await getOrCreateKomalGuest()

      // Create a mission row from this Komal-mission so it shows a title on the board.
      const { data: mission, error: mErr } = await supabase.from('missions')
        .insert({ event_id: event.id, title: km.title, description: km.description || null })
        .select().single()
      if (mErr) throw mErr

      const batchId = (crypto.randomUUID && crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`

      const uploaded = []
      for (const file of evidenceFiles) {
        const ext = file.name.split('.').pop()
        const path = `${event.id}/komal/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('lore-media').upload(path, file, { contentType: file.type, upsert: false })
        if (upErr) throw new Error(`Upload failed: ${upErr.message}`)
        const { data: urlData } = supabase.storage.from('lore-media').getPublicUrl(path)
        uploaded.push({ url: urlData.publicUrl, type: file.type })
      }
      for (const { url, type } of uploaded) {
        const { error: sErr } = await supabase.from('submissions').insert({
          event_id: event.id,
          guest_id: komalGuest.id,
          mission_id: mission.id,
          caption: evidenceCaption.trim() || null,
          media_url: url,
          media_type: type,
          status: 'approved',
          batch_id: batchId,
        })
        if (sErr) throw new Error(`Could not save: ${sErr.message}`)
      }

      // Mark the Komal-mission completed and close the uploader.
      await supabase.from('komal_missions').update({ status: 'completed' }).eq('id', km.id)
      setKomalMissions(prev => prev.map(m => m.id === km.id ? { ...m, status: 'completed' } : m))
      setEvidenceForId(null); setEvidenceFiles([]); setEvidenceCaption('')
      await fetchData()
      alert('Evidence posted to the board!')
    } catch (err) {
      setEvidenceError(err.message || 'Something went wrong.')
    } finally {
      setEvidenceUploading(false)
    }
  }

  const toggleEventActive = async () => {
    if (!event) return
    const { error } = await supabase.from('events')
      .update({ is_active: !event.is_active }).eq('id', event.id)
    if (error) alert(error.message)
    else setEvent(prev => ({ ...prev, is_active: !prev.is_active }))
  }

  const publishRecap = async () => {
    if (!event) return
    setPublishing(true)
    const { error } = await supabase.from('events')
      .update({ recap_published: true }).eq('id', event.id)
    if (error) alert(error.message)
    setPublishing(false)
    navigate('/recap')
  }

  const completedCount = guests.filter(g => submissions.some(s => s.guest_id === g.id)).length
  const pendingCount = submissions.filter(s => s.status === 'pending').length
  const komalPendingCount = komalMissions.filter(m => m.status === 'pending').length

  const tabButton = (id, label) => (
    <button
      key={id}
      onClick={() => setActiveTab(id)}
      style={{
        border: activeTab === id ? 'none' : `1px solid ${P.border}`,
        background: activeTab === id ? P.blue : '#FFFFFF',
        color: activeTab === id ? '#FFFFFF' : P.light,
        borderRadius: 999, padding: '8px 15px',
        fontSize: 13, fontWeight: 800, cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )

  const statusPillColor = (status) => {
    if (status === 'accepted' || status === 'completed') return { background: 'rgba(76,175,125,0.12)', color: '#2E8B57' }
    if (status === 'rejected') return { background: 'rgba(192,57,43,0.1)', color: P.danger }
    return { background: 'rgba(107,115,232,0.08)', color: P.blue }
  }

  // ── AUTH GATE ──
  if (!authed) {
    return (
      <main style={styles.loginPage}>
        <form onSubmit={handleLogin} style={styles.loginCard}>
          <button type="button" onClick={() => navigate('/')} style={styles.backButton}>← back to landing</button>
          <div style={styles.logo}>Lore</div>
          <h1 style={styles.loginTitle}>host login</h1>
          <p style={styles.loginSubtitle}>Enter your host password to access the dashboard.</p>
          {authError && <div style={styles.errorBox}>{authError}</div>}
          <input
            type="password" placeholder="host password" value={password}
            onChange={e => { setPassword(e.target.value); setAuthError('') }}
            autoFocus style={styles.loginInput}
          />
          <button type="submit" style={styles.loginButton}>enter dashboard</button>
        </form>
      </main>
    )
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <div className="spinner spinner-dark" />
        <p>Loading host dashboard...</p>
      </div>
    )
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <button onClick={() => navigate('/')} style={styles.backButton}>← landing</button>
          <h1 style={styles.title}>host dashboard</h1>
          <p style={styles.subtitle}>Ko Twenty Ate</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {event && (
            <button
              onClick={toggleEventActive}
              style={{
                ...styles.liveButton,
                background: event.is_active ? 'rgba(107,115,232,0.10)' : '#F0F0F4',
                color: event.is_active ? P.blue : P.light,
              }}
            >
              {event.is_active ? '● live' : '○ ended'}
            </button>
          )}
          <button onClick={logout} style={styles.logoutButton}>log out</button>
        </div>
      </header>

      <section style={styles.container}>
        {/* Event card */}
        <div style={styles.eventCard}>
          <div>
            <p style={styles.cardEyebrow}>event</p>
            <h2 style={styles.cardTitle}>{event ? event.name : 'No event created yet'}</h2>
            <p style={styles.smallText}>Code: <strong style={{ color: P.blue }}>{EVENT_CODE}</strong></p>
          </div>
          {!event && (
            <button onClick={createEvent} disabled={creatingEvent} style={styles.primarySmall}>
              {creatingEvent ? 'Creating...' : 'Create event'}
            </button>
          )}
        </div>

        {!event && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🎬</div>
            <p style={{ margin: 0 }}>First, tap <strong>Create event</strong>. Then add guest missions.</p>
          </div>
        )}

        {event && (
          <>
            {/* Stats */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}><strong>{guests.length}</strong><span>Guests</span></div>
              <div style={styles.statCard}><strong>{submissions.length}</strong><span>Proofs</span></div>
              <div style={styles.statCard}><strong>{completedCount}</strong><span>Done</span></div>
              <div style={styles.statCard}><strong>{komalMissions.length}</strong><span>For Komal</span></div>
            </div>

            {/* Recap CTA */}
            <div style={styles.recapCard}>
              <div>
                <h3 style={{ margin: '0 0 4px' }}>ready to close the night?</h3>
                <p style={{ margin: 0, opacity: 0.78 }}>Publish the recap when the lore is canon.</p>
              </div>
              <button onClick={publishRecap} disabled={publishing} style={styles.recapButton}>
                {publishing ? 'publishing...' : 'mission accomplished'}
              </button>
            </div>

            {/* Tabs */}
            <div style={styles.tabs}>
              {tabButton('guests', 'Guests')}
              {tabButton('add', 'Add One')}
              {tabButton('bulk', 'Bulk Add')}
              {tabButton('proofs', `Proofs${pendingCount ? ` (${pendingCount})` : ''}`)}
              {tabButton('komal', `For Komal${komalPendingCount ? ` (${komalPendingCount})` : ''}`)}
              {tabButton('missions', 'Missions')}
            </div>

            {/* ── GUESTS TAB ── */}
            {activeTab === 'guests' && (
              <section style={styles.stack}>
                {guests.length === 0 && (
                  <div style={styles.empty}>
                    <div style={styles.emptyIcon}>👥</div>
                    <p>No guests yet. Add your first guest mission.</p>
                  </div>
                )}
                {guests.map(guest => {
                  const proofCount = submissions.filter(s => s.guest_id === guest.id).length
                  return (
                    <div key={guest.id} style={styles.guestCard}>
                      <div style={{ flex: 1 }}>
                        <h3 style={styles.guestName}>{guest.name}</h3>
                        {guest.missions ? (
                          <>
                            <p style={styles.missionTitle}>{guest.missions.title}</p>
                            <p style={styles.missionDesc}>{guest.missions.description}</p>
                          </>
                        ) : (
                          <p style={styles.missionDesc}>No mission assigned.</p>
                        )}
                        <span style={styles.pill}>
                          {proofCount ? `✓ ${proofCount} proof${proofCount === 1 ? '' : 's'}` : '⏳ no proof yet'}
                        </span>
                      </div>
                      <div style={styles.guestActions}>
                        <select
                          value={guest.assigned_mission_id || ''}
                          onChange={e => reassignMission(guest.id, e.target.value)}
                          style={styles.select}
                        >
                          <option value="">Assign...</option>
                          {missions.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                        </select>
                        <button onClick={() => deleteGuest(guest.id)} style={styles.deleteButton}>remove</button>
                      </div>
                    </div>
                  )
                })}
              </section>
            )}

            {/* ── ADD ONE TAB ── */}
            {activeTab === 'add' && (
              <section style={styles.formCard}>
                <h2 style={styles.formTitle}>Add one guest mission</h2>
                <p style={styles.formHint}>When this person enters their name on the landing page, they get this mission.</p>
                {singleError && <div style={styles.errorBox}>{singleError}</div>}
                {singleMessage && <div style={styles.successBox}>{singleMessage}</div>}
                <label style={styles.label}>Guest name</label>
                <input value={singleName} onChange={e => { setSingleName(e.target.value); setSingleError(''); setSingleMessage('') }} placeholder="e.g. Sonya" style={styles.input} />
                <label style={styles.label}>Mission title</label>
                <input value={singleTitle} onChange={e => setSingleTitle(e.target.value)} placeholder="e.g. Birthday Hype Squad" style={styles.input} />
                <label style={styles.label}>Mission description</label>
                <textarea value={singleDesc} onChange={e => setSingleDesc(e.target.value)} placeholder="What they need to do." rows={4} style={styles.textarea} />
                <button onClick={handleSingleAdd} disabled={singleLoading || !singleName.trim() || !singleTitle.trim()} style={styles.primaryButton}>
                  {singleLoading ? 'Saving...' : 'Save guest mission'}
                </button>
              </section>
            )}

            {/* ── BULK ADD TAB ── */}
            {activeTab === 'bulk' && (
              <section style={styles.formCard}>
                <h2 style={styles.formTitle}>Bulk add guest missions</h2>
                <p style={styles.formHint}>Paste one per line using this format:</p>
                <div style={styles.codeHint}>Name | Mission Title | Mission Description</div>
                {bulkError && <div style={styles.errorBox}>{bulkError}</div>}
                {bulkMessage && <div style={styles.successBox}>{bulkMessage}</div>}
                <textarea
                  value={bulkText}
                  onChange={e => { setBulkText(e.target.value); setBulkError(''); setBulkMessage('') }}
                  placeholder={`Sonya | Birthday Hype Squad | Get a video of someone hyping up the birthday girl.\nJeff | Main Character Moment | Capture someone having their main character moment.`}
                  rows={9}
                  style={{ ...styles.textarea, fontFamily: 'monospace', fontSize: 12 }}
                />
                <button onClick={handleBulkAdd} disabled={bulkLoading || !bulkText.trim()} style={styles.primaryButton}>
                  {bulkLoading ? 'Saving...' : 'Create guest missions'}
                </button>
              </section>
            )}

            {/* ── PROOFS TAB ── */}
            {activeTab === 'proofs' && (
              <section style={styles.stack}>
                {submissions.length === 0 && (
                  <div style={styles.empty}>
                    <div style={styles.emptyIcon}>📭</div>
                    <p>No proof submitted yet.</p>
                  </div>
                )}
                <div className="board-masonry">
                  {groupedSubmissions.map(group => (
                    <EvidenceCard
                      key={group.id}
                      group={group}
                      showActions
                      canDelete
                      onDelete={deleteGroup}
                      onApprove={g => updateGroupStatus(g, 'approved')}
                      onReject={g => updateGroupStatus(g, 'rejected')}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── FOR KOMAL TAB ── */}
            {activeTab === 'komal' && (
              <section style={styles.stack}>
                {komalMissions.length === 0 && (
                  <div style={styles.empty}>
                    <div style={styles.emptyIcon}>🎂</div>
                    <p>No missions for Komal yet.</p>
                  </div>
                )}
                {komalMissions.map(km => (
                  <div key={km.id} style={styles.guestCard}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <h3 style={{ ...styles.guestName, margin: 0 }}>{km.title}</h3>
                        {km.vibe && (
                          <span style={{ ...styles.pill, marginTop: 0, fontSize: 11, background: 'rgba(155,143,216,0.12)', color: P.purple }}>
                            {km.vibe}
                          </span>
                        )}
                      </div>
                      {km.description && <p style={styles.missionDesc}>{km.description}</p>}
                      <p style={{ ...styles.missionDesc, marginTop: 6 }}>
                        from <strong style={{ color: P.dark }}>{km.submitted_by_name || 'Anonymous'}</strong>
                        {' · '}
                        {new Date(km.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>

                      {/* Submit-evidence button — shows once accepted or completed */}
                      {(km.status === 'accepted' || km.status === 'completed') && evidenceForId !== km.id && (
                        <button
                          onClick={() => { setEvidenceForId(km.id); setEvidenceFiles([]); setEvidenceCaption(''); setEvidenceError('') }}
                          style={{
                            marginTop: 10, border: 'none', borderRadius: 999,
                            background: P.blue, color: '#fff', fontSize: 12, fontWeight: 900,
                            padding: '8px 14px', cursor: 'pointer',
                          }}
                        >
                          📸 {km.status === 'completed' ? 'Add more evidence' : 'Submit evidence'}
                        </button>
                      )}

                      {/* Inline uploader */}
                      {evidenceForId === km.id && (
                        <div style={{ marginTop: 12, padding: 12, background: '#F7F7FB', borderRadius: 14, border: `1px solid ${P.border}` }}>
                          {evidenceError && <div style={styles.errorBox}>{evidenceError}</div>}
                          <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={e => { setEvidenceFiles(Array.from(e.target.files || [])); setEvidenceError('') }}
                            style={{ fontSize: 13, marginBottom: 8, width: '100%' }}
                          />
                          {evidenceFiles.length > 0 && (
                            <p style={{ ...styles.missionDesc, marginTop: 0, marginBottom: 8 }}>
                              {evidenceFiles.length} file{evidenceFiles.length === 1 ? '' : 's'} selected
                            </p>
                          )}
                          <input
                            type="text"
                            placeholder="Caption (optional)"
                            value={evidenceCaption}
                            onChange={e => setEvidenceCaption(e.target.value)}
                            style={{ ...styles.input, height: 42, marginBottom: 8 }}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => submitKomalEvidence(km)}
                              disabled={evidenceUploading || !evidenceFiles.length}
                              style={{
                                flex: 1, border: 'none', borderRadius: 999, background: P.blue, color: '#fff',
                                fontSize: 13, fontWeight: 900, padding: '10px', cursor: 'pointer',
                                opacity: (evidenceUploading || !evidenceFiles.length) ? 0.5 : 1,
                              }}
                            >
                              {evidenceUploading ? 'Posting…' : 'Post to board'}
                            </button>
                            <button
                              onClick={() => { setEvidenceForId(null); setEvidenceFiles([]); setEvidenceError('') }}
                              disabled={evidenceUploading}
                              style={{
                                border: `1px solid ${P.border}`, borderRadius: 999, background: '#fff', color: P.light,
                                fontSize: 13, fontWeight: 900, padding: '10px 14px', cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={styles.guestActions}>
                      <select
                        value={km.status || 'pending'}
                        onChange={e => updateKomalMissionStatus(km.id, e.target.value)}
                        style={{
                          ...styles.select,
                          ...statusPillColor(km.status),
                          fontWeight: 900,
                          border: '1px solid rgba(0,0,0,0.08)',
                        }}
                      >
                        {KOMAL_STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* ── MISSIONS TAB ── */}
            {activeTab === 'missions' && (
              <section style={styles.stack}>
                {missions.length === 0 && (
                  <div style={styles.empty}>
                    <div style={styles.emptyIcon}>🎯</div>
                    <p>No missions yet.</p>
                  </div>
                )}
                {missions.map(mission => {
                  const assignedGuest = guests.find(g => g.assigned_mission_id === mission.id)
                  const proofCount = submissions.filter(s => s.mission_id === mission.id).length
                  return (
                    <div key={mission.id} style={styles.guestCard}>
                      <div>
                        <h3 style={styles.guestName}>{mission.title}</h3>
                        <p style={styles.missionDesc}>{mission.description}</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                          <span style={styles.pill}>{assignedGuest ? `👤 ${assignedGuest.name}` : 'unassigned'}</span>
                          <span style={styles.pill}>{proofCount} proof{proofCount === 1 ? '' : 's'}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  )
}

const styles = {
  loginPage: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #5F8FE8 0%, #9B8FD8 55%, #25305F 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22,
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  loginCard: {
    width: '100%', maxWidth: 390, borderRadius: 28, padding: 24,
    background: 'rgba(255,255,255,0.92)', boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
  },
  logo: { fontSize: 42, fontWeight: 900, fontStyle: 'italic', letterSpacing: -2, color: P.blue, marginTop: 14 },
  loginTitle: { margin: '8px 0 4px', fontSize: 28, fontWeight: 900, letterSpacing: -1, color: P.dark },
  loginSubtitle: { margin: '0 0 18px', color: P.light, fontSize: 14, lineHeight: 1.5, fontWeight: 700 },
  loginInput: { width: '100%', height: 54, border: `1px solid ${P.border}`, borderRadius: 18, padding: '0 16px', fontSize: 16, fontWeight: 800, outline: 'none', marginBottom: 12 },
  loginButton: { width: '100%', height: 54, border: 'none', borderRadius: 18, background: `linear-gradient(90deg, #7AB8E8, ${P.purple})`, color: '#FFFFFF', fontSize: 15, fontWeight: 900, cursor: 'pointer' },
  page: { minHeight: '100vh', background: P.bg, color: P.dark, fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif' },
  header: { position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderBottom: `1px solid ${P.border}`, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  backButton: { border: 'none', background: 'transparent', color: P.blue, fontWeight: 800, cursor: 'pointer', padding: 0, marginBottom: 4 },
  title: { margin: 0, fontSize: 22, letterSpacing: -0.8, fontWeight: 900 },
  subtitle: { margin: '3px 0 0', color: P.light, fontSize: 13, fontWeight: 700 },
  liveButton: { border: 'none', borderRadius: 999, padding: '8px 12px', fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' },
  logoutButton: { border: `1px solid ${P.border}`, borderRadius: 999, padding: '8px 12px', fontSize: 12, fontWeight: 900, cursor: 'pointer', color: P.light, background: '#FFFFFF' },
  container: { width: '100%', maxWidth: 680, margin: '0 auto', padding: '18px 16px 80px' },
  eventCard: { background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 18, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  cardEyebrow: { margin: 0, color: P.light, textTransform: 'uppercase', letterSpacing: 1, fontSize: 11, fontWeight: 900 },
  cardTitle: { margin: '3px 0', fontSize: 18, fontWeight: 900 },
  smallText: { margin: 0, color: P.light, fontSize: 13 },
  primarySmall: { border: 'none', borderRadius: 999, padding: '11px 16px', background: `linear-gradient(90deg, #7AB8E8, ${P.purple})`, color: '#FFFFFF', fontWeight: 900, cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 },
  statCard: { background: P.card, border: `1px solid ${P.border}`, borderRadius: 16, padding: '14px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2, color: P.light, fontSize: 11, fontWeight: 900, textTransform: 'uppercase' },
  recapCard: { background: `linear-gradient(135deg, #7AB8E8, ${P.purple})`, borderRadius: 20, padding: 18, color: '#FFFFFF', marginBottom: 14, display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center' },
  recapButton: { border: '1px solid rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF', borderRadius: 999, padding: '11px 14px', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' },
  tabs: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  stack: { display: 'flex', flexDirection: 'column', gap: 12 },
  formCard: { background: P.card, border: `1px solid ${P.border}`, borderRadius: 22, padding: 18 },
  formTitle: { margin: 0, fontSize: 19, fontWeight: 900, letterSpacing: -0.5 },
  formHint: { color: P.light, fontSize: 13, lineHeight: 1.5, fontWeight: 700 },
  codeHint: { background: '#F2F2FA', border: `1px solid ${P.border}`, borderRadius: 14, padding: 12, fontFamily: 'monospace', fontSize: 12, color: P.blue, marginBottom: 12 },
  label: { display: 'block', margin: '14px 0 6px', color: P.mid, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.7 },
  input: { width: '100%', height: 50, border: `1px solid ${P.border}`, borderRadius: 16, padding: '0 14px', fontSize: 15, fontWeight: 700, outline: 'none', fontFamily: 'inherit' },
  textarea: { width: '100%', border: `1px solid ${P.border}`, borderRadius: 16, padding: 14, fontSize: 15, fontWeight: 700, outline: 'none', resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit' },
  primaryButton: { width: '100%', height: 54, border: 'none', borderRadius: 18, marginTop: 16, background: `linear-gradient(90deg, #7AB8E8, ${P.purple})`, color: '#FFFFFF', fontSize: 15, fontWeight: 900, cursor: 'pointer' },
  guestCard: { background: P.card, border: `1px solid ${P.border}`, borderRadius: 20, padding: 16, display: 'flex', justifyContent: 'space-between', gap: 12 },
  guestName: { margin: 0, fontSize: 17, fontWeight: 900, letterSpacing: -0.4 },
  missionTitle: { color: P.blue, fontSize: 13, fontWeight: 900, margin: '6px 0 4px' },
  missionDesc: { color: P.light, fontSize: 13, lineHeight: 1.45, margin: '6px 0 0', fontWeight: 650 },
  pill: { display: 'inline-flex', marginTop: 10, background: 'rgba(107,115,232,0.08)', color: P.blue, borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 900 },
  guestActions: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
  select: { maxWidth: 145, border: `1px solid ${P.border}`, borderRadius: 12, padding: '8px 9px', fontSize: 12, fontWeight: 800, background: '#FFFFFF', fontFamily: 'inherit' },
  deleteButton: { border: 'none', background: '#FFF0F0', color: P.danger, borderRadius: 999, padding: '7px 10px', fontSize: 12, fontWeight: 900, cursor: 'pointer' },
  empty: { background: P.card, border: `1px solid ${P.border}`, borderRadius: 22, padding: 32, textAlign: 'center', color: P.light, fontWeight: 800 },
  emptyIcon: { fontSize: 34, marginBottom: 8 },
  errorBox: { background: '#FFF0F0', border: '1px solid #FFD6D6', color: P.danger, borderRadius: 14, padding: 12, fontSize: 13, fontWeight: 800, marginTop: 12, marginBottom: 12 },
  successBox: { background: 'rgba(107,115,232,0.08)', border: '1px solid rgba(107,115,232,0.20)', color: P.blue, borderRadius: 14, padding: 12, fontSize: 13, fontWeight: 900, marginTop: 12, marginBottom: 12 },
  loading: { minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', background: P.bg, color: P.light, fontWeight: 800 },
}

export default AdminPage
