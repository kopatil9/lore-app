import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import Layout from '../components/Layout.jsx'

const MAX_FILE_SIZE_MB = 100

function SubmitPage() {
  const [mission, setMission] = useState(null)
  const [caption, setCaption] = useState('')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const guestId = sessionStorage.getItem('lore_guest_id')
  const eventId = sessionStorage.getItem('lore_event_id')
  const missionId = sessionStorage.getItem('lore_mission_id')

  useEffect(() => {
    if (!guestId || !missionId) {
      navigate('/')
      return
    }

    supabase
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .single()
      .then(({ data }) => setMission(data))
  }, [navigate])

  const handleFiles = (incoming) => {
    const valid = Array.from(incoming).filter(f => {
      const mb = f.size / 1024 / 1024
      if (mb > MAX_FILE_SIZE_MB) {
        setError(`"${f.name}" is too large (max ${MAX_FILE_SIZE_MB}MB).`)
        return false
      }
      return true
    })

    setFiles(prev => [...prev, ...valid])

    valid.forEach(f => {
      const url = URL.createObjectURL(f)
      setPreviews(prev => [...prev, { url, type: f.type, name: f.name }])
    })
  }

  const removeFile = (idx) => {
    URL.revokeObjectURL(previews[idx].url)
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (files.length === 0) return setError('Upload at least one photo or video as proof.')

    setLoading(true)
    setError('')

    try {
      const uploadedUrls = []

      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `${eventId}/${guestId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error: uploadErr } = await supabase.storage
          .from('lore-media')
          .upload(path, file, { contentType: file.type, upsert: false })

        if (uploadErr) throw uploadErr

        const { data: urlData } = supabase.storage
          .from('lore-media')
          .getPublicUrl(path)

        uploadedUrls.push({ url: urlData.publicUrl, type: file.type })
      }

      // Insert a submission per file (or one with the first file for MVP)
      // For MVP: submit one entry per file
      for (const { url, type } of uploadedUrls) {
        const { error: insertErr } = await supabase
          .from('submissions')
          .insert({
            event_id: eventId,
            guest_id: guestId,
            mission_id: missionId,
            caption: caption.trim() || null,
            media_url: url,
            media_type: type,
            status: 'approved',
          })

        if (insertErr) throw insertErr
      }

      setSuccess(true)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Upload failed. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✦</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', marginBottom: 8 }}>
            Proof Submitted
          </h2>
          <p className="text-dim" style={{ marginBottom: 32 }}>
            Your lore has been added to the canon.
          </p>
          <div className="card card-amber" style={{ marginBottom: 24 }}>
            <p className="text-small text-dim">Mission completed:</p>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginTop: 4 }}>
              {mission?.title}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/board')}>
            📸 See the Evidence Board
          </button>
          <button
            className="btn btn-ghost mt-md"
            onClick={() => {
              setSuccess(false)
              setFiles([])
              setPreviews([])
              setCaption('')
            }}
          >
            Submit more proof
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ paddingBottom: 40 }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '1.6rem',
          fontWeight: 800,
          marginBottom: 4,
        }}>
          Submit Proof
        </h1>

        {mission && (
          <p className="text-small text-dim" style={{ marginBottom: 24 }}>
            Mission: <span className="text-amber">{mission.title}</span>
          </p>
        )}

        {error && <div className="error-box">{error}</div>}

        {/* Upload zone */}
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault()
            setDragOver(false)
            handleFiles(e.dataTransfer.files)
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            capture="environment"
            onChange={e => handleFiles(e.target.files)}
          />
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📸</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Tap to upload photos or videos
          </p>
          <p className="text-small text-dim" style={{ marginTop: 4 }}>
            Max {MAX_FILE_SIZE_MB}MB per file
          </p>
        </div>

        {/* Previews */}
        {previews.length > 0 && (
          <div className="upload-preview">
            {previews.map((p, i) => (
              <div key={i} className="upload-preview-item">
                {p.type.startsWith('video/') ? (
                  <video src={p.url} playsInline muted />
                ) : (
                  <img src={p.url} alt={`preview ${i + 1}`} />
                )}
                <button className="remove-btn" onClick={() => removeFile(i)}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Caption */}
        <div className="form-group" style={{ marginTop: 20 }}>
          <label className="label">Caption (optional)</label>
          <textarea
            className="input"
            placeholder="Add your lore note..."
            value={caption}
            onChange={e => setCaption(e.target.value)}
            maxLength={280}
            rows={3}
          />
          <span className="text-small text-dim" style={{ textAlign: 'right' }}>
            {caption.length}/280
          </span>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || files.length === 0}
        >
          {loading ? (
            <><div className="spinner" style={{ width: 18, height: 18, margin: 0 }} /> Uploading proof...</>
          ) : (
            `Submit Proof${files.length > 0 ? ` (${files.length} file${files.length > 1 ? 's' : ''})` : ''}`
          )}
        </button>
      </div>
    </Layout>
  )
}

export default SubmitPage
