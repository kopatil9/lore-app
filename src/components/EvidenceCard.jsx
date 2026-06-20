function EvidenceCard({ submission, showActions = false, onApprove, onReject }) {
  const isVideo = submission.media_type?.startsWith('video/')

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const getStatusBadge = (status) => {
    if (status === 'approved') return <span className="badge badge-green">✦ Canon Event</span>
    if (status === 'rejected') return <span className="badge badge-red">✗ Rejected</span>
    return <span className="badge badge-dim">⌛ Pending</span>
  }

  return (
    <div className="evidence-card">
      {submission.media_url && (
        <div className="evidence-card-media">
          {isVideo ? (
            <video
              src={submission.media_url}
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={submission.media_url}
              alt={`${submission.guests?.name}'s proof`}
              loading="lazy"
            />
          )}
          <div className="media-overlay" />
        </div>
      )}

      <div className="evidence-card-body">
        <div className="evidence-card-guest">
          {submission.guests?.name || 'Unknown Agent'}
        </div>
        <div className="evidence-card-mission">
          🎯 {submission.missions?.title || 'Unknown Mission'}
        </div>
        {submission.caption && (
          <p className="evidence-card-caption">"{submission.caption}"</p>
        )}
      </div>

      <div className="evidence-card-footer">
        {getStatusBadge(submission.status)}
        <span className="evidence-card-time">
          {timeAgo(submission.created_at)}
        </span>
      </div>

      {showActions && submission.status === 'pending' && (
        <div className="flex gap-sm" style={{ padding: '0 16px 16px' }}>
          <button
            className="btn btn-sm"
            style={{ background: 'var(--green)', color: '#000', flex: 1 }}
            onClick={() => onApprove?.(submission.id)}
          >
            ✓ Approve
          </button>
          <button
            className="btn btn-sm btn-danger"
            style={{ flex: 1 }}
            onClick={() => onReject?.(submission.id)}
          >
            ✗ Reject
          </button>
        </div>
      )}
    </div>
  )
}

export default EvidenceCard
