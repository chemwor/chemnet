import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { iconUrl } from '../../shell/icons'
import { useMediaQuery } from '../../hooks/useMediaQuery'

// Fallback to hardcoded if DB is empty/fails
import { AI_PAPER } from './ai-paper'
const FALLBACK_POSTS = [
  {
    id: 'fallback-1',
    title: 'Break Down of Artificial Intelligence and Its Impact on Human Life',
    filename: 'Artificial Intelligence in The Workforce.doc',
    content: AI_PAPER, raw: null,
    note: 'Research paper written at John McEachern High School, Fall/Spring 2015-2016.',
    created_at: '2016-05-18T12:00:00Z', views: 0, category: 'tech',
  },
]

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'tech', label: 'Tech' },
  { id: 'culture', label: 'Culture' },
  { id: 'personal', label: 'Personal' },
  { id: 'general', label: 'General' },
]

const SORT_OPTIONS = [
  { id: 'recent', label: 'Most Recent' },
  { id: 'popular', label: 'Most Read' },
  { id: 'oldest', label: 'Oldest First' },
]

const DOC_ICON = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="4" y="2" width="20" height="28" fill="#fff" stroke="#000" stroke-width=".8"/><rect x="4" y="2" width="6" height="6" fill="#00a"/><text x="7" y="7" fill="#fff" font-size="5" font-family="serif" font-weight="bold">W</text><line x1="8" y1="12" x2="20" y2="12" stroke="#000" stroke-width=".4"/><line x1="8" y1="15" x2="20" y2="15" stroke="#000" stroke-width=".4"/><line x1="8" y1="18" x2="20" y2="18" stroke="#000" stroke-width=".4"/><line x1="8" y1="21" x2="16" y2="21" stroke="#000" stroke-width=".4"/></svg>`)}`

const PAGE_HEIGHT = 680
const PAGE_PADDING = 40

function paginateContent(text, isTitle) {
  // Split by double newline, but also break up very long single paragraphs
  // by splitting on sentence boundaries so they fit on pages
  let paragraphs = text.split('\n\n')

  // If there's only 1 paragraph and it's very long, split by sentences
  const expandedParas = []
  for (const para of paragraphs) {
    if (para.length > 800) {
      // Split into chunks of ~400 chars at sentence boundaries
      const sentences = para.match(/[^.!?]+[.!?]+\s*/g) || [para]
      let chunk = ''
      for (const s of sentences) {
        if (chunk.length + s.length > 400 && chunk.length > 0) {
          expandedParas.push(chunk.trim())
          chunk = ''
        }
        chunk += s
      }
      if (chunk.trim()) expandedParas.push(chunk.trim())
    } else {
      expandedParas.push(para)
    }
  }

  const pages = [[]]
  let currentHeight = isTitle ? 80 : 0
  const lineHeight = 22
  const charsPerLine = 65
  for (const para of expandedParas) {
    const lines = Math.max(1, Math.ceil(para.length / charsPerLine))
    const paraHeight = lines * lineHeight + 16
    if (currentHeight + paraHeight > PAGE_HEIGHT && pages[pages.length - 1].length > 0) {
      pages.push([])
      currentHeight = 0
    }
    pages[pages.length - 1].push(para)
    currentHeight += paraHeight
  }
  return pages
}

// ── File directory view ──
function FileDirectory({ posts, onOpen, sort, setSort, category, setCategory }) {
  const [selectedId, setSelectedId] = useState(null)

  const sorted = [...posts].sort((a, b) => {
    if (sort === 'popular') return (b.views || 0) - (a.views || 0)
    if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
    return new Date(b.created_at) - new Date(a.created_at)
  })

  const filtered = category === 'all' ? sorted : sorted.filter(p => p.category === category)

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-2 py-1 shrink-0 flex-wrap" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-bevel-dark)' }}>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>📂 Blog</span>
        <span className="ml-auto text-xs" style={{ color: 'var(--color-text-disabled)' }}>{filtered.length} post(s)</span>
      </div>

      {/* Sort + Category bar */}
      <div className="flex items-center gap-2 px-2 py-1 shrink-0 flex-wrap" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-bevel-dark)', fontSize: 10 }}>
        <span style={{ color: 'var(--color-text-disabled)' }}>Sort:</span>
        {SORT_OPTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSort(s.id)}
            className="px-1.5 py-0.5 border-none cursor-pointer"
            style={{
              background: sort === s.id ? '#000080' : 'transparent',
              color: sort === s.id ? '#fff' : '#666',
              fontFamily: 'monospace', fontSize: 10,
            }}
          >
            {s.label}
          </button>
        ))}
        <span style={{ color: '#ccc' }}>|</span>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className="px-1.5 py-0.5 border-none cursor-pointer"
            style={{
              background: category === c.id ? '#000080' : 'transparent',
              color: category === c.id ? '#fff' : '#666',
              fontFamily: 'monospace', fontSize: 10,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="flex items-center px-2 py-0.5 text-xs shrink-0" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-bevel-dark)', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>
        <div style={{ width: 28 }} />
        <div className="flex-1 font-bold">Name</div>
        <div className="font-bold" style={{ width: 45, textAlign: 'right' }}>Views</div>
        <div className="font-bold" style={{ width: 80, textAlign: 'right' }}>Date</div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-auto" style={{ background: '#fff' }}>
        {filtered.map(post => {
          const isSelected = selectedId === post.id
          const date = new Date(post.created_at).toLocaleDateString()
          return (
            <div
              key={post.id}
              className="flex items-center px-2 py-1 cursor-pointer"
              style={{ background: isSelected ? '#000080' : 'transparent', color: isSelected ? '#fff' : '#000', fontFamily: 'monospace', fontSize: 12 }}
              onClick={() => setSelectedId(post.id)}
              onDoubleClick={() => onOpen(post.id)}
            >
              <img src={DOC_ICON} alt="" width={20} height={20} style={{ imageRendering: 'pixelated', marginRight: 8 }} draggable={false} />
              <div className="flex-1 truncate">{post.filename || post.title + '.doc'}</div>
              <div style={{ width: 45, textAlign: 'right', color: isSelected ? '#ccc' : '#888', fontSize: 10 }}>{post.views || 0}</div>
              <div style={{ width: 80, textAlign: 'right', color: isSelected ? '#ccc' : '#666' }}>{date}</div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-xs" style={{ color: '#888' }}>No posts in this category</div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center px-2 py-0.5 text-xs shrink-0" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-bevel-dark)', color: 'var(--color-text-secondary)' }}>
        {selectedId ? 'Double-click to open' : 'Select a document to read'}
      </div>
    </div>
  )
}

// ── Document viewer ──
function DocumentViewer({ post, onBack }) {
  const [showRaw, setShowRaw] = useState(false)

  // Track view
  useEffect(() => {
    if (post.id && !String(post.id).startsWith('fallback')) {
      try { supabase.rpc('increment_blog_views', { post_id: post.id }) } catch {}
    }
  }, [post.id])

  const bodyText = showRaw && post.raw ? post.raw : post.content
  const pages = paginateContent(bodyText, true)
  const fontFamily = showRaw ? '"Courier New", monospace' : '"Georgia", "Times New Roman", serif'
  const fontSize = showRaw ? 12 : 14
  const lineHt = showRaw ? 1.5 : 1.7
  const textColor = showRaw ? '#33FF33' : '#1a1a1a'
  const pageBg = showRaw ? '#1a1a1a' : '#fff'

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Menu bar */}
      <div className="flex items-center gap-3 px-2 py-1 text-xs shrink-0" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-bevel-dark)', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>
        <button onClick={onBack} className="border-none bg-transparent cursor-pointer text-xs underline" style={{ color: 'var(--color-accent)' }}>← Back</button>
        <span style={{ color: 'var(--color-text-disabled)' }}>|</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>File</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>Edit</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>View</span>
      </div>

      {/* Toolbar with toggle */}
      <div className="flex items-center gap-2 px-2 py-1 shrink-0" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-bevel-dark)' }}>
        <select className="text-xs px-1 py-0.5" style={{ background: '#fff', border: '1px solid #999', fontFamily: 'monospace', color: '#000' }} defaultValue="times" disabled>
          <option value="times">Times New Roman</option>
        </select>
        <span className="text-xs font-bold" style={{ color: '#666' }}>B</span>
        <span className="text-xs italic" style={{ color: '#666' }}>I</span>

        {post.raw && (
          <>
            <div style={{ width: 1, height: 16, background: '#ccc', margin: '0 6px' }} />
            <button onClick={() => setShowRaw(false)} className="px-2 py-0.5 text-xs cursor-pointer border-none" style={{ background: !showRaw ? '#000080' : '#d4d0c8', color: !showRaw ? '#fff' : '#000', fontFamily: 'monospace', border: '1px solid #808080' }}>Polished</button>
            <button onClick={() => setShowRaw(true)} className="px-2 py-0.5 text-xs cursor-pointer border-none" style={{ background: showRaw ? '#000080' : '#d4d0c8', color: showRaw ? '#fff' : '#000', fontFamily: 'monospace', border: '1px solid #808080' }}>Raw Draft</button>
          </>
        )}

        <span className="ml-auto text-xs" style={{ color: '#888' }}>{post.views || 0} views</span>
      </div>

      {/* Pages */}
      <div className="flex-1 overflow-auto" style={{ background: '#e8e8e8', padding: '16px 0' }}>
        {pages.map((pageParagraphs, pageIdx) => (
          <div key={pageIdx} style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ background: pageBg, width: '100%', maxWidth: 620, height: PAGE_HEIGHT + PAGE_PADDING * 2, padding: `${PAGE_PADDING}px ${PAGE_PADDING + 8}px`, boxShadow: '0 1px 4px rgba(0,0,0,0.15)', fontFamily, fontSize, lineHeight: lineHt, color: textColor, overflow: 'hidden', position: 'relative', marginLeft: 12, marginRight: 12 }}>
              {pageIdx === 0 && (
                <>
                  <h1 style={{ fontSize: showRaw ? 14 : 20, fontWeight: 'bold', margin: '0 0 6px', color: showRaw ? '#66FF66' : '#000', fontFamily: showRaw ? '"Courier New", monospace' : '"Georgia", serif' }}>
                    {showRaw ? `> cat --raw "${post.filename}"` : post.title}
                  </h1>
                  {showRaw && <div style={{ fontSize: 10, color: '#227722', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #227722' }}>── raw draft — unedited ──</div>}
                  {!showRaw && (
                    <div style={{ fontSize: 10, color: '#888', marginBottom: post.note ? 4 : 16, paddingBottom: 8, borderBottom: post.note ? 'none' : '1px solid #ddd', fontFamily: 'monospace' }}>
                      {new Date(post.created_at).toLocaleDateString()} · {post.category || 'general'}
                    </div>
                  )}
                  {!showRaw && post.note && <div style={{ fontSize: 9, color: '#999', fontStyle: 'italic', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #ddd', fontFamily: 'monospace' }}>{post.note}</div>}
                </>
              )}
              {pageParagraphs.map((para, i) => (
                <p key={i} style={{ margin: '0 0 12px', textAlign: showRaw ? 'left' : 'justify' }}>{para}</p>
              ))}
              {showRaw && pageIdx === pages.length - 1 && <div style={{ fontSize: 10, color: '#227722', marginTop: 16, paddingTop: 6, borderTop: '1px solid #227722' }}>── end ──</div>}
              <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: showRaw ? '#227722' : '#bbb', fontFamily: 'monospace' }}>Page {pageIdx + 1} of {pages.length}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="flex items-center justify-between px-2 py-0.5 text-xs shrink-0" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-bevel-dark)', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
        <span>{post.filename} {showRaw ? '(raw)' : ''}</span>
        <span>{pages.length} page(s)</span>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MOBILE VIEW — iOS Notes style
// ══════════════════════════════════════════

function MobileNotesList({ posts, onOpen }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f2f2f7', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      {/* Search bar */}
      <div style={{ padding: '8px 16px', background: '#f2f2f7' }}>
        <div style={{ background: '#e5e5ea', borderRadius: 10, padding: '8px 12px', fontSize: 14, color: '#8e8e93' }}>
          🔍 Search
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-auto">
        <div style={{ padding: '0 16px 4px', fontSize: 11, color: '#8e8e93', fontWeight: 600, textTransform: 'uppercase' }}>
          {posts.length} Notes
        </div>
        {posts.map(post => {
          const date = new Date(post.created_at)
          const preview = post.content?.slice(0, 80).replace(/\n/g, ' ') + '...'
          return (
            <div
              key={post.id}
              onClick={() => onOpen(post.id)}
              style={{
                padding: '12px 16px',
                background: '#fff',
                borderBottom: '0.5px solid #e5e5ea',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: '#000', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {post.title}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#8e8e93' }}>
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span style={{ fontSize: 12, color: '#8e8e93', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {preview}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MobileNoteView({ post, onBack }) {
  const [showRaw, setShowRaw] = useState(false)
  const bodyText = showRaw && post.raw ? post.raw : post.content

  useEffect(() => {
    if (post.id && !String(post.id).startsWith('fallback')) {
      try { supabase.rpc('increment_blog_views', { post_id: post.id }) } catch {}
    }
  }, [post.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      {/* Nav */}
      <div className="flex items-center justify-between px-3 shrink-0" style={{ height: 44, borderBottom: '0.5px solid #e5e5ea' }}>
        <button onClick={onBack} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 15, fontFamily: 'inherit' }}>
          ‹ Notes
        </button>
        {post.raw && (
          <div className="flex" style={{ background: '#e5e5ea', borderRadius: 6, padding: 2 }}>
            <button onClick={() => setShowRaw(false)} className="border-none cursor-pointer px-2 py-0.5" style={{ background: !showRaw ? '#fff' : 'transparent', borderRadius: 4, fontSize: 11, color: '#000', fontFamily: 'inherit', boxShadow: !showRaw ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
              Polished
            </button>
            <button onClick={() => setShowRaw(true)} className="border-none cursor-pointer px-2 py-0.5" style={{ background: showRaw ? '#fff' : 'transparent', borderRadius: 4, fontSize: 11, color: '#000', fontFamily: 'inherit', boxShadow: showRaw ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
              Raw
            </button>
          </div>
        )}
      </div>

      {/* Content — lined paper style */}
      <div className="flex-1 overflow-auto" style={{ background: showRaw ? '#1a1a1a' : '#FFFDE7', padding: '16px 20px' }}>
        <div style={{ fontSize: 10, color: showRaw ? '#555' : '#8e8e93', marginBottom: 8 }}>
          {new Date(post.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px', color: showRaw ? '#33FF33' : '#000', fontFamily: showRaw ? '"Courier New", monospace' : 'inherit' }}>
          {post.title}
        </h1>
        {post.note && !showRaw && (
          <div style={{ fontSize: 12, color: '#8e8e93', fontStyle: 'italic', marginBottom: 16, paddingBottom: 8, borderBottom: '0.5px solid #e5e5ea' }}>{post.note}</div>
        )}
        {bodyText.split('\n\n').map((para, i) => (
          <p key={i} style={{
            margin: '0 0 14px',
            fontSize: showRaw ? 13 : 15,
            lineHeight: 1.6,
            color: showRaw ? '#33FF33' : '#333',
            fontFamily: showRaw ? '"Courier New", monospace' : 'inherit',
          }}>
            {para}
          </p>
        ))}
      </div>
    </div>
  )
}

// ── Main ──
export default function Blog() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [openPostId, setOpenPostId] = useState(null)
  const [sort, setSort] = useState('recent')
  const [category, setCategory] = useState('all')

  useEffect(() => {
    async function load() {
      try {
        // Timeout after 3 seconds — fall back to hardcoded if slow/offline
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000)

        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .abortSignal(controller.signal)

        clearTimeout(timeout)

        if (error || !data || data.length === 0) {
          setPosts(FALLBACK_POSTS)
        } else {
          setPosts(data)
        }
      } catch {
        setPosts(FALLBACK_POSTS)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#fff', color: '#888', fontFamily: 'monospace' }}>Loading...</div>
  }

  const openPost = posts.find(p => p.id === openPostId)

  // Mobile — Notes style
  if (isMobile) {
    if (openPost) return <MobileNoteView post={openPost} onBack={() => setOpenPostId(null)} />
    return <MobileNotesList posts={posts} onOpen={setOpenPostId} />
  }

  // Desktop — Word style
  if (openPost) return <DocumentViewer post={openPost} onBack={() => setOpenPostId(null)} />
  return <FileDirectory posts={posts} onOpen={setOpenPostId} sort={sort} setSort={setSort} category={category} setCategory={setCategory} />
}
