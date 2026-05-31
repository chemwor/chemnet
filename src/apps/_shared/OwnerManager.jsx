import { useState, useEffect, useCallback } from 'react'
import { useRepo } from '../../lib/repo/useRepo'
import { useProfile } from '../../context/ProfileContext'
import { RESOURCE_SCHEMAS, coerce, emptyForm, rowToForm } from '../../lib/contentSchemas'

// Generic owner-only editor, surfaced in place inside any member content app.
// Renders nothing unless the viewer OWNS this member node. Drives create /
// edit / delete through the repo (memberRepo → members.*; RLS enforces own
// rows). `onChange` lets the host app re-fetch after a write.
//
//   <OwnerManager resource="posts" onChange={reload} />
//
// Writes are no-ops on the flagship node (Eric edits via Admin), so this is
// gated to member-node owners only.

const fieldStyle = {
  width: '100%', background: 'var(--color-desktop-bg)', color: 'var(--color-text-primary)',
  border: '1px solid var(--color-bevel-dark)', outline: 'none', fontFamily: 'inherit',
  fontSize: 12, padding: '5px 7px', marginTop: 2,
}
const labelStyle = { color: 'var(--color-text-secondary)', fontSize: 11, display: 'block' }

function Field({ field, value, onChange }) {
  const set = (v) => onChange(field.key, v)
  if (field.type === 'textarea') {
    return <label style={labelStyle}>{field.label}<textarea value={value} onChange={e => set(e.target.value)} rows={4} style={{ ...fieldStyle, resize: 'vertical' }} /></label>
  }
  if (field.type === 'bool') {
    return <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={!!value} onChange={e => set(e.target.checked)} /> {field.label}</label>
  }
  if (field.type === 'select') {
    return <label style={labelStyle}>{field.label}<select value={value} onChange={e => set(e.target.value)} style={fieldStyle}>{field.options.map(o => <option key={o} value={o}>{o}</option>)}</select></label>
  }
  const inputType = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'
  return <label style={labelStyle}>{field.label}<input type={inputType} value={value} onChange={e => set(e.target.value)} style={fieldStyle} /></label>
}

export function OwnerManager({ resource, onChange }) {
  const { node, isOwner } = useProfile()
  const repo = useRepo()
  const schema = RESOURCE_SCHEMAS[resource]
  const api = repo[resource]

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)   // null | 'new' | id
  const [form, setForm] = useState({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    const data = await api.list()
    setItems(data || [])
  }, [api])

  // Load the list when the panel opens (reload is async — sets state after await).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (open) reload() }, [open, reload])

  // Only the owner of a member node sees the editor.
  if (node.kind !== 'member' || !isOwner || !schema || !api) return null

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const startNew = () => { setForm(emptyForm(schema)); setEditing('new'); setMsg('') }
  const startEdit = (item) => { setForm(rowToForm(schema, item)); setEditing(item.id); setMsg('') }

  const save = async () => {
    setBusy(true); setMsg('')
    const payload = {}
    for (const f of schema.fields) payload[f.key] = coerce(f.type, form[f.key])
    const res = editing === 'new' ? await api.create(payload) : await api.update(editing, payload)
    setBusy(false)
    if (!res) { setMsg('Save failed.'); return }
    setEditing(null)
    await reload()
    onChange?.()
  }

  const del = async (id) => {
    if (!confirm('Delete this item?')) return
    const ok = await api.remove(id)
    if (ok) { await reload(); onChange?.() }
  }

  const title = (it) => it[schema.title] || '(untitled)'

  return (
    <>
      {/* Floating owner affordance */}
      <button
        onClick={() => setOpen(true)}
        title="Manage your content"
        style={{
          position: 'absolute', right: 10, bottom: 10, zIndex: 50,
          background: 'var(--color-accent)', color: '#000', border: 'none', cursor: 'pointer',
          fontFamily: '"Courier Prime", monospace', fontWeight: 'bold', fontSize: 12,
          padding: '6px 10px', boxShadow: '2px 2px 0 rgba(0,0,0,0.4)',
        }}
      >
        ✎ Manage
      </button>

      {open && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', fontFamily: '"Courier Prime", "Courier New", monospace', color: 'var(--color-text-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid var(--color-bevel-dark)' }}>
            <span style={{ fontWeight: 'bold', fontSize: 13 }}>✎ Manage {resource}</span>
            <button onClick={() => { setOpen(false); setEditing(null) }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 13 }}>✕ Close</button>
          </div>

          {msg && <div style={{ padding: '4px 10px', fontSize: 11, color: msg.includes('fail') ? '#FF5555' : '#4ADE80' }}>{msg}</div>}

          {editing ? (
            <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => setEditing(null)} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>← Back to list</button>
              {schema.fields.map(f => (
                <Field key={f.key} field={f} value={form[f.key]} onChange={setField} />
              ))}
              <button onClick={save} disabled={busy} style={{ marginTop: 6, background: '#4ADE80', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 13, padding: '7px 12px', opacity: busy ? 0.6 : 1 }}>
                {editing === 'new' ? 'Create' : 'Save changes'}
              </button>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
              <button onClick={startNew} style={{ background: 'var(--color-accent)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 12, padding: '5px 10px', marginBottom: 8 }}>+ New</button>
              {items.length === 0 && <div style={{ color: 'var(--color-text-secondary)', fontSize: 12, padding: '8px 0' }}>Nothing here yet. Add your first.</div>}
              {items.map(it => (
                <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', marginBottom: 4, background: 'var(--color-titlebar-inactive)' }}>
                  <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title(it)}</span>
                  <button onClick={() => startEdit(it)} style={{ background: 'none', border: 'none', color: '#4A90D9', cursor: 'pointer', fontSize: 11, textDecoration: 'underline' }}>Edit</button>
                  <button onClick={() => del(it.id)} style={{ background: 'none', border: 'none', color: '#FF5555', cursor: 'pointer', fontSize: 11, textDecoration: 'underline' }}>Del</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
