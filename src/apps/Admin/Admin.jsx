import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

// ── Login Screen ──
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    const { error } = await onLogin(email)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="flex items-center justify-center h-full" style={{ background: '#1a1a2e' }}>
      <div className="text-center p-6" style={{ background: '#222', border: '1px solid #444', maxWidth: 320, fontFamily: 'monospace' }}>
        <div className="text-lg font-bold mb-1" style={{ color: '#FF6B35' }}>🔐 Admin Login</div>
        <div className="text-xs mb-4" style={{ color: '#666' }}>ChemNet Control Panel</div>
        {sent ? (
          <div className="text-sm" style={{ color: '#4ADE80' }}>
            Magic link sent to {email}.<br />Check your inbox.
          </div>
        ) : (
          <>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin email"
              className="w-full px-2 py-1.5 mb-2 text-sm border-none outline-none"
              style={{ background: '#111', color: '#ccc', fontFamily: 'monospace' }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              className="w-full px-3 py-1.5 text-sm font-bold border-none cursor-pointer"
              style={{ background: '#FF6B35', color: '#000', fontFamily: 'monospace' }}
            >
              Send Magic Link
            </button>
            {error && <div className="mt-2 text-xs" style={{ color: '#FF4444' }}>{error}</div>}
          </>
        )}
      </div>
    </div>
  )
}

// ── Section: Blog Manager ──
function BlogManager() {
  const [posts, setPosts] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', filename: '', content: '', raw: '', note: '', layer: 1, published: true })

  useEffect(() => { loadPosts() }, [])

  async function loadPosts() {
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    setPosts(data || [])
  }

  function startNew() {
    setForm({ title: '', filename: '', content: '', raw: '', note: '', layer: 1, published: true })
    setEditing('new')
  }

  function startEdit(post) {
    setForm({ title: post.title, filename: post.filename, content: post.content, raw: post.raw || '', note: post.note || '', layer: post.layer, published: post.published })
    setEditing(post.id)
  }

  async function save() {
    const data = { ...form, updated_at: new Date().toISOString() }
    if (!data.filename) data.filename = data.title.replace(/\s+/g, ' ').trim() + '.doc'
    if (editing === 'new') {
      await supabase.from('blog_posts').insert(data)
    } else {
      await supabase.from('blog_posts').update(data).eq('id', editing)
    }
    setEditing(null)
    loadPosts()
  }

  async function deletePost(id) {
    await supabase.from('blog_posts').delete().eq('id', id)
    loadPosts()
  }

  if (editing) {
    return (
      <div className="p-3 overflow-auto" style={{ fontSize: 12, fontFamily: 'monospace' }}>
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => setEditing(null)} className="text-xs underline border-none bg-transparent cursor-pointer" style={{ color: '#FF6B35' }}>← Back</button>
          <span className="font-bold" style={{ color: '#ccc' }}>{editing === 'new' ? 'New Post' : 'Edit Post'}</span>
        </div>
        <div className="flex flex-col gap-2">
          <label style={{ color: '#888' }}>Title
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-2 py-1 mt-0.5 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
          </label>
          <label style={{ color: '#888' }}>Filename
            <input value={form.filename} onChange={e => setForm({ ...form, filename: e.target.value })} placeholder="Auto from title" className="w-full px-2 py-1 mt-0.5 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
          </label>
          <label style={{ color: '#888' }}>Content (polished)
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={10} className="w-full px-2 py-1 mt-0.5 border-none outline-none text-sm resize-y" style={{ background: '#111', color: '#ccc' }} />
          </label>
          <label style={{ color: '#888' }}>Raw Draft
            <textarea value={form.raw} onChange={e => setForm({ ...form, raw: e.target.value })} rows={6} className="w-full px-2 py-1 mt-0.5 border-none outline-none text-sm resize-y" style={{ background: '#111', color: '#ccc' }} />
          </label>
          <label style={{ color: '#888' }}>Note
            <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="w-full px-2 py-1 mt-0.5 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1" style={{ color: '#888' }}>
              Layer <input type="number" min={1} max={5} value={form.layer} onChange={e => setForm({ ...form, layer: parseInt(e.target.value) })} className="w-12 px-1 py-0.5 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
            </label>
            <label className="flex items-center gap-1" style={{ color: '#888' }}>
              <input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} /> Published
            </label>
          </div>
          <button onClick={save} className="px-4 py-1.5 text-sm font-bold border-none cursor-pointer mt-2" style={{ background: '#4ADE80', color: '#000', fontFamily: 'monospace' }}>
            {editing === 'new' ? 'Create Post' : 'Save Changes'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 overflow-auto" style={{ fontSize: 12, fontFamily: 'monospace' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold" style={{ color: '#ccc' }}>Blog Posts ({posts.length})</span>
        <button onClick={startNew} className="px-2 py-0.5 text-xs font-bold border-none cursor-pointer" style={{ background: '#FF6B35', color: '#000' }}>[NEW POST]</button>
      </div>
      {posts.map(p => (
        <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 mb-1" style={{ background: '#1a1a1a', borderLeft: p.published ? '2px solid #4ADE80' : '2px solid #555' }}>
          <div className="flex-1">
            <div style={{ color: '#ccc' }}>{p.title}</div>
            <div className="text-xs" style={{ color: '#555' }}>Layer {p.layer} · {p.published ? 'Published' : 'Draft'} · {new Date(p.created_at).toLocaleDateString()}</div>
          </div>
          <button onClick={() => startEdit(p)} className="text-xs border-none bg-transparent cursor-pointer underline" style={{ color: '#4A90D9' }}>Edit</button>
          <button onClick={() => deletePost(p.id)} className="text-xs border-none bg-transparent cursor-pointer underline" style={{ color: '#FF4444' }}>Delete</button>
        </div>
      ))}
      {posts.length === 0 && <div className="text-xs py-4 text-center" style={{ color: '#555' }}>No posts yet. Create one!</div>}
    </div>
  )
}

// ── Section: Quick Add (Reviews, Restaurants) ──
function QuickAdd() {
  const [type, setType] = useState('review')
  const [msg, setMsg] = useState('')

  const [reviewForm, setReviewForm] = useState({ category: 'movies', title: '', year: 2026, rating: 0, status: 'watched', poster: '🎬', review: '', analysis: '', tags: '' })
  const [restForm, setRestForm] = useState({ name: '', location: '', cuisine: '', status: 'been', rating: 0, icon: '🍽️', review: '', favorite: '', vibe: '', why: '' })

  async function saveReview() {
    const { error } = await supabase.from('reviews').insert({
      ...reviewForm,
      tags: reviewForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      analysis: reviewForm.analysis || null,
    })
    if (error) setMsg(`Error: ${error.message}`)
    else { setMsg('Review saved!'); setReviewForm({ category: 'movies', title: '', year: 2026, rating: 0, status: 'watched', poster: '🎬', review: '', analysis: '', tags: '' }) }
  }

  async function saveRestaurant() {
    const { error } = await supabase.from('restaurants').insert({
      ...restForm,
      why: restForm.why || null,
    })
    if (error) setMsg(`Error: ${error.message}`)
    else { setMsg('Restaurant saved!'); setRestForm({ name: '', location: '', cuisine: '', status: 'been', rating: 0, icon: '🍽️', review: '', favorite: '', vibe: '', why: '' }) }
  }

  return (
    <div className="p-3 overflow-auto" style={{ fontSize: 12, fontFamily: 'monospace' }}>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setType('review')} className="px-2 py-0.5 text-xs border-none cursor-pointer" style={{ background: type === 'review' ? '#FF6B35' : '#333', color: type === 'review' ? '#000' : '#888' }}>Review</button>
        <button onClick={() => setType('restaurant')} className="px-2 py-0.5 text-xs border-none cursor-pointer" style={{ background: type === 'restaurant' ? '#FF6B35' : '#333', color: type === 'restaurant' ? '#000' : '#888' }}>Restaurant</button>
      </div>

      {msg && <div className="mb-2 text-xs px-2 py-1" style={{ background: msg.includes('Error') ? '#331111' : '#113311', color: msg.includes('Error') ? '#FF4444' : '#4ADE80' }}>{msg}</div>}

      {type === 'review' && (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <select value={reviewForm.category} onChange={e => setReviewForm({ ...reviewForm, category: e.target.value })} className="px-1 py-0.5 border-none text-xs" style={{ background: '#111', color: '#ccc' }}>
              <option value="movies">Movie</option><option value="tv">TV Show</option>
            </select>
            <select value={reviewForm.status} onChange={e => setReviewForm({ ...reviewForm, status: e.target.value })} className="px-1 py-0.5 border-none text-xs" style={{ background: '#111', color: '#ccc' }}>
              <option value="watched">Watched</option><option value="watchlist">Watchlist</option>
            </select>
          </div>
          <input value={reviewForm.title} onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })} placeholder="Title" className="w-full px-2 py-1 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
          <div className="flex gap-2">
            <input type="number" value={reviewForm.year} onChange={e => setReviewForm({ ...reviewForm, year: parseInt(e.target.value) })} className="w-16 px-1 py-0.5 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
            <input type="number" min={0} max={10} value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })} placeholder="Rating /10" className="w-16 px-1 py-0.5 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
            <input value={reviewForm.poster} onChange={e => setReviewForm({ ...reviewForm, poster: e.target.value })} placeholder="Emoji" className="w-12 px-1 py-0.5 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
          </div>
          <input value={reviewForm.tags} onChange={e => setReviewForm({ ...reviewForm, tags: e.target.value })} placeholder="Tags (comma separated)" className="w-full px-2 py-1 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
          <textarea value={reviewForm.review} onChange={e => setReviewForm({ ...reviewForm, review: e.target.value })} placeholder="Quick take" rows={3} className="w-full px-2 py-1 border-none outline-none text-sm resize-y" style={{ background: '#111', color: '#ccc' }} />
          <textarea value={reviewForm.analysis} onChange={e => setReviewForm({ ...reviewForm, analysis: e.target.value })} placeholder="Full analysis (optional)" rows={4} className="w-full px-2 py-1 border-none outline-none text-sm resize-y" style={{ background: '#111', color: '#ccc' }} />
          <button onClick={saveReview} className="px-3 py-1.5 text-sm font-bold border-none cursor-pointer" style={{ background: '#4ADE80', color: '#000' }}>Save Review</button>
        </div>
      )}

      {type === 'restaurant' && (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <select value={restForm.status} onChange={e => setRestForm({ ...restForm, status: e.target.value })} className="px-1 py-0.5 border-none text-xs" style={{ background: '#111', color: '#ccc' }}>
              <option value="been">Been To</option><option value="want">Want To Try</option>
            </select>
            <input value={restForm.icon} onChange={e => setRestForm({ ...restForm, icon: e.target.value })} placeholder="Emoji" className="w-12 px-1 py-0.5 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
          </div>
          <input value={restForm.name} onChange={e => setRestForm({ ...restForm, name: e.target.value })} placeholder="Name" className="w-full px-2 py-1 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
          <input value={restForm.location} onChange={e => setRestForm({ ...restForm, location: e.target.value })} placeholder="Location" className="w-full px-2 py-1 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
          <div className="flex gap-2">
            <input value={restForm.cuisine} onChange={e => setRestForm({ ...restForm, cuisine: e.target.value })} placeholder="Cuisine" className="flex-1 px-2 py-1 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
            <input type="number" min={0} max={10} value={restForm.rating} onChange={e => setRestForm({ ...restForm, rating: parseInt(e.target.value) })} className="w-14 px-1 py-0.5 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
          </div>
          <textarea value={restForm.review} onChange={e => setRestForm({ ...restForm, review: e.target.value })} placeholder="Review" rows={3} className="w-full px-2 py-1 border-none outline-none text-sm resize-y" style={{ background: '#111', color: '#ccc' }} />
          <input value={restForm.favorite} onChange={e => setRestForm({ ...restForm, favorite: e.target.value })} placeholder="Order this:" className="w-full px-2 py-1 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
          <input value={restForm.vibe} onChange={e => setRestForm({ ...restForm, vibe: e.target.value })} placeholder="Vibe" className="w-full px-2 py-1 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
          <input value={restForm.why} onChange={e => setRestForm({ ...restForm, why: e.target.value })} placeholder="Why I want to go (for bucket list)" className="w-full px-2 py-1 border-none outline-none text-sm" style={{ background: '#111', color: '#ccc' }} />
          <button onClick={saveRestaurant} className="px-3 py-1.5 text-sm font-bold border-none cursor-pointer" style={{ background: '#4ADE80', color: '#000' }}>Save Restaurant</button>
        </div>
      )}
    </div>
  )
}

// ── Section: Messages (ChemMail inbox) ──
function MessagesView() {
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => { loadMessages() }, [])

  async function loadMessages() {
    const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false })
    setMessages(data || [])
  }

  async function markRead(id) {
    await supabase.from('contact_messages').update({ read: true }).eq('id', id)
    loadMessages()
  }

  const sel = messages.find(m => m.id === selected)

  return (
    <div className="flex h-full" style={{ fontSize: 12, fontFamily: 'monospace' }}>
      <div className="flex-1 overflow-auto border-r" style={{ borderColor: '#333' }}>
        {messages.map(m => (
          <div key={m.id} onClick={() => { setSelected(m.id); markRead(m.id) }} className="px-2 py-1.5 cursor-pointer" style={{ background: selected === m.id ? '#1a1a3a' : 'transparent', borderBottom: '1px solid #1a1a1a' }}>
            <div className="flex items-center gap-1">
              <span style={{ color: m.read ? '#555' : '#4ADE80', fontSize: 8 }}>{m.read ? '○' : '●'}</span>
              <span className="truncate" style={{ color: '#ccc', fontWeight: m.read ? 'normal' : 'bold' }}>{m.from_email}</span>
            </div>
            <div className="truncate text-xs" style={{ color: '#666' }}>{m.subject}</div>
          </div>
        ))}
        {messages.length === 0 && <div className="p-4 text-center text-xs" style={{ color: '#555' }}>No messages yet</div>}
      </div>
      {sel && (
        <div className="flex-1 overflow-auto p-3">
          <div className="text-xs mb-1" style={{ color: '#888' }}>From: {sel.from_email}</div>
          <div className="text-xs mb-1" style={{ color: '#888' }}>Date: {new Date(sel.created_at).toLocaleString()}</div>
          <div className="font-bold mb-2" style={{ color: '#ccc' }}>{sel.subject}</div>
          <div className="text-sm whitespace-pre-wrap" style={{ color: '#aaa', lineHeight: 1.6 }}>{sel.body}</div>
        </div>
      )}
    </div>
  )
}

// ── Main Admin Panel ──
const SECTIONS = [
  { id: 'blog', label: '📝 Blog', component: BlogManager },
  { id: 'quickadd', label: '➕ Quick Add', component: QuickAdd },
  { id: 'messages', label: '📧 Messages', component: MessagesView },
]

export default function Admin() {
  const { user, isAdmin, loading, loginWithMagicLink, logout } = useAuth()
  const [section, setSection] = useState('blog')

  if (loading) {
    return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', color: '#555', fontFamily: 'monospace' }}>Loading...</div>
  }

  if (!user || !isAdmin) {
    return <LoginScreen onLogin={loginWithMagicLink} />
  }

  const ActiveSection = SECTIONS.find(s => s.id === section)?.component || BlogManager

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#111', fontFamily: 'monospace', color: '#ccc' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 shrink-0" style={{ background: '#1a1a2e', borderBottom: '1px solid #333' }}>
        <div className="flex items-center gap-1">
          <span style={{ color: '#FF6B35' }}>⚙️</span>
          <span className="font-bold text-sm">ChemNet Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#555' }}>{user.email}</span>
          <button onClick={logout} className="text-xs border-none bg-transparent cursor-pointer underline" style={{ color: '#666' }}>Logout</button>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-1 px-2 py-1 shrink-0" style={{ background: '#0f0f1a', borderBottom: '1px solid #333' }}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className="px-2 py-0.5 text-xs border-none cursor-pointer"
            style={{
              background: section === s.id ? '#FF6B35' : 'transparent',
              color: section === s.id ? '#000' : '#666',
              fontFamily: 'monospace',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <ActiveSection />
      </div>
    </div>
  )
}
