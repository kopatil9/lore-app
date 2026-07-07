import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { backgrounds, fallbackGradients } from '../assets/backgrounds.js'

const MAX_FILE_SIZE_MB = 100

function SubmitPage() {
  const [mission, setMission] = useState(null)
  const [guestName, setGuestName] = useState('')
  const [caption, setCaption] = useState('')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const guestId   = sessionStorage.getItem('lore_guest_id')
  const eventId   = sessionStorage.getItem('lore_event_id')
  const missionId = sessionStorage.getItem('lore_mission_id')

  useEffect(() => {
    if (!guestId || !missionId) { navigate('/'); return }
    setGuestName(sessionStorage.getItem('lore_guest_name') || '')
    supabase.from('missions').select('*').eq('id', missionId).single()
      .then(({ data }) => { if (data) setMission(data) })
  }, [navigate])

  const handleFiles = (incoming) => {
    const valid = Array.from(incoming).filter(f => {
      if (f.size / 1024 / 1024 > MAX_FILE_SIZE_MB) {
        setError(`"${f.name}" is too large (max ${MAX_FILE_SIZE_MB}MB).`)
        return false
      }
      return true
    })
    setFiles(prev => [...prev, ...valid])
    valid.forEach(f => {
      setPreviews(prev => [...prev, { url: URL.createObjectURL(f), type: f.type }])
    })
  }

  const removeFile = (idx) => {
    URL.revokeObjectURL(previews[idx].url)
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!files.length) return setError('Add at least one photo or video first.')
    setLoading(true)
    setError('')
    try {
      // One batch_id for everything uploaded in this submit → renders as one carousel card
      const batchId = (crypto.randomUUID && crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`

      const uploadedUrls = []
      for (const file of files) {
        const ext  = file.name.split('.').pop()
        const path = `${eventId}/${guestId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('lore-media').upload(path, file, { contentType: file.type, upsert: false })
        if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`)
        const { data: urlData } = supabase.storage.from('lore-media').getPublicUrl(path)
        uploadedUrls.push({ url: urlData.publicUrl, type: file.type })
      }
      for (const { url, type } of uploadedUrls) {
        const { error: dbErr } = await supabase.from('submissions').insert({
          event_id: eventId,
          guest_id: guestId,
          mission_id: missionId,
          caption: caption.trim() || null,
          media_url: url,
          media_type: type,
          status: 'approved',
          batch_id: batchId,
        })
        if (dbErr) throw new Error(`Could not save: ${dbErr.message}`)
      }
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForMore = () => {
    previews.forEach(p => URL.revokeObjectURL(p.url))
    setSuccess(false)
    setFiles([])
    setPreviews([])
    setCaption('')
    setError('')
  }

  const bgStyle = backgrounds.submit
    ? { backgroundImage: `url(${backgrounds.submit})` }
    : { background: fallbackGradients.submit }

  // ── SUCCESS SCREEN ──
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
              background: 'linear-gradient(135deg, #84c7ff, #a88bff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
              fontSize: '2rem', color: 'white',
              boxShadow: '0 8px 32px rgba(107,115,232,0.5)',
            }}>✓</div>
            <h2 style={{
              fontSize: '1.6rem', fontWeight: 800, color: 'white',
              marginBottom: 10, letterSpacing: '-0.02em',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              Lore submitted.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              You are now part of the canon.
            </p>
          </div>

          <button
            className="btn-pill"
            onClick={() => navigate('/mission')}
            style={{ marginBottom: 10 }}
          >
            View My Mission
          </button>
          <button className="btn-glass" onClick={resetForMore}>
            Submit More Proof
          </button>
        </div>
      </div>
    )
  }

  // ── SUBMIT FORM ──
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
          onClick={() => navigate('/board')}
          style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
            fontSize: '0.85rem', cursor: 'pointer', marginBottom: 18,
            padding: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          ← evidence board
        </button>

        <div style={{ marginBottom: 22 }}>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 800, color: 'white',
            marginBottom: 5, textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            letterSpacing: '-0.02em',
          }}>
            Submit Proof
          </h1>
          {mission && (
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem' }}>
              ✦ {mission.title}
            </p>
          )}
        </div>

        {error && <div className="error-glass">{error}</div>}

        {/* Upload zone */}
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          style={{ marginBottom: 14 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            capture="environment"
            onChange={e => { if (e.target.files?.length) handleFiles(e.target.files) }}
          />
          <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>📸</div>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.88rem', fontWeight: 500 }}>
            tap to add photos or videos
          </p>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.75rem', marginTop: 4 }}>
            max {MAX_FILE_SIZE_MB}MB per file
          </p>
        </div>

        {previews.length > 0 && (
          <div className="upload-preview" style={{ marginBottom: 14 }}>
            {previews.map((p, i) => (
              <div key={i} className="upload-preview-item">
                {p.type.startsWith('video/')
                  ? <video src={p.url} playsInline muted />
                  : <img src={p.url} alt="" />
                }
                <button className="remove-btn" onClick={() => removeFile(i)}>×</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label className="label-white">Tell us what happened…</label>
          <textarea
            className="input-glass"
            placeholder="optional caption"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            maxLength={280}
            rows={3}
          />
        </div>

        <button
          className="btn-pill"
          onClick={handleSubmit}
          disabled={loading || !files.length}
        >
          {loading
            ? <><div className="spinner" style={{ width: 18, height: 18 }} /> uploading…</>
            : `Submit to the Lore Vault${files.length > 0 ? ` (${files.length})` : ''}`
          }
        </button>
      </div>
    </div>
  )
}

export default SubmitPage
