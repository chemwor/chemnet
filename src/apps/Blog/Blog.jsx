import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useRepo } from '../../lib/repo/useRepo'
import { useProfile } from '../../context/ProfileContext'
import { useDesktopConfig } from '../../hooks/useDesktopConfig'
import { useInitialItem } from '../../hooks/useInitialItem'
import { OwnerManager } from '../_shared/OwnerManager'

// ════════════════════════════════════════════════════════════════════════
// Blog — an early-2000s personal weblog (LiveJournal / Xanga lineage).
// Desktop: two columns, an article on cream paper + a sidebar of widgets.
// Mobile: the same blocks collapsed into one scrolling column.
//
// Data is read defensively: mood / now_playing / tags exist on members.posts
// but not on the flagship public.blog_posts, so every meta segment renders
// only when its value is present. Likes ride Phase 5 platform.reactions
// (target_type 'post'); if that ever errors the control just shows a count.
// ════════════════════════════════════════════════════════════════════════

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'tech', label: 'Tech' },
  { id: 'culture', label: 'Culture' },
  { id: 'personal', label: 'Personal' },
  { id: 'general', label: 'General' },
]

const SORT_OPTIONS = [
  { id: 'recent', label: 'Newest' },
  { id: 'popular', label: 'Most read' },
  { id: 'oldest', label: 'Oldest' },
]

// Deliberate "paper" tones — these are the notepad surface, not chrome, so
// they live outside the Warm Slate token set on purpose.
const PAPER = '#F5EEDB'
const PAPER_EDGE = '#E4D8B8'
const INK = '#2b2620'
const INK_SOFT = '#6b6453'

// ── content helpers ──────────────────────────────────────────────────────

// Split prose into block-level markdown: paragraphs, `>` pull quotes, and
// `---` / `***` ornamental dividers. Inline markup is left as-is for legibility.
function parseBlocks(text) {
  return (text || '')
    .split(/\n\s*\n/)
    .map(raw => {
      const t = raw.trim()
      if (!t) return null
      if (/^([-*_])\1{2,}$/.test(t)) return { type: 'divider' }
      if (t.startsWith('>')) {
        return { type: 'quote', text: t.split('\n').map(l => l.replace(/^>\s?/, '')).join('\n') }
      }
      return { type: 'p', text: t }
    })
    .filter(Boolean)
}

const fmtLong = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
const fmtShort = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const monthKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}` }
const monthLabel = (key) => {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase()
}

function buildArchive(posts) {
  const m = new Map()
  for (const p of posts) { const k = monthKey(p.created_at); m.set(k, (m.get(k) || 0) + 1) }
  return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]))
}

function buildTags(posts) {
  const m = new Map()
  for (const p of posts) for (const t of (p.tags || [])) m.set(t, (m.get(t) || 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

function nowPlayingOf(post, config) {
  if (post?.now_playing) return { text: post.now_playing, href: null }
  if (config?.spotify_url) return { text: 'on rotation', href: config.spotify_url }
  return null
}

// Likes via platform.reactions, keyed as target_type 'post'.
function useLikes(post) {
  const repo = useRepo()
  const { currentUser } = useProfile()
  const [state, setState] = useState({ count: 0, liked: false })

  useEffect(() => {
    let on = true
    repo.social.reactions.summary('post', [post.id])
      .then(m => { if (on) setState(m[String(post.id)] || { count: 0, liked: false }) })
      .catch(() => {})
    return () => { on = false }
  }, [repo, post.id])

  const toggle = useCallback(async () => {
    if (!currentUser) { window.dispatchEvent(new CustomEvent('ericOS:openApp', { detail: 'signup' })); return }
    setState(s => s.liked ? { count: Math.max(0, s.count - 1), liked: false } : { count: s.count + 1, liked: true })
    const wasLiked = state.liked
    try {
      if (wasLiked) await repo.social.reactions.unlike('post', post.id)
      else await repo.social.reactions.like('post', post.id)
    } catch { /* keep the optimistic value */ }
  }, [currentUser, repo, post.id, state.liked])

  return [state, toggle]
}

// ── shared article pieces ─────────────────────────────────────────────────

function MetaHeader({ post, nowPlaying }) {
  const segs = []
  segs.push(<span key="date">{fmtLong(post.created_at)}</span>)
  if (post.mood) segs.push(<span key="mood">mood: <em style={{ color: 'var(--color-accent)' }}>{post.mood}</em></span>)
  if (nowPlaying) segs.push(
    <span key="np">now playing: {nowPlaying.href
      ? <a href={nowPlaying.href} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)' }}>{nowPlaying.text}</a>
      : <em style={{ color: 'var(--color-accent)' }}>{nowPlaying.text}</em>}</span>,
  )
  segs.push(<span key="reads">{post.views || 0} reads</span>)
  return (
    <div style={{ fontSize: 11, color: INK_SOFT, fontFamily: '"Courier Prime", monospace', marginBottom: 18, paddingBottom: 12, borderBottom: `1px dotted ${PAPER_EDGE}`, lineHeight: 1.8 }}>
      {segs.map((s, i) => <span key={i}>{i > 0 && <span style={{ color: PAPER_EDGE }}> · </span>}{s}</span>)}
    </div>
  )
}

function ArticleBody({ text, showRaw }) {
  if (showRaw) {
    return (
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: '"Courier New", monospace', fontSize: 13, lineHeight: 1.6, color: '#33FF33', background: '#1a1a1a', padding: 18, margin: 0, borderRadius: 2 }}>
        {text}
      </pre>
    )
  }
  const blocks = parseBlocks(text)
  const capIdx = blocks.findIndex(b => b.type === 'p' && b.text)
  return (
    <div>
      {blocks.map((b, i) => {
        if (b.type === 'divider') {
          return <div key={i} style={{ textAlign: 'center', color: 'var(--color-accent)', letterSpacing: 6, margin: '26px 0', fontSize: 13 }}>✦ ─────────</div>
        }
        if (b.type === 'quote') {
          return (
            <blockquote key={i} style={{ margin: '20px 0', padding: '6px 0 6px 18px', borderLeft: '4px solid var(--color-accent)', fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', fontSize: 19, lineHeight: 1.55, color: '#403828' }}>
              {b.text}
            </blockquote>
          )
        }
        const useCap = i === capIdx
        return (
          <p key={i} style={{ margin: '0 0 16px', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 16, lineHeight: 1.8, color: INK, textAlign: 'justify' }}>
            {useCap
              ? <><span style={{ float: 'left', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 56, lineHeight: 0.74, padding: '6px 8px 0 0', color: 'var(--color-accent)' }}>{b.text[0]}</span>{b.text.slice(1)}</>
              : b.text}
          </p>
        )
      })}
    </div>
  )
}

function ArticleFooter({ post, likes, toggleLike, onTag }) {
  const tags = post.tags || []
  return (
    <div style={{ marginTop: 24, paddingTop: 14, borderTop: `1px dotted ${PAPER_EDGE}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {tags.map(t => (
        <button key={t} onClick={() => onTag?.(t)} style={{ fontFamily: '"Courier Prime", monospace', fontSize: 11, color: INK_SOFT, background: '#fff8e6', border: `1px solid ${PAPER_EDGE}`, borderRadius: 3, padding: '2px 8px', cursor: onTag ? 'pointer' : 'default' }}>
          #{t}
        </button>
      ))}
      <button
        onClick={toggleLike}
        title={likes.liked ? 'Unlike' : 'Like this post'}
        style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1px solid ${likes.liked ? 'var(--color-accent)' : PAPER_EDGE}`, borderRadius: 14, padding: '4px 12px', cursor: 'pointer', color: likes.liked ? 'var(--color-accent)' : INK_SOFT, fontFamily: '"Courier Prime", monospace', fontSize: 13 }}
      >
        <span style={{ fontSize: 14 }}>{likes.liked ? '♥' : '♡'}</span> {likes.count}
      </button>
    </div>
  )
}

// ── sidebar widgets ───────────────────────────────────────────────────────

function SidebarBlock({ title, children }) {
  return (
    <div style={{ background: '#fffdf2', border: `1px solid ${PAPER_EDGE}`, marginBottom: 14, boxShadow: '2px 2px 0 rgba(0,0,0,0.06)' }}>
      <div style={{ background: 'var(--color-accent)', color: '#1a1207', fontFamily: '"Courier Prime", monospace', fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', padding: '4px 10px' }}>{title}</div>
      <div style={{ padding: 10, fontFamily: '"Courier Prime", monospace', fontSize: 12, color: INK }}>{children}</div>
    </div>
  )
}

function ArchiveBlock({ posts, onMonth }) {
  const archive = useMemo(() => buildArchive(posts), [posts])
  if (!archive.length) return null
  return (
    <SidebarBlock title="Archive">
      {archive.map(([key, n]) => (
        <button key={key} onClick={() => onMonth?.(key)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '3px 0', cursor: 'pointer', color: INK, fontFamily: 'inherit', fontSize: 12 }}>
          ▸ {monthLabel(key)} <span style={{ color: INK_SOFT }}>({n})</span>
        </button>
      ))}
    </SidebarBlock>
  )
}

function TagCloudBlock({ posts, onTag }) {
  const tags = useMemo(() => buildTags(posts), [posts])
  if (!tags.length) return null
  const max = Math.max(...tags.map(t => t[1]))
  return (
    <SidebarBlock title="Tags">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 8px', lineHeight: 1.4 }}>
        {tags.map(([t, n]) => (
          <button key={t} onClick={() => onTag?.(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', color: 'var(--color-accent)', fontSize: 11 + Math.round((n / max) * 9) }}>
            {t}
          </button>
        ))}
      </div>
    </SidebarBlock>
  )
}

function NowPlayingBlock({ nowPlaying }) {
  if (!nowPlaying) return null
  return (
    <SidebarBlock title="Now playing">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>♫</span>
        {nowPlaying.href
          ? <a href={nowPlaying.href} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)' }}>{nowPlaying.text}</a>
          : <span>{nowPlaying.text}</span>}
      </div>
    </SidebarBlock>
  )
}

function HitCounterBlock({ posts }) {
  const total = posts.reduce((s, p) => s + (p.views || 0), 0)
  const digits = String(total).padStart(6, '0')
  return (
    <SidebarBlock title="Hit counter">
      <div style={{ display: 'flex', justifyContent: 'center', gap: 2, background: '#1a1305', padding: '6px 4px', border: '1px solid #000', borderRadius: 2 }}>
        {digits.split('').map((d, i) => (
          <span key={i} style={{ fontFamily: '"Courier New", monospace', fontWeight: 700, fontSize: 18, color: '#FFB000', background: '#241a08', padding: '1px 4px', textShadow: '0 0 6px rgba(255,176,0,0.8)' }}>{d}</span>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 9, color: INK_SOFT, marginTop: 4 }}>visitors served</div>
    </SidebarBlock>
  )
}

function RssButton({ block }) {
  const btn = (
    <a
      href="#"
      onClick={e => e.preventDefault()}
      title="RSS feed (coming soon)"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FF6600', color: '#fff', fontFamily: '"Courier Prime", monospace', fontWeight: 700, fontSize: 11, padding: '4px 10px', borderRadius: 3, textDecoration: 'none', boxShadow: '1px 1px 0 rgba(0,0,0,0.3)' }}
    >
      <span style={{ fontSize: 13 }}>📡</span> RSS
    </a>
  )
  if (!block) return btn
  return <SidebarBlock title="Syndicate"><div style={{ display: 'flex', justifyContent: 'center' }}>{btn}</div></SidebarBlock>
}

function Sidebar({ posts, nowPlaying, onTag, onMonth }) {
  return (
    <>
      <ArchiveBlock posts={posts} onMonth={onMonth} />
      <TagCloudBlock posts={posts} onTag={onTag} />
      <NowPlayingBlock nowPlaying={nowPlaying} />
      <HitCounterBlock posts={posts} />
      <RssButton block />
    </>
  )
}

// ── desktop: open-post (two columns) ──────────────────────────────────────

function DesktopPost({ post, posts, onBack, onTag, onMonth }) {
  const repo = useRepo()
  const { config } = useDesktopConfig()
  const [showRaw, setShowRaw] = useState(false)
  const [likes, toggleLike] = useLikes(post)

  useEffect(() => { repo.posts.incrementViews(post.id) }, [post.id, repo])

  const nowPlaying = nowPlayingOf(post, config)

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* title bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 shrink-0" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-bevel-dark)', fontFamily: '"Courier Prime", monospace', fontSize: 12 }}>
        <button onClick={onBack} className="border-none bg-transparent cursor-pointer underline" style={{ color: 'var(--color-accent)', fontSize: 12 }}>← Index</button>
        {post.raw && (
          <div className="flex" style={{ marginLeft: 4 }}>
            <button onClick={() => setShowRaw(false)} className="px-2 py-0.5 cursor-pointer" style={{ background: !showRaw ? 'var(--color-accent)' : '#d4d0c8', color: !showRaw ? '#1a1207' : '#000', border: '1px solid #808080', fontFamily: 'inherit', fontSize: 11 }}>Polished</button>
            <button onClick={() => setShowRaw(true)} className="px-2 py-0.5 cursor-pointer" style={{ background: showRaw ? 'var(--color-accent)' : '#d4d0c8', color: showRaw ? '#1a1207' : '#000', border: '1px solid #808080', borderLeft: 'none', fontFamily: 'inherit', fontSize: 11 }}>Raw draft</button>
          </div>
        )}
        <div className="ml-auto"><RssButton /></div>
      </div>

      {/* two columns */}
      <div className="flex-1 overflow-auto" style={{ background: '#cfc6ae' }}>
        <div style={{ display: 'flex', gap: 16, padding: 16, maxWidth: 980, margin: '0 auto', alignItems: 'flex-start' }}>
          {/* article */}
          <article style={{ flex: '1 1 68%', minWidth: 0, background: PAPER, border: `1px solid ${PAPER_EDGE}`, boxShadow: '3px 3px 0 rgba(0,0,0,0.12)', padding: '34px 40px' }}>
            <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 30, fontWeight: 700, lineHeight: 1.15, margin: '0 0 12px', color: INK }}>{post.title}</h1>
            <MetaHeader post={post} nowPlaying={nowPlaying} />
            {!showRaw && post.note && (
              <div style={{ fontFamily: '"Courier Prime", monospace', fontSize: 12, fontStyle: 'italic', color: INK_SOFT, marginBottom: 18 }}>{post.note}</div>
            )}
            <ArticleBody text={showRaw && post.raw ? post.raw : post.content} showRaw={showRaw} />
            {!showRaw && <ArticleFooter post={post} likes={likes} toggleLike={toggleLike} onTag={onTag} />}
          </article>

          {/* sidebar */}
          <aside style={{ flex: '0 0 28%', maxWidth: 280 }}>
            <Sidebar posts={posts} nowPlaying={nowPlaying} onTag={onTag} onMonth={onMonth} />
          </aside>
        </div>
      </div>

      {/* status */}
      <div className="flex items-center justify-between px-3 py-0.5 shrink-0" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-bevel-dark)', color: 'var(--color-text-secondary)', fontFamily: '"Courier Prime", monospace', fontSize: 11 }}>
        <span>{post.filename || `${post.title}.txt`}{showRaw ? ' (raw)' : ''}</span>
        <span>{post.category || 'general'}</span>
      </div>
    </div>
  )
}

// ── desktop: index (floppy-disk labels) ───────────────────────────────────

function FloppyCard({ post, onOpen }) {
  return (
    <button
      onClick={() => onOpen(post.id)}
      style={{ textAlign: 'left', background: '#2b2f3a', border: 'none', cursor: 'pointer', padding: 6, width: 168, boxShadow: '2px 2px 0 rgba(0,0,0,0.3)', position: 'relative' }}
    >
      {/* shutter */}
      <div style={{ height: 22, background: '#c7ccd6', margin: '0 30px 6px', borderRadius: '0 0 3px 3px', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: 14, height: '100%', background: '#9aa0ad' }} />
      </div>
      {/* label */}
      <div style={{ background: PAPER, padding: '7px 8px', minHeight: 78 }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.2, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.title}</div>
        <div style={{ fontFamily: '"Courier Prime", monospace', fontSize: 10, color: INK_SOFT }}>{fmtShort(post.created_at)}</div>
        <div style={{ fontFamily: '"Courier Prime", monospace', fontSize: 10, color: INK_SOFT, marginTop: 2 }}>{post.views || 0} reads</div>
      </div>
    </button>
  )
}

function DesktopIndex({ posts, allPosts, onOpen, query, setQuery, sort, setSort, category, setCategory, tag, month, clearFilters }) {
  const hasFilter = category !== 'all' || tag || month || query
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#cfc6ae' }}>
      {/* masthead */}
      <div className="shrink-0" style={{ background: 'var(--color-titlebar-active)', color: '#fff', padding: '8px 14px', fontFamily: 'Georgia, serif' }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>The Web Log</div>
        <div style={{ fontFamily: '"Courier Prime", monospace', fontSize: 10, opacity: 0.85 }}>{allPosts.length} entries · est. since you got here</div>
      </div>

      {/* controls */}
      <div className="flex items-center gap-2 px-3 py-1.5 shrink-0 flex-wrap" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-bevel-dark)', fontFamily: '"Courier Prime", monospace', fontSize: 11 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="search entries…"
          style={{ background: '#fff', border: '1px solid #999', padding: '3px 7px', fontFamily: 'inherit', fontSize: 11, color: '#000', width: 160 }}
        />
        <span style={{ color: 'var(--color-text-disabled)' }}>sort:</span>
        {SORT_OPTIONS.map(s => (
          <button key={s.id} onClick={() => setSort(s.id)} className="px-1.5 py-0.5 border-none cursor-pointer" style={{ background: sort === s.id ? 'var(--color-accent)' : 'transparent', color: sort === s.id ? '#1a1207' : '#666', fontFamily: 'inherit', fontSize: 11 }}>{s.label}</button>
        ))}
        <span style={{ color: '#ccc' }}>|</span>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)} className="px-1.5 py-0.5 border-none cursor-pointer" style={{ background: category === c.id ? 'var(--color-accent)' : 'transparent', color: category === c.id ? '#1a1207' : '#666', fontFamily: 'inherit', fontSize: 11 }}>{c.label}</button>
        ))}
      </div>

      {/* active filters */}
      {hasFilter && (
        <div className="flex items-center gap-2 px-3 py-1 shrink-0" style={{ background: '#fff8e6', borderBottom: `1px solid ${PAPER_EDGE}`, fontFamily: '"Courier Prime", monospace', fontSize: 11, color: INK_SOFT }}>
          showing
          {tag && <strong style={{ color: 'var(--color-accent)' }}>#{tag}</strong>}
          {month && <strong style={{ color: 'var(--color-accent)' }}>{monthLabel(month)}</strong>}
          {category !== 'all' && <strong style={{ color: 'var(--color-accent)' }}>{category}</strong>}
          {query && <strong style={{ color: 'var(--color-accent)' }}>“{query}”</strong>}
          <button onClick={clearFilters} className="border-none bg-transparent cursor-pointer underline" style={{ color: 'var(--color-accent)', fontFamily: 'inherit', fontSize: 11 }}>clear</button>
        </div>
      )}

      {/* shelf */}
      <div className="flex-1 overflow-auto" style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 16, alignContent: 'flex-start' }}>
        {posts.map(post => <FloppyCard key={post.id} post={post} onOpen={onOpen} />)}
        {posts.length === 0 && <div style={{ color: '#5a5340', fontFamily: '"Courier Prime", monospace', fontSize: 12, padding: 8 }}>No entries match.</div>}
      </div>
    </div>
  )
}

// ── mobile: single column ─────────────────────────────────────────────────

function MobileList({ posts, allPosts, onOpen, query, setQuery }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f2f2f7', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      <div style={{ padding: '10px 16px 4px', background: 'var(--color-titlebar-active)', color: '#fff' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700 }}>The Web Log</div>
      </div>
      <div style={{ padding: '8px 16px', background: '#f2f2f7' }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="🔍 Search" style={{ width: '100%', background: '#e5e5ea', borderRadius: 10, padding: '8px 12px', fontSize: 14, color: '#000', border: 'none', outline: 'none', fontFamily: 'inherit' }} />
      </div>
      <div className="flex-1 overflow-auto">
        <div style={{ padding: '0 16px 4px', fontSize: 11, color: '#8e8e93', fontWeight: 600, textTransform: 'uppercase' }}>{posts.length} of {allPosts.length} entries</div>
        {posts.map(post => {
          const preview = (post.content || '').slice(0, 80).replace(/\n/g, ' ') + '…'
          return (
            <div key={post.id} onClick={() => onOpen(post.id)} style={{ padding: '12px 16px', background: '#fff', borderBottom: '0.5px solid #e5e5ea' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#000', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#8e8e93' }}>{fmtShort(post.created_at)}</span>
                <span style={{ fontSize: 12, color: '#8e8e93', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preview}</span>
              </div>
            </div>
          )
        })}
        {posts.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: '#8e8e93', fontSize: 13 }}>No entries match.</div>}
      </div>
    </div>
  )
}

function MobilePost({ post, posts, onBack, onTag, onMonth }) {
  const repo = useRepo()
  const { config } = useDesktopConfig()
  const [showRaw, setShowRaw] = useState(false)
  const [likes, toggleLike] = useLikes(post)

  useEffect(() => { repo.posts.incrementViews(post.id) }, [post.id, repo])

  const nowPlaying = nowPlayingOf(post, config)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#cfc6ae' }}>
      <div className="flex items-center justify-between px-3 shrink-0" style={{ height: 44, background: 'var(--color-surface)', borderBottom: '1px solid var(--color-bevel-dark)' }}>
        <button onClick={onBack} className="border-none bg-transparent cursor-pointer" style={{ color: 'var(--color-accent)', fontSize: 15, fontFamily: '"Courier Prime", monospace' }}>‹ Index</button>
        {post.raw && (
          <div className="flex" style={{ background: '#d4d0c8', borderRadius: 6, padding: 2 }}>
            <button onClick={() => setShowRaw(false)} className="border-none cursor-pointer px-2 py-0.5" style={{ background: !showRaw ? 'var(--color-accent)' : 'transparent', borderRadius: 4, fontSize: 11, color: '#1a1207', fontFamily: '"Courier Prime", monospace' }}>Polished</button>
            <button onClick={() => setShowRaw(true)} className="border-none cursor-pointer px-2 py-0.5" style={{ background: showRaw ? 'var(--color-accent)' : 'transparent', borderRadius: 4, fontSize: 11, color: showRaw ? '#1a1207' : '#000', fontFamily: '"Courier Prime", monospace' }}>Raw</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto" style={{ padding: 12 }}>
        <article style={{ background: PAPER, border: `1px solid ${PAPER_EDGE}`, boxShadow: '2px 2px 0 rgba(0,0,0,0.12)', padding: '24px 20px', marginBottom: 14 }}>
          <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 24, fontWeight: 700, lineHeight: 1.2, margin: '0 0 12px', color: INK }}>{post.title}</h1>
          <MetaHeader post={post} nowPlaying={nowPlaying} />
          {!showRaw && post.note && <div style={{ fontFamily: '"Courier Prime", monospace', fontSize: 12, fontStyle: 'italic', color: INK_SOFT, marginBottom: 16 }}>{post.note}</div>}
          <ArticleBody text={showRaw && post.raw ? post.raw : post.content} showRaw={showRaw} />
          {!showRaw && <ArticleFooter post={post} likes={likes} toggleLike={toggleLike} onTag={onTag} />}
        </article>

        <Sidebar posts={posts} nowPlaying={nowPlaying} onTag={onTag} onMonth={onMonth} />
      </div>
    </div>
  )
}

// ── main ───────────────────────────────────────────────────────────────────

export default function Blog() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const repo = useRepo()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [openPostId, setOpenPostId] = useState(null)
  const [sort, setSort] = useState('recent')
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState(null)
  const [month, setMonth] = useState(null)

  const loadPosts = useCallback(async () => {
    const data = await repo.posts.list()
    setPosts(data)
    setLoading(false)
  }, [repo])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadPosts() }, [loadPosts])

  // Deep-link: open a specific post when arriving from ChemFeed.
  const initialItem = useInitialItem('blog')
  useEffect(() => {
    if (!initialItem || !posts.length) return
    const p = posts.find(x => String(x.id) === String(initialItem))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (p) setOpenPostId(p.id)
  }, [initialItem, posts])

  const filtered = useMemo(() => {
    let out = [...posts]
    out.sort((a, b) => {
      if (sort === 'popular') return (b.views || 0) - (a.views || 0)
      if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
      return new Date(b.created_at) - new Date(a.created_at)
    })
    if (category !== 'all') out = out.filter(p => (p.category || 'general') === category)
    if (tag) out = out.filter(p => (p.tags || []).includes(tag))
    if (month) out = out.filter(p => monthKey(p.created_at) === month)
    const q = query.trim().toLowerCase()
    if (q) out = out.filter(p => `${p.title} ${p.content} ${p.filename || ''}`.toLowerCase().includes(q))
    return out
  }, [posts, sort, category, tag, month, query])

  const openPost = posts.find(p => p.id === openPostId)

  const goToTag = (t) => { setTag(t); setMonth(null); setCategory('all'); setQuery(''); setOpenPostId(null) }
  const goToMonth = (m) => { setMonth(m); setTag(null); setCategory('all'); setQuery(''); setOpenPostId(null) }
  const clearFilters = () => { setTag(null); setMonth(null); setCategory('all'); setQuery('') }

  let content
  if (loading) {
    content = <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#cfc6ae', color: '#5a5340', fontFamily: '"Courier Prime", monospace' }}>Loading…</div>
  } else if (isMobile) {
    content = openPost
      ? <MobilePost post={openPost} posts={posts} onBack={() => setOpenPostId(null)} onTag={goToTag} onMonth={goToMonth} />
      : <MobileList posts={filtered} allPosts={posts} onOpen={setOpenPostId} query={query} setQuery={setQuery} />
  } else if (openPost) {
    content = <DesktopPost post={openPost} posts={posts} onBack={() => setOpenPostId(null)} onTag={goToTag} onMonth={goToMonth} />
  } else {
    content = (
      <DesktopIndex
        posts={filtered} allPosts={posts} onOpen={setOpenPostId}
        query={query} setQuery={setQuery} sort={sort} setSort={setSort}
        category={category} setCategory={setCategory} tag={tag} month={month} clearFilters={clearFilters}
      />
    )
  }

  return <>{content}<OwnerManager resource="posts" onChange={loadPosts} /></>
}
