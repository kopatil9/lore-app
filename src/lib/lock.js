// Shared unlock-time logic for guest mission/proof/board access.
// Guests can always submit missions FOR Komal — these gates only cover
// Get My Mission, Submit Proof, and the Evidence Board.

// Returns true if the event's missions are still locked for guests.
export function isLocked(event) {
  if (!event || !event.unlock_at) return false
  return Date.now() < new Date(event.unlock_at).getTime()
}

// Friendly countdown-style label, e.g. "Unlocks Jul 11 at 6:30 PM"
export function unlockLabel(event) {
  if (!event?.unlock_at) return ''
  const d = new Date(event.unlock_at)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  })
}
