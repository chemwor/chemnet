import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

// Shared styles
const inputStyle = { background: '#111', color: '#ccc', fontFamily: 'monospace' }
const btnAccent = { background: '#FF6B35', color: '#000', fontFamily: 'monospace' }
const btnSave = { background: '#4ADE80', color: '#000', fontFamily: 'monospace' }
const btnDanger = { color: '#FF4444' }
const btnLink = { color: '#4A90D9' }
const labelStyle = { color: '#888' }

function StatusMsg({ msg }) {
  if (!msg) return null
  const isErr = msg.includes('Error')
  return <div className="mb-2 text-xs px-2 py-1" style={{ background: isErr ? '#331111' : '#113311', color: isErr ? '#FF4444' : '#4ADE80' }}>{msg}</div>
}

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
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              className="w-full px-3 py-1.5 text-sm font-bold border-none cursor-pointer"
              style={btnAccent}
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
  const [msg, setMsg] = useState('')

  useEffect(() => { loadPosts() }, [])

  async function loadPosts() {
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    setPosts(data || [])
  }

  function startNew() {
    setForm({ title: '', filename: '', content: '', raw: '', note: '', layer: 1, published: true })
    setEditing('new')
    setMsg('')
  }

  function startEdit(post) {
    setForm({ title: post.title, filename: post.filename, content: post.content, raw: post.raw || '', note: post.note || '', layer: post.layer, published: post.published })
    setEditing(post.id)
    setMsg('')
  }

  async function save() {
    const data = { ...form, updated_at: new Date().toISOString() }
    if (!data.filename) data.filename = data.title.replace(/\s+/g, ' ').trim() + '.doc'
    let error
    if (editing === 'new') {
      ({ error } = await supabase.from('blog_posts').insert(data))
    } else {
      ({ error } = await supabase.from('blog_posts').update(data).eq('id', editing))
    }
    if (error) { setMsg(`Error: ${error.message}`); return }
    setMsg(editing === 'new' ? 'Post created!' : 'Post saved!')
    setEditing(null)
    loadPosts()
  }

  async function deletePost(id) {
    if (!confirm('Delete this post?')) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) setMsg(`Error: ${error.message}`)
    else loadPosts()
  }

  if (editing) {
    return (
      <div className="p-3 overflow-auto h-full" style={{ fontSize: 12, fontFamily: 'monospace' }}>
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => setEditing(null)} className="text-xs underline border-none bg-transparent cursor-pointer" style={{ color: '#FF6B35' }}>← Back</button>
          <span className="font-bold" style={{ color: '#ccc' }}>{editing === 'new' ? 'New Post' : 'Edit Post'}</span>
        </div>
        <StatusMsg msg={msg} />
        <div className="flex flex-col gap-2">
          <label style={labelStyle}>Title
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-2 py-1 mt-0.5 border-none outline-none text-sm" style={inputStyle} />
          </label>
          <label style={labelStyle}>Filename
            <input value={form.filename} onChange={e => setForm({ ...form, filename: e.target.value })} placeholder="Auto from title" className="w-full px-2 py-1 mt-0.5 border-none outline-none text-sm" style={inputStyle} />
          </label>
          <label style={labelStyle}>Content (polished)
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={10} className="w-full px-2 py-1 mt-0.5 border-none outline-none text-sm resize-y" style={inputStyle} />
          </label>
          <label style={labelStyle}>Raw Draft
            <textarea value={form.raw} onChange={e => setForm({ ...form, raw: e.target.value })} rows={6} className="w-full px-2 py-1 mt-0.5 border-none outline-none text-sm resize-y" style={inputStyle} />
          </label>
          <label style={labelStyle}>Note
            <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="w-full px-2 py-1 mt-0.5 border-none outline-none text-sm" style={inputStyle} />
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1" style={labelStyle}>
              Layer <input type="number" min={1} max={5} value={form.layer} onChange={e => setForm({ ...form, layer: parseInt(e.target.value) || 1 })} className="w-12 px-1 py-0.5 border-none outline-none text-sm" style={inputStyle} />
            </label>
            <label className="flex items-center gap-1" style={labelStyle}>
              <input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} /> Published
            </label>
          </div>
          <button onClick={save} className="px-4 py-1.5 text-sm font-bold border-none cursor-pointer mt-2" style={btnSave}>
            {editing === 'new' ? 'Create Post' : 'Save Changes'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 overflow-auto h-full" style={{ fontSize: 12, fontFamily: 'monospace' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold" style={{ color: '#ccc' }}>Blog Posts ({posts.length})</span>
        <button onClick={startNew} className="px-2 py-0.5 text-xs font-bold border-none cursor-pointer" style={btnAccent}>[NEW POST]</button>
      </div>
      <StatusMsg msg={msg} />
      {posts.map(p => (
        <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 mb-1" style={{ background: '#1a1a1a', borderLeft: p.published ? '2px solid #4ADE80' : '2px solid #555' }}>
          <div className="flex-1 min-w-0">
            <div className="truncate" style={{ color: '#ccc' }}>{p.title}</div>
            <div className="text-xs" style={{ color: '#555' }}>Layer {p.layer} · {p.published ? 'Published' : 'Draft'} · {new Date(p.created_at).toLocaleDateString()}</div>
          </div>
          <button onClick={() => startEdit(p)} className="text-xs border-none bg-transparent cursor-pointer underline shrink-0" style={btnLink}>Edit</button>
          <button onClick={() => deletePost(p.id)} className="text-xs border-none bg-transparent cursor-pointer underline shrink-0" style={btnDanger}>Del</button>
        </div>
      ))}
      {posts.length === 0 && <div className="text-xs py-4 text-center" style={{ color: '#555' }}>No posts yet. Create one!</div>}
    </div>
  )
}

// ── Section: Hidden Files Manager (Layer 2+ terminal secrets) ──
function HiddenFilesManager() {
  const [files, setFiles] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ filename: '', content: '', raw: '', layer: 2 })
  const [msg, setMsg] = useState('')

  useEffect(() => { loadFiles() }, [])

  async function loadFiles() {
    const { data } = await supabase.from('hidden_files').select('*').order('created_at', { ascending: false })
    setFiles(data || [])
  }

  function startNew() {
    setForm({ filename: '', content: '', raw: '', layer: 2 })
    setEditing('new')
    setMsg('')
  }

  function startEdit(file) {
    setForm({ filename: file.filename, content: file.content, raw: file.raw || '', layer: file.layer })
    setEditing(file.id)
    setMsg('')
  }

  async function save() {
    const data = { ...form, updated_at: new Date().toISOString() }
    let error
    if (editing === 'new') {
      ({ error } = await supabase.from('hidden_files').insert(data))
    } else {
      ({ error } = await supabase.from('hidden_files').update(data).eq('id', editing))
    }
    if (error) { setMsg(`Error: ${error.message}`); return }
    setMsg(editing === 'new' ? 'File created!' : 'File saved!')
    setEditing(null)
    loadFiles()
  }

  async function deleteFile(id) {
    if (!confirm('Delete this hidden file?')) return
    const { error } = await supabase.from('hidden_files').delete().eq('id', id)
    if (error) setMsg(`Error: ${error.message}`)
    else loadFiles()
  }

  if (editing) {
    return (
      <div className="p-3 overflow-auto h-full" style={{ fontSize: 12, fontFamily: 'monospace' }}>
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => setEditing(null)} className="text-xs underline border-none bg-transparent cursor-pointer" style={{ color: '#FF6B35' }}>← Back</button>
          <span className="font-bold" style={{ color: '#ccc' }}>{editing === 'new' ? 'New Hidden File' : 'Edit File'}</span>
        </div>
        <StatusMsg msg={msg} />
        <div className="flex flex-col gap-2">
          <label style={labelStyle}>Filename (e.g. thoughts.txt, todo.txt)
            <input value={form.filename} onChange={e => setForm({ ...form, filename: e.target.value })} placeholder="secret_file.txt" className="w-full px-2 py-1 mt-0.5 border-none outline-none text-sm" style={inputStyle} />
          </label>
          <label style={labelStyle}>Content (polished version)
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={10} className="w-full px-2 py-1 mt-0.5 border-none outline-none text-sm resize-y" style={inputStyle} />
          </label>
          <label style={labelStyle}>Raw version
            <textarea value={form.raw} onChange={e => setForm({ ...form, raw: e.target.value })} rows={6} className="w-full px-2 py-1 mt-0.5 border-none outline-none text-sm resize-y" style={inputStyle} />
          </label>
          <label className="flex items-center gap-1" style={labelStyle}>
            Layer <input type="number" min={2} max={5} value={form.layer} onChange={e => setForm({ ...form, layer: parseInt(e.target.value) || 2 })} className="w-12 px-1 py-0.5 border-none outline-none text-sm" style={inputStyle} />
          </label>
          <div className="text-xs" style={{ color: '#555' }}>Layer 2 = found via ls -a in terminal. Layer 3-5 = deeper secrets.</div>
          <button onClick={save} className="px-4 py-1.5 text-sm font-bold border-none cursor-pointer mt-2" style={btnSave}>
            {editing === 'new' ? 'Create File' : 'Save Changes'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 overflow-auto h-full" style={{ fontSize: 12, fontFamily: 'monospace' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold" style={{ color: '#ccc' }}>Hidden Files ({files.length})</span>
        <button onClick={startNew} className="px-2 py-0.5 text-xs font-bold border-none cursor-pointer" style={btnAccent}>[NEW FILE]</button>
      </div>
      <div className="text-xs mb-2" style={{ color: '#555' }}>Terminal secret files. Accessible via ls -a and cd .hidden</div>
      <StatusMsg msg={msg} />
      {files.map(f => (
        <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 mb-1" style={{ background: '#1a1a1a', borderLeft: `2px solid ${f.layer === 2 ? '#4A90D9' : f.layer === 3 ? '#9B59B6' : '#FF6B35'}` }}>
          <div className="flex-1 min-w-0">
            <div className="truncate" style={{ color: '#ccc' }}>{f.filename}</div>
            <div className="text-xs" style={{ color: '#555' }}>Layer {f.layer} · {new Date(f.created_at).toLocaleDateString()}</div>
          </div>
          <button onClick={() => startEdit(f)} className="text-xs border-none bg-transparent cursor-pointer underline shrink-0" style={btnLink}>Edit</button>
          <button onClick={() => deleteFile(f.id)} className="text-xs border-none bg-transparent cursor-pointer underline shrink-0" style={btnDanger}>Del</button>
        </div>
      ))}
      {files.length === 0 && <div className="text-xs py-4 text-center" style={{ color: '#555' }}>No hidden files. Create terminal secrets!</div>}
    </div>
  )
}

// ── Section: Quick Add (Reviews, Restaurants) ──
function QuickAdd() {
  const [type, setType] = useState('review')
  const [msg, setMsg] = useState('')

  const [reviewForm, setReviewForm] = useState({ category: 'movies', title: '', year: 2026, rating: 0, status: 'watched', poster: '', review: '', analysis: '', tags: '' })
  const [restForm, setRestForm] = useState({ name: '', location: '', cuisine: '', status: 'been', rating: 0, icon: '', review: '', favorite: '', vibe: '', why: '' })

  async function saveReview() {
    const { error } = await supabase.from('reviews').insert({
      ...reviewForm,
      poster: reviewForm.poster || null,
      tags: reviewForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      analysis: reviewForm.analysis || null,
    })
    if (error) setMsg(`Error: ${error.message}`)
    else { setMsg('Review saved!'); setReviewForm({ category: 'movies', title: '', year: 2026, rating: 0, status: 'watched', poster: '', review: '', analysis: '', tags: '' }) }
  }

  async function saveRestaurant() {
    const { error } = await supabase.from('restaurants').insert({
      ...restForm,
      icon: restForm.icon || null,
      why: restForm.why || null,
    })
    if (error) setMsg(`Error: ${error.message}`)
    else { setMsg('Restaurant saved!'); setRestForm({ name: '', location: '', cuisine: '', status: 'been', rating: 0, icon: '', review: '', favorite: '', vibe: '', why: '' }) }
  }

  return (
    <div className="p-3 overflow-auto h-full" style={{ fontSize: 12, fontFamily: 'monospace' }}>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setType('review')} className="px-2 py-0.5 text-xs border-none cursor-pointer" style={{ background: type === 'review' ? '#FF6B35' : '#333', color: type === 'review' ? '#000' : '#888' }}>Review</button>
        <button onClick={() => setType('restaurant')} className="px-2 py-0.5 text-xs border-none cursor-pointer" style={{ background: type === 'restaurant' ? '#FF6B35' : '#333', color: type === 'restaurant' ? '#000' : '#888' }}>Restaurant</button>
      </div>

      <StatusMsg msg={msg} />

      {type === 'review' && (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <select value={reviewForm.category} onChange={e => setReviewForm({ ...reviewForm, category: e.target.value })} className="px-1 py-0.5 border-none text-xs" style={inputStyle}>
              <option value="movies">Movie</option><option value="tv">TV Show</option>
            </select>
            <select value={reviewForm.status} onChange={e => setReviewForm({ ...reviewForm, status: e.target.value })} className="px-1 py-0.5 border-none text-xs" style={inputStyle}>
              <option value="watched">Watched</option><option value="watchlist">Watchlist</option>
            </select>
          </div>
          <input value={reviewForm.title} onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })} placeholder="Title" className="w-full px-2 py-1 border-none outline-none text-sm" style={inputStyle} />
          <div className="flex gap-2">
            <input type="number" value={reviewForm.year} onChange={e => setReviewForm({ ...reviewForm, year: parseInt(e.target.value) })} placeholder="Year" className="w-16 px-1 py-0.5 border-none outline-none text-sm" style={inputStyle} />
            <input type="number" min={0} max={10} value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })} placeholder="/10" className="w-16 px-1 py-0.5 border-none outline-none text-sm" style={inputStyle} />
          </div>
          <input value={reviewForm.poster} onChange={e => setReviewForm({ ...reviewForm, poster: e.target.value })} placeholder="Poster URL or emoji" className="w-full px-2 py-1 border-none outline-none text-sm" style={inputStyle} />
          <input value={reviewForm.tags} onChange={e => setReviewForm({ ...reviewForm, tags: e.target.value })} placeholder="Tags (comma separated)" className="w-full px-2 py-1 border-none outline-none text-sm" style={inputStyle} />
          <textarea value={reviewForm.review} onChange={e => setReviewForm({ ...reviewForm, review: e.target.value })} placeholder="Quick take" rows={3} className="w-full px-2 py-1 border-none outline-none text-sm resize-y" style={inputStyle} />
          <textarea value={reviewForm.analysis} onChange={e => setReviewForm({ ...reviewForm, analysis: e.target.value })} placeholder="Full analysis (optional)" rows={4} className="w-full px-2 py-1 border-none outline-none text-sm resize-y" style={inputStyle} />
          <button onClick={saveReview} className="px-3 py-1.5 text-sm font-bold border-none cursor-pointer" style={btnSave}>Save Review</button>
        </div>
      )}

      {type === 'restaurant' && (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <select value={restForm.status} onChange={e => setRestForm({ ...restForm, status: e.target.value })} className="px-1 py-0.5 border-none text-xs" style={inputStyle}>
              <option value="been">Been To</option><option value="want">Want To Try</option>
            </select>
          </div>
          <input value={restForm.name} onChange={e => setRestForm({ ...restForm, name: e.target.value })} placeholder="Name" className="w-full px-2 py-1 border-none outline-none text-sm" style={inputStyle} />
          <input value={restForm.location} onChange={e => setRestForm({ ...restForm, location: e.target.value })} placeholder="Location" className="w-full px-2 py-1 border-none outline-none text-sm" style={inputStyle} />
          <div className="flex gap-2">
            <input value={restForm.cuisine} onChange={e => setRestForm({ ...restForm, cuisine: e.target.value })} placeholder="Cuisine" className="flex-1 px-2 py-1 border-none outline-none text-sm" style={inputStyle} />
            <input type="number" min={0} max={10} value={restForm.rating} onChange={e => setRestForm({ ...restForm, rating: parseInt(e.target.value) })} placeholder="/10" className="w-14 px-1 py-0.5 border-none outline-none text-sm" style={inputStyle} />
          </div>
          <textarea value={restForm.review} onChange={e => setRestForm({ ...restForm, review: e.target.value })} placeholder="Review" rows={3} className="w-full px-2 py-1 border-none outline-none text-sm resize-y" style={inputStyle} />
          <input value={restForm.favorite} onChange={e => setRestForm({ ...restForm, favorite: e.target.value })} placeholder="Order this:" className="w-full px-2 py-1 border-none outline-none text-sm" style={inputStyle} />
          <input value={restForm.vibe} onChange={e => setRestForm({ ...restForm, vibe: e.target.value })} placeholder="Vibe" className="w-full px-2 py-1 border-none outline-none text-sm" style={inputStyle} />
          <input value={restForm.why} onChange={e => setRestForm({ ...restForm, why: e.target.value })} placeholder="Why I want to go (for want list)" className="w-full px-2 py-1 border-none outline-none text-sm" style={inputStyle} />
          <button onClick={saveRestaurant} className="px-3 py-1.5 text-sm font-bold border-none cursor-pointer" style={btnSave}>Save Restaurant</button>
        </div>
      )}
    </div>
  )
}

// ── Section: Photos & Media Manager ──
function PhotosManager() {
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ title: '', caption: '', bucket: 'photos' })
  const fileRef = useRef(null)

  const BUCKETS = [
    { id: 'photos', label: 'General Photos' },
    { id: 'car-photos', label: 'Car Mods' },
    { id: 'project-photos', label: 'Projects' },
  ]

  useEffect(() => { loadPhotos() }, [])

  async function loadPhotos() {
    const { data } = await supabase.from('photos').select('*').order('created_at', { ascending: false })
    setPhotos(data || [])
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) { setMsg('Error: Select a file first'); return }
    if (!form.title.trim()) { setMsg('Error: Title required'); return }

    setUploading(true)
    setMsg('')

    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    // Upload to storage
    const { error: uploadErr } = await supabase.storage
      .from(form.bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadErr) {
      setMsg(`Error: ${uploadErr.message}`)
      setUploading(false)
      return
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(form.bucket).getPublicUrl(path)

    // Save to photos table
    const { error: dbErr } = await supabase.from('photos').insert({
      title: form.title.trim(),
      caption: form.caption.trim() || null,
      url: urlData.publicUrl,
    })

    if (dbErr) {
      setMsg(`Error: Uploaded but DB save failed: ${dbErr.message}`)
    } else {
      setMsg(`Uploaded to ${form.bucket}!`)
      setForm({ title: '', caption: '', bucket: form.bucket })
      if (fileRef.current) fileRef.current.value = ''
      loadPhotos()
    }
    setUploading(false)
  }

  async function deletePhoto(photo) {
    if (!confirm(`Delete "${photo.title}"?`)) return
    // Delete from DB
    const { error } = await supabase.from('photos').delete().eq('id', photo.id)
    if (error) setMsg(`Error: ${error.message}`)
    else { setMsg('Deleted!'); loadPhotos() }
  }

  return (
    <div className="p-3 overflow-auto h-full" style={{ fontSize: 12, fontFamily: 'monospace' }}>
      <span className="font-bold" style={{ color: '#ccc' }}>Upload Photo/Media</span>
      <div className="text-xs mb-2" style={{ color: '#555' }}>Upload to Supabase Storage. Photos appear in relevant apps.</div>
      <StatusMsg msg={msg} />

      <div className="flex flex-col gap-1.5 mb-4 p-2" style={{ background: '#1a1a1a', border: '1px solid #333' }}>
        <div className="flex gap-2">
          <select value={form.bucket} onChange={e => setForm({ ...form, bucket: e.target.value })} className="px-1 py-0.5 border-none text-xs" style={inputStyle}>
            {BUCKETS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </div>
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full px-2 py-1 border-none outline-none text-sm" style={inputStyle} />
        <input value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} placeholder="Caption (optional)" className="w-full px-2 py-1 border-none outline-none text-sm" style={inputStyle} />
        <input ref={fileRef} type="file" accept="image/*,video/*" className="text-xs" style={{ color: '#888' }} />
        <button onClick={handleUpload} disabled={uploading} className="px-3 py-1.5 text-sm font-bold border-none cursor-pointer" style={{ ...btnSave, opacity: uploading ? 0.5 : 1 }}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      <span className="font-bold" style={{ color: '#ccc' }}>Photos ({photos.length})</span>
      <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
        {photos.map(p => (
          <div key={p.id} className="p-1" style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <img src={p.url} alt={p.title} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
            <div className="truncate text-xs mt-1" style={{ color: '#ccc' }}>{p.title}</div>
            <button onClick={() => deletePhoto(p)} className="text-xs border-none bg-transparent cursor-pointer underline mt-0.5" style={btnDanger}>Delete</button>
          </div>
        ))}
      </div>
      {photos.length === 0 && <div className="text-xs py-2 text-center" style={{ color: '#555' }}>No photos uploaded yet.</div>}
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
  const unread = messages.filter(m => !m.read).length

  return (
    <div className="flex h-full" style={{ fontSize: 12, fontFamily: 'monospace' }}>
      <div className="flex-1 overflow-auto border-r" style={{ borderColor: '#333' }}>
        <div className="px-2 py-1" style={{ background: '#0f0f1a', borderBottom: '1px solid #333', color: '#888' }}>
          {unread > 0 ? `${unread} unread` : 'No unread messages'}
        </div>
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

// ── Section: Digest Manager ──
function DigestManager() {
  const [entries, setEntries] = useState([])
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ title: '', url: '', video_url: '', note: '', source: '', published_date: new Date().toISOString().split('T')[0] })

  useEffect(() => { loadEntries() }, [])

  async function loadEntries() {
    const { data } = await supabase.from('digest_entries').select('*').order('published_date', { ascending: false }).order('created_at', { ascending: false })
    setEntries(data || [])
  }

  async function save() {
    if (!form.title.trim()) { setMsg('Error: Title required'); return }
    const { error } = await supabase.from('digest_entries').insert({
      title: form.title.trim(),
      url: form.url.trim() || null,
      video_url: form.video_url.trim() || null,
      note: form.note.trim() || null,
      source: form.source.trim() || null,
      published_date: form.published_date,
    })
    if (error) setMsg(`Error: ${error.message}`)
    else {
      setMsg('Entry added!')
      setForm({ title: '', url: '', video_url: '', note: '', source: '', published_date: form.published_date })
      loadEntries()
    }
  }

  async function deleteEntry(id) {
    if (!confirm('Delete this entry?')) return
    const { error } = await supabase.from('digest_entries').delete().eq('id', id)
    if (error) setMsg(`Error: ${error.message}`)
    else loadEntries()
  }

  return (
    <div className="p-3 overflow-auto h-full" style={{ fontSize: 12, fontFamily: 'monospace' }}>
      <span className="font-bold" style={{ color: '#ccc' }}>Add to Daily Digest</span>
      <StatusMsg msg={msg} />

      <div className="flex flex-col gap-1.5 mb-4 p-2 mt-2" style={{ background: '#1a1a1a', border: '1px solid #333' }}>
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title / headline" className="w-full px-2 py-1 border-none outline-none text-sm" style={inputStyle} />
        <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="Link URL (optional)" className="w-full px-2 py-1 border-none outline-none text-sm" style={inputStyle} />
        <input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} placeholder="YouTube URL (optional)" className="w-full px-2 py-1 border-none outline-none text-sm" style={inputStyle} />
        <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Your thoughts / why this is interesting" rows={3} className="w-full px-2 py-1 border-none outline-none text-sm resize-y" style={inputStyle} />
        <div className="flex gap-2">
          <input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Source (e.g. YouTube, Reddit)" className="flex-1 px-2 py-1 border-none outline-none text-sm" style={inputStyle} />
          <input type="date" value={form.published_date} onChange={e => setForm({ ...form, published_date: e.target.value })} className="px-2 py-1 border-none outline-none text-sm" style={inputStyle} />
        </div>
        <button onClick={save} className="px-3 py-1.5 text-sm font-bold border-none cursor-pointer" style={btnSave}>Add Entry</button>
      </div>

      <span className="font-bold" style={{ color: '#ccc' }}>Recent Entries ({entries.length})</span>
      {entries.slice(0, 20).map(e => (
        <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 mb-1 mt-1" style={{ background: '#1a1a1a', borderLeft: e.video_url ? '2px solid #FF6B35' : '2px solid #4A90D9' }}>
          <div className="flex-1 min-w-0">
            <div className="truncate" style={{ color: '#ccc' }}>{e.title}</div>
            <div className="text-xs" style={{ color: '#555' }}>{e.published_date} {e.video_url ? '· Video' : ''} {e.source ? `· ${e.source}` : ''}</div>
          </div>
          <button onClick={() => deleteEntry(e.id)} className="text-xs border-none bg-transparent cursor-pointer shrink-0" style={btnDanger}>X</button>
        </div>
      ))}
      {entries.length === 0 && <div className="text-xs py-2 text-center mt-1" style={{ color: '#555' }}>No entries yet. Add your first find!</div>}
    </div>
  )
}

// ── Section: Scores Manager ──
function ScoresManager() {
  const [scores, setScores] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => { loadScores() }, [])

  async function loadScores() {
    const { data } = await supabase.from('high_scores').select('*').order('score', { ascending: false }).limit(100)
    setScores(data || [])
  }

  async function deleteScore(id) {
    const { error } = await supabase.from('high_scores').delete().eq('id', id)
    if (error) setMsg(`Error: ${error.message}`)
    else loadScores()
  }

  const grouped = scores.reduce((acc, s) => {
    if (!acc[s.game_id]) acc[s.game_id] = []
    acc[s.game_id].push(s)
    return acc
  }, {})

  return (
    <div className="p-3 overflow-auto h-full" style={{ fontSize: 12, fontFamily: 'monospace' }}>
      <span className="font-bold" style={{ color: '#ccc' }}>High Scores ({scores.length})</span>
      <div className="text-xs mb-2" style={{ color: '#555' }}>Remove inappropriate or spam scores.</div>
      <StatusMsg msg={msg} />
      {Object.entries(grouped).map(([game, gameScores]) => (
        <div key={game} className="mb-3">
          <div className="text-xs font-bold mb-1 px-1" style={{ color: '#FF6B35' }}>{game.toUpperCase()}</div>
          {gameScores.map(s => (
            <div key={s.id} className="flex items-center gap-2 px-2 py-1 mb-0.5" style={{ background: '#1a1a1a' }}>
              <span style={{ color: '#FFD700', width: 60, textAlign: 'right' }}>{s.score}</span>
              <span className="flex-1" style={{ color: '#ccc' }}>{s.player_name}</span>
              <span className="text-xs" style={{ color: '#555' }}>{new Date(s.created_at).toLocaleDateString()}</span>
              <button onClick={() => deleteScore(s.id)} className="text-xs border-none bg-transparent cursor-pointer" style={btnDanger}>X</button>
            </div>
          ))}
        </div>
      ))}
      {scores.length === 0 && <div className="text-xs py-4 text-center" style={{ color: '#555' }}>No scores recorded yet.</div>}
    </div>
  )
}

// ── Main Admin Panel ──
const SECTIONS = [
  { id: 'blog', label: '📝 Blog', component: BlogManager },
  { id: 'hidden', label: '🔒 Hidden', component: HiddenFilesManager },
  { id: 'quickadd', label: '➕ Add', component: QuickAdd },
  { id: 'digest', label: '📰 Digest', component: DigestManager },
  { id: 'photos', label: '📷 Photos', component: PhotosManager },
  { id: 'messages', label: '📧 Mail', component: MessagesView },
  { id: 'scores', label: '🏆 Scores', component: ScoresManager },
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
      <div className="flex gap-0.5 px-2 py-1 shrink-0 flex-wrap" style={{ background: '#0f0f1a', borderBottom: '1px solid #333' }}>
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
