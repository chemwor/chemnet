import { useState, useEffect, useCallback } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useRepo } from '../../lib/repo/useRepo'
import { useProfile } from '../../context/ProfileContext'
import { useInitialItem } from '../../hooks/useInitialItem'
import { UploadButton } from '../_shared/UploadButton'

// ════════════════════════════════════════════════════════════════════════
// Travel Log — a Solari split-flap departures board (list) + passport detail.
// DB-backed on both nodes via repo.travelLog (public.travel_log on the
// flagship, members.travel_log on /u/:handle). Apps receive no props; owner
// editing (inline) is gated by isOwner; RLS enforces writes.
//   planned → itinerary checklist ("visa application")
//   visited → passport page + photo gallery
// ════════════════════════════════════════════════════════════════════════

// Deliberate retro palette (board + passport), outside the theme tokens.
const BOARD_BG = '#0c0c0e'
const AMBER = '#FFB000'
const GREEN = '#46d369'
const PAPER = '#efe6cf'
const PAPER_EDGE = '#d8c9a3'
const INK = '#2b2622'
const STAMP_RED = '#b23a3a'
const STAMP_NAVY = '#2a3d66'

// Normalize a repo row (new columns, with legacy member fallbacks) into a trip.
function normalizeTrip(r) {
  let place = r.place || ''
  let country = r.country || ''
  if (!country && r.destination) {
    const i = r.destination.indexOf(', ')
    if (i === -1) { country = r.destination } else { place = place || r.destination.slice(0, i); country = r.destination.slice(i + 2) }
  }
  const legacyPlan = Array.isArray(r.plan_items) ? r.plan_items
    : (r.data?.highlights || []).map(t => ({ text: t, done: false }))
  return {
    id: r.id,
    country, place,
    flag: r.flag || r.icon || '🌍',
    status: (r.status === 'visited' || r.status === 'completed') ? 'visited' : 'planned',
    start_date: r.start_date || null,
    end_date: r.end_date || null,
    notes: r.notes || r.summary || '',
    plan_items: legacyPlan,
    photo_urls: Array.isArray(r.photo_urls) ? r.photo_urls : (r.data?.photos || []),
  }
}

const display = (t) => (t.place ? `${t.place}, ${t.country}` : t.country) || 'Somewhere'
const gateCode = (id) => `${String.fromCharCode(65 + (Number(id) % 6))}${10 + (Number(id) % 80)}`
const fmtWhen = (t) => t.start_date ? new Date(t.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : 'TBD'
const fmtStamp = (t) => {
  const d = t.start_date || t.end_date
  return d ? new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : ''
}

// ── Split-flap tiles. `animKey` changing (filter) remounts → re-animation.
// CSS @media (prefers-reduced-motion) disables the flip. ──
function FlipText({ text, animKey, size = 15 }) {
  const chars = String(text || '').toUpperCase().split('')
  return (
    <span style={{ display: 'inline-flex', gap: 2, flexWrap: 'wrap' }}>
      {chars.map((ch, i) => (
        <span
          key={`${animKey}-${i}`}
          className="flap-tile"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: Math.round(size * 0.7), height: Math.round(size * 1.3), padding: '0 1px',
            background: 'linear-gradient(#222 0 49%, #0a0a0a 51% 100%)',
            color: '#f4f4f4', fontFamily: 'monospace', fontWeight: 700, fontSize: size,
            borderRadius: 2, boxShadow: 'inset 0 0 0 1px #2c2c2c', lineHeight: 1,
            animation: 'flapIn 0.42s both', animationDelay: `${Math.min(i, 24) * 0.03}s`,
          }}
        >{ch === ' ' ? ' ' : ch}</span>
      ))}
    </span>
  )
}

function StatusPill({ status }) {
  const visited = status === 'visited'
  return (
    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, letterSpacing: 1, color: visited ? GREEN : AMBER }}>
      {visited ? '● ARRIVED' : '○ PLANNED'}
    </span>
  )
}

// ── Desktop board ──
function Board({ trips, filter, setFilter, onOpen, isOwner, onNew }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: BOARD_BG, fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#000', borderBottom: `2px solid ${AMBER}` }}>
        <span style={{ color: AMBER, fontWeight: 700, letterSpacing: 3, fontSize: 16 }}>✈ DEPARTURES</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {['all', 'planned', 'visited'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '3px 10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, letterSpacing: 1, background: filter === f ? AMBER : 'transparent', color: filter === f ? '#000' : '#777', borderRadius: 2 }}>{f.toUpperCase()}</button>
          ))}
          {isOwner && <button onClick={onNew} style={{ padding: '3px 10px', border: `1px solid ${AMBER}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, background: 'transparent', color: AMBER, borderRadius: 2 }}>+ NEW</button>}
        </div>
      </div>

      {/* column headers */}
      <div style={{ display: 'flex', padding: '5px 14px', color: '#666', fontSize: 10, letterSpacing: 2, borderBottom: '1px solid #1c1c1c', flexShrink: 0 }}>
        <span style={{ flex: 1 }}>DESTINATION</span>
        <span style={{ width: 110 }}>STATUS</span>
        <span style={{ width: 90 }}>WHEN</span>
        <span style={{ width: 50, textAlign: 'right' }}>GATE</span>
      </div>

      <div key={filter} style={{ flex: 1, overflow: 'auto' }}>
        {trips.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#555', fontSize: 12 }}>No departures on the board.</div>}
        {trips.map(t => (
          <div
            key={t.id}
            onClick={() => onOpen(t.id)}
            style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderBottom: '1px solid #161616', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#141414')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 18 }}>{t.flag}</span>
              <FlipText text={display(t)} animKey={filter} />
            </span>
            <span style={{ width: 110 }}><StatusPill status={t.status} /></span>
            <span style={{ width: 90, color: '#cfcfcf', fontSize: 12, letterSpacing: 1 }}>{fmtWhen(t)}</span>
            <span style={{ width: 50, textAlign: 'right', color: AMBER, fontSize: 12, fontWeight: 700 }}>{gateCode(t.id)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Mobile boarding-pass cards ──
function BoardingPassList({ trips, filter, setFilter, onOpen, isOwner, onNew }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: BOARD_BG, fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', background: '#000', borderBottom: `2px solid ${AMBER}` }}>
        <span style={{ color: AMBER, fontWeight: 700, letterSpacing: 2, fontSize: 15 }}>✈ DEPARTURES</span>
        {isOwner && <button onClick={onNew} style={{ marginLeft: 'auto', padding: '4px 10px', border: `1px solid ${AMBER}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, background: 'transparent', color: AMBER, borderRadius: 2 }}>+ New</button>}
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '8px 14px', flexShrink: 0 }}>
        {['all', 'planned', 'visited'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 12px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, background: filter === f ? AMBER : '#1a1a1a', color: filter === f ? '#000' : '#888', borderRadius: 14 }}>{f[0].toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      <div key={filter} style={{ flex: 1, overflow: 'auto', padding: '4px 12px 16px' }}>
        {trips.map(t => {
          const visited = t.status === 'visited'
          return (
            <div key={t.id} onClick={() => onOpen(t.id)} style={{ display: 'flex', marginBottom: 10, background: '#f4f4f4', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
              <div style={{ width: 70, background: visited ? GREEN : AMBER, color: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                <span style={{ fontSize: 26 }}>{t.flag}</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, marginTop: 2 }}>{gateCode(t.id)}</span>
              </div>
              <div style={{ flex: 1, padding: '10px 12px', minWidth: 0 }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{display(t)}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, fontFamily: 'monospace' }}>
                  <span style={{ color: visited ? '#2a7d44' : '#9a6a00', fontWeight: 700 }}>{visited ? 'ARRIVED' : 'PLANNED'}</span>
                  <span style={{ color: '#555' }}>{fmtWhen(t)}</span>
                </div>
              </div>
              <div style={{ width: 22, borderLeft: '2px dashed #cfcfcf', background: 'repeating-linear-gradient(#f4f4f4, #f4f4f4 4px, #e6e6e6 4px, #e6e6e6 8px)' }} />
            </div>
          )
        })}
        {trips.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#555', fontSize: 13 }}>No departures on the board.</div>}
      </div>
    </div>
  )
}

// ── Owner: itinerary checklist (planned) ──
function PlanChecklist({ items, isOwner, onChange }) {
  const [text, setText] = useState('')
  const commit = (next) => onChange(next)
  const add = () => { const v = text.trim(); if (!v) return; commit([...items, { text: v, done: false }]); setText('') }
  return (
    <div>
      {items.length === 0 && !isOwner && <div style={{ fontSize: 12, color: '#7a7264', fontStyle: 'italic' }}>No itinerary yet.</div>}
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: `1px dotted ${PAPER_EDGE}` }}>
          <input type="checkbox" checked={!!it.done} disabled={!isOwner} onChange={() => commit(items.map((x, idx) => idx === i ? { ...x, done: !x.done } : x))} style={{ cursor: isOwner ? 'pointer' : 'default' }} />
          <span style={{ flex: 1, fontSize: 13, color: INK, textDecoration: it.done ? 'line-through' : 'none', opacity: it.done ? 0.55 : 1 }}>{it.text}</span>
          {isOwner && <button onClick={() => commit(items.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: STAMP_RED, fontSize: 14 }}>×</button>}
        </div>
      ))}
      {isOwner && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Add a stop, booking, plan…" style={{ flex: 1, padding: '5px 8px', border: `1px solid ${PAPER_EDGE}`, background: '#fff', color: INK, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
          <button onClick={add} style={{ padding: '5px 12px', border: 'none', cursor: 'pointer', background: STAMP_NAVY, color: '#fff', fontWeight: 700, fontSize: 13 }}>Add</button>
        </div>
      )}
    </div>
  )
}

// ── Owner: photo gallery (visited) ──
function PhotoGallery({ photos, isOwner, onAdd }) {
  const [url, setUrl] = useState('')
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {photos.map((p, i) => (
          <a key={i} href={p} target="_blank" rel="noreferrer" style={{ display: 'block', aspectRatio: '1', background: '#000', borderRadius: 3, overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
            <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </a>
        ))}
        {photos.length === 0 && !isOwner && <div style={{ gridColumn: '1 / -1', fontSize: 12, color: '#7a7264', fontStyle: 'italic' }}>No photos yet.</div>}
      </div>
      {isOwner && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <UploadButton bucket="photos" label="+ Add photo" onUploaded={(u) => onAdd(u)} />
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="…or paste an image URL" style={{ flex: 1, padding: '5px 8px', border: `1px solid ${PAPER_EDGE}`, background: '#fff', color: INK, fontFamily: 'inherit', fontSize: 12, outline: 'none' }} />
            <button onClick={() => { const v = url.trim(); if (v) { onAdd(v); setUrl('') } }} style={{ padding: '5px 12px', border: 'none', cursor: 'pointer', background: STAMP_NAVY, color: '#fff', fontWeight: 700, fontSize: 12 }}>Add</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Create / edit form (owner) ──
const FIELD = { width: '100%', padding: '7px 9px', border: `1px solid ${PAPER_EDGE}`, background: '#fff', color: INK, fontFamily: 'monospace', fontSize: 13, outline: 'none', marginTop: 2 }
const LBL = { display: 'block', fontSize: 11, color: '#7a7264', letterSpacing: 1, marginTop: 8 }

function TripForm({ trip, onSave, onCancel, onDelete, busy }) {
  const [f, setF] = useState({
    country: trip?.country || '', place: trip?.place || '', flag: trip?.flag || '',
    status: trip?.status || 'planned', start_date: trip?.start_date || '', end_date: trip?.end_date || '', notes: trip?.notes || '',
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const save = () => onSave({
    country: f.country.trim(), place: f.place.trim() || null, flag: f.flag.trim() || '🌍',
    status: f.status, start_date: f.start_date || null, end_date: f.end_date || null, notes: f.notes.trim() || null,
  })
  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16, color: INK, marginBottom: 4 }}>{trip ? 'Edit trip' : 'New trip'}</div>
      <label style={LBL}>Country<input value={f.country} onChange={e => set('country', e.target.value)} style={FIELD} /></label>
      <label style={LBL}>Place / city (optional)<input value={f.place} onChange={e => set('place', e.target.value)} style={FIELD} /></label>
      <label style={LBL}>Flag emoji<input value={f.flag} onChange={e => set('flag', e.target.value)} placeholder="🇯🇵" style={FIELD} /></label>
      <label style={LBL}>Status
        <select value={f.status} onChange={e => set('status', e.target.value)} style={FIELD}>
          <option value="planned">planned</option>
          <option value="visited">visited</option>
        </select>
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <label style={{ ...LBL, flex: 1 }}>Start<input type="date" value={f.start_date || ''} onChange={e => set('start_date', e.target.value)} style={FIELD} /></label>
        <label style={{ ...LBL, flex: 1 }}>End<input type="date" value={f.end_date || ''} onChange={e => set('end_date', e.target.value)} style={FIELD} /></label>
      </div>
      <label style={LBL}>Notes / journal<textarea value={f.notes} onChange={e => set('notes', e.target.value)} rows={4} style={{ ...FIELD, resize: 'vertical' }} /></label>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={save} disabled={busy || !f.country.trim()} style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', background: STAMP_NAVY, color: '#fff', fontWeight: 700, fontSize: 13, opacity: (busy || !f.country.trim()) ? 0.6 : 1 }}>{busy ? 'Saving…' : 'Save'}</button>
        <button onClick={onCancel} style={{ padding: '8px 16px', border: `1px solid ${PAPER_EDGE}`, cursor: 'pointer', background: 'transparent', color: INK, fontSize: 13 }}>Cancel</button>
        {trip && onDelete && <button onClick={onDelete} style={{ marginLeft: 'auto', padding: '8px 16px', border: 'none', cursor: 'pointer', background: 'transparent', color: STAMP_RED, fontSize: 13, textDecoration: 'underline' }}>Delete trip</button>}
      </div>
    </div>
  )
}

// ── Detail: passport (visited) / visa-application itinerary (planned) ──
function TripDetail({ trip, isOwner, repo, onChange, onClose, onEdit }) {
  const visited = trip.status === 'visited'
  const setPlan = async (items) => { await repo.travelLog.setPlanItems(trip.id, items); onChange() }
  const addPhoto = async (url) => { await repo.travelLog.addPhoto(trip.id, url); onChange() }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', background: '#1b1814', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#000', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: AMBER, fontFamily: 'monospace', fontSize: 13 }}>← Departures</button>
        {isOwner && <button onClick={onEdit} style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${AMBER}`, cursor: 'pointer', color: AMBER, fontFamily: 'monospace', fontSize: 12, padding: '3px 10px', borderRadius: 2 }}>Edit</button>}
      </div>

      <div style={{ flex: 1, padding: 16, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 520, background: PAPER, border: `1px solid ${PAPER_EDGE}`, boxShadow: '0 6px 24px rgba(0,0,0,0.5)', padding: 20, position: 'relative', fontFamily: 'monospace' }}>
          {/* passport/visa header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${STAMP_NAVY}`, paddingBottom: 8 }}>
            <span style={{ fontSize: 11, letterSpacing: 2, color: STAMP_NAVY }}>{visited ? 'PASSPORT · ENTRY RECORD' : 'TRAVEL VISA · APPLICATION'}</span>
            <span style={{ fontSize: 11, color: '#8a7f6a' }}>GATE {gateCode(trip.id)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
            <span style={{ fontSize: 44 }}>{trip.flag}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: INK, lineHeight: 1.1 }}>{display(trip)}</div>
              <div style={{ fontSize: 12, color: '#8a7f6a', marginTop: 3 }}>
                {trip.start_date ? `${fmtStamp(trip)}${trip.end_date ? ' → ' + new Date(trip.end_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : ''}` : 'Dates TBD'}
              </div>
            </div>
          </div>

          {/* overprint stamp */}
          {visited ? (
            <div style={{ position: 'absolute', top: 60, right: 18, transform: 'rotate(-14deg)', border: `3px double ${GREEN}`, color: GREEN, padding: '4px 10px', fontWeight: 700, letterSpacing: 2, fontSize: 13, opacity: 0.85, borderRadius: 4, textAlign: 'center' }}>
              ADMITTED<div style={{ fontSize: 9, letterSpacing: 1 }}>{fmtStamp(trip) || '— — —'}</div>
            </div>
          ) : (
            <div style={{ position: 'absolute', top: 56, right: 14, transform: 'rotate(-12deg)', border: `3px double ${STAMP_RED}`, color: STAMP_RED, padding: '4px 10px', fontWeight: 700, letterSpacing: 2, fontSize: 14, opacity: 0.8, borderRadius: 4 }}>
              VISA PENDING
            </div>
          )}

          {/* body */}
          <div style={{ marginTop: 20 }}>
            {visited ? (
              <>
                <div style={{ fontSize: 11, letterSpacing: 2, color: STAMP_NAVY, marginBottom: 6 }}>PHOTOS</div>
                <PhotoGallery photos={trip.photo_urls} isOwner={isOwner} onAdd={addPhoto} />
                <div style={{ fontSize: 11, letterSpacing: 2, color: STAMP_NAVY, margin: '16px 0 6px' }}>JOURNAL</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: INK, whiteSpace: 'pre-wrap' }}>{trip.notes || (isOwner ? 'Add a journal entry with Edit.' : 'No journal entry.')}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 11, letterSpacing: 2, color: STAMP_NAVY, marginBottom: 6 }}>ITINERARY</div>
                <PlanChecklist items={trip.plan_items} isOwner={isOwner} onChange={setPlan} />
                {trip.notes && <>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: STAMP_NAVY, margin: '16px 0 6px' }}>NOTES</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: INK, whiteSpace: 'pre-wrap' }}>{trip.notes}</div>
                </>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main ──
export default function Trips() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const repo = useRepo()
  const { isOwner } = useProfile()
  const [trips, setTrips] = useState([])
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)   // null | 'new' | trip id
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const rows = await repo.travelLog.list()
    setTrips((rows || []).map(normalizeTrip))
  }, [repo])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  // Deep-link from ChemFeed.
  const initialItem = useInitialItem('trips')
  useEffect(() => {
    if (!initialItem || !trips.length) return
    const t = trips.find(x => String(x.id) === String(initialItem))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (t) setSelectedId(t.id)
  }, [initialItem, trips])

  const filtered = trips.filter(t => filter === 'all' || t.status === filter)
  const selected = trips.find(t => t.id === selectedId)
  const editingTrip = editing && editing !== 'new' ? trips.find(t => t.id === editing) : null

  const saveTrip = async (patch) => {
    setBusy(true)
    if (editing === 'new') await repo.travelLog.create(patch)
    else await repo.travelLog.update(editing, patch)
    setBusy(false)
    setEditing(null)
    await load()
  }
  const deleteTrip = async () => {
    if (!window.confirm('Delete this trip?')) return
    await repo.travelLog.remove(editing)
    setEditing(null)
    setSelectedId(null)
    await load()
  }

  // Owner create/edit form takes over the whole surface.
  if (editing) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'auto', background: '#1b1814', padding: 16 }}>
        <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: AMBER, fontFamily: 'monospace', fontSize: 13, marginBottom: 12 }}>← Back</button>
        <TripForm trip={editingTrip} busy={busy} onSave={saveTrip} onCancel={() => setEditing(null)} onDelete={editingTrip ? deleteTrip : null} />
      </div>
    )
  }

  if (selected) {
    return <TripDetail trip={selected} isOwner={isOwner} repo={repo} onChange={load} onClose={() => setSelectedId(null)} onEdit={() => setEditing(selected.id)} />
  }

  const boardProps = { trips: filtered, filter, setFilter: (f) => { setFilter(f); setSelectedId(null) }, onOpen: setSelectedId, isOwner, onNew: () => setEditing('new') }
  return isMobile ? <BoardingPassList {...boardProps} /> : <Board {...boardProps} />
}
