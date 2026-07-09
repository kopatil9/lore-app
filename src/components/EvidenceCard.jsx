import { useState } from 'react'

function EvidenceCard({ group, showActions = false, onApprove, onReject, onDelete, canDelete = false }) {
  // `group` = { id, guests, missions, caption, status, created_at, media: [{id, url, type}] }
  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)

  const media = group.media || []
  const count = media.length
  const current = media[index] || media[0]

  const timeAgo = (d) => {
    const diff = (Date.now() - new Date(d)) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const isVideo = (m) => m?.type?.startsWith('video/')

  const go = (dir, e) => {
    e?.stopPropagation()
    setIndex(prev => (prev + dir + count) % count)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm('Delete this submission? This cannot be undone.')) {
      onDelete?.(group)
    }
  }

  return (
    <>
      <div className="evidence-card" style={{ position: 'relative' }}>
        {canDelete && (
          <button
            onClick={handleDelete}
            aria-label="Delete submission"
            style={{
              position: 'absolute', top: 8, right: 8, zIndex: 4,
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(0,0,0,0.75)', border: '1.5px solid rgba(255,255,255,0.4)',
              color: 'white', fontSize: 15, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            }}
          >🗑</button>
        )}

        {current?.url && (
          <div
            className="evidence-card-media"
            style={{ cursor: 'pointer' }}
            onClick={() => setExpanded(true)}
          >
            {isVideo(current)
              ? <video src={current.url} playsInline muted preload="metadata" />
              : <img src={current.url} alt="" loading="lazy" />
            }

            {/* Multi-photo indicator (top-left) */}
            {count > 1 && (
              <div style={{
                position: 'absolute', top: 8, left: 8, zIndex: 3,
                background: 'rgba(0,0,0,0.6)', color: 'white',
                fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px',
                borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                ⧉ {index + 1}/{count}
              </div>
            )}

            {/* Carousel arrows */}
            {count > 1 && (
              <>
                <button onClick={(e) => go(-1, e)} style={arrowStyle('left')}>‹</button>
                <button onClick={(e) => go(1, e)} style={arrowStyle('right')}>›</button>
              </>
            )}

            <div className="evidence-card-check">✓</div>

            {/* Dots */}
            {count > 1 && (
              <div style={{
                position: 'absolute', bottom: 8, left: 0, right: 0, zIndex: 3,
                display: 'flex', justifyContent: 'center', gap: 4,
              }}>
                {media.map((_, i) => (
                  <span key={i} style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: i === index ? '#fff' : 'rgba(255,255,255,0.45)',
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="evidence-card-body">
          <div className="evidence-card-guest">{group.guests?.name || 'Unknown'}</div>
          <div className="evidence-card-mission">{group.missions?.title}</div>
          {group.caption && <p className="evidence-card-caption">"{group.caption}"</p>}
        </div>

        <div className="evidence-card-footer">
          <span style={{
            fontSize: '0.65rem', fontWeight: 600,
            color: group.status === 'approved' ? '#001FED' : group.status === 'rejected' ? '#C0392B' : '#BBBBC8',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {group.status === 'approved' ? '✓ Canon' : group.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
          </span>
          <span className="evidence-card-time">{timeAgo(group.created_at)}</span>
        </div>

        {showActions && group.status === 'pending' && (
          <div style={{ display: 'flex', gap: 8, padding: '0 10px 10px' }}>
            <button onClick={() => onApprove?.(group)} style={{ flex: 1, padding: '7px', borderRadius: 999, border: 'none', background: '#001FED', color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>✓ Approve</button>
            <button onClick={() => onReject?.(group)} style={{ flex: 1, padding: '7px', borderRadius: 999, border: 'none', background: '#FFF0EE', color: '#C0392B', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>✗ Reject</button>
          </div>
        )}
      </div>

      {/* ── EXPANDED LIGHTBOX ── */}
      {expanded && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.94)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          {/* Close */}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(false) }}
            style={{
              position: 'absolute', top: 'calc(16px + env(safe-area-inset-top))', right: 16, zIndex: 1002,
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
              fontSize: 22, cursor: 'pointer', lineHeight: 1,
            }}
          >×</button>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: 600, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isVideo(current)
                ? <video src={current.url} controls playsInline autoPlay style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 14 }} />
                : <img src={current.url} alt="" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 14 }} />
              }

              {count > 1 && (
                <>
                  <button onClick={(e) => go(-1, e)} style={lightboxArrow('left')}>‹</button>
                  <button onClick={(e) => go(1, e)} style={lightboxArrow('right')}>›</button>
                </>
              )}
            </div>

            {count > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
                {media.map((_, i) => (
                  <span key={i} style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: i === index ? '#fff' : 'rgba(255,255,255,0.4)',
                  }} />
                ))}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 16, color: 'white' }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{group.guests?.name}</div>
              <div style={{ color: '#24BBFE', fontSize: '0.82rem', fontWeight: 600, marginTop: 2 }}>
                {group.missions?.title}
              </div>
              {group.caption && (
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontStyle: 'italic', marginTop: 10, lineHeight: 1.5 }}>
                  "{group.caption}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function arrowStyle(side) {
  return {
    position: 'absolute', top: '50%', [side]: 6, transform: 'translateY(-50%)',
    zIndex: 3, width: 28, height: 28, borderRadius: '50%',
    background: 'rgba(0,0,0,0.45)', border: 'none', color: 'white',
    fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', lineHeight: 1, paddingBottom: 2,
  }
}

function lightboxArrow(side) {
  return {
    position: 'absolute', top: '50%', [side]: 10, transform: 'translateY(-50%)',
    zIndex: 1002, width: 42, height: 42, borderRadius: '50%',
    background: 'rgba(255,255,255,0.18)', border: 'none', color: 'white',
    fontSize: 26, cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', lineHeight: 1, paddingBottom: 3,
  }
}

export default EvidenceCard
