import { useState, useEffect, useCallback } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useRepo } from '../../lib/repo/useRepo'
import { useProfile } from '../../context/ProfileContext'
import { useInitialItem } from '../../hooks/useInitialItem'
import { parseVideoUrl } from '../../lib/videoEmbed'
import { UploadButton } from '../_shared/UploadButton'

// ════════════════════════════════════════════════════════════════════════
// The Food List — a retro diner menu. Three sections (Been To / Want To Try /
// From My Kitchen). Each item gets meal photos, a context-aware link
// (restaurant site, or a recipe video via parseVideoUrl for cook items), and a
// review. DB-backed via repo.foodItems on both nodes; owner edits inline.
// ════════════════════════════════════════════════════════════════════════

const CATEGORIES = [
  { id: 'been', label: 'Been To', heading: 'Been To', icon: '✅' },
  { id: 'want', label: 'Want To Try', heading: 'Want To Try', icon: '📍' },
  { id: 'cook', label: 'Want To Cook', heading: 'From My Kitchen', icon: '👨‍🍳' },
]
const headingFor = (id) => (CATEGORIES.find(c => c.id === id)?.heading || '')

// Deliberate diner palette (paper menu + red/mustard ink).
const PAPER = '#f4ead2'
const PAPER_EDGE = '#d8c497'
const INK = '#2a1d12'
const FADE = '#8a755a'
const RED = '#c2342b'
const MUSTARD = '#b8862b'
const OUTER = '#241008'

const RESTAURANTS = [
  { id: 1, status: 'been', name: 'Carnivore', location: 'Nairobi, Kenya', cuisine: 'BBQ / Game Meat', rating: 9, icon: '🥩', review: 'The beast of a feast. All-you-can-eat game meat served on Maasai swords. Crocodile, ostrich, the works. Tourist trap? Maybe. Worth it? Absolutely.', favorite: 'Ostrich meatballs + the dawa cocktail', vibe: 'Safari lodge meets food hall' },
  { id: 2, status: 'been', name: 'About Thyme', location: 'Nairobi, Kenya', cuisine: 'Modern European', rating: 8, icon: '🌿', review: 'Clean, thoughtful plating. The kind of restaurant where the chef actually cares. Great wine list. Service is on point without being stuffy.', favorite: 'Lamb shank', vibe: 'Date night, impress someone' },
  { id: 3, status: 'been', name: 'Mama Oliech', location: 'Nairobi, Kenya', cuisine: 'Kenyan / Fish', rating: 9, icon: '🐟', review: 'The best fish in Nairobi, full stop. Fried tilapia with ugali and sukuma wiki. No frills, just legendary food. Obama ate here. Enough said.', favorite: 'Fried whole tilapia + ugali', vibe: 'No-nonsense, the food speaks' },
  { id: 4, status: 'been', name: 'Kilimanjaro Jamia', location: 'Nairobi, Kenya', cuisine: 'Swahili / Coast', rating: 8, icon: '🍛', review: 'Biryanis that hit different. This is comfort food for the soul. Old school Nairobi institution. The mishkaki is a must.', favorite: 'Chicken biryani + mishkaki', vibe: 'Local legend, been here forever' },
  { id: 5, status: 'been', name: 'Hereford & Hops', location: 'Nairobi, Kenya', cuisine: 'Gastropub', rating: 7, icon: '🍔', review: 'Solid burgers, good craft beer selection. Nothing revolutionary but consistent. Good place to catch a game with friends.', favorite: 'The classic burger + a pale ale', vibe: 'Casual hangout, sports bar energy' },
  { id: 6, status: 'been', name: 'Tin Roof Café', location: 'Nairobi, Kenya', cuisine: 'Brunch / Café', rating: 8, icon: '☕', review: 'Best brunch spot in Karen. The garden setting is beautiful. Eggs benny is reliable. Coffee is great. Go early on weekends — it fills up fast.', favorite: 'Eggs benedict + fresh juice', vibe: 'Weekend brunch, garden vibes' },
  { id: 20, status: 'want', name: 'Nobu', location: 'Malibu, CA', cuisine: 'Japanese', rating: 0, icon: '🍣', review: '', favorite: '', why: 'The black cod miso is legendary. Need to experience it at the Malibu location.' },
  { id: 21, status: 'want', name: 'Supper', location: 'Nairobi, Kenya', cuisine: 'Pan-Asian', rating: 0, icon: '🥢', review: '', favorite: '', why: 'Everyone keeps telling me to go. Pan-Asian fusion in Westlands. The sushi is supposedly incredible.' },
  { id: 22, status: 'want', name: 'Sushi Saito', location: 'Tokyo, Japan', cuisine: 'Omakase', rating: 0, icon: '🏯', review: '', favorite: '', why: 'Three Michelin stars. 8-seat counter. The ultimate sushi experience. Life goal.' },
  { id: 23, status: 'want', name: 'Asador Etxebarri', location: 'Basque Country, Spain', cuisine: 'Grill', rating: 0, icon: '🔥', review: '', favorite: '', why: 'They grill everything — even the dessert. Top 10 in the world. The smoky flavors are supposed to be unreal.' },
  { id: 24, status: 'want', name: 'Franklin BBQ', location: 'Austin, TX', cuisine: 'BBQ', rating: 0, icon: '🍖', review: '', favorite: '', why: 'The 4-hour line is the price of admission. Brisket that people say changes your understanding of what meat can be.' },
  { id: 30, status: 'cook', name: 'Birria Tacos', location: 'Home', cuisine: 'Mexican', rating: 0, icon: '🌮', review: '', favorite: '', why: 'The consomme dip makes these. Saw a video and now I can\'t stop thinking about it. Need a dutch oven first.' },
  { id: 31, status: 'cook', name: 'Homemade Ramen (Tonkotsu)', location: 'Home', cuisine: 'Japanese', rating: 0, icon: '🍜', review: '', favorite: '', why: 'The broth takes 12+ hours. It\'s a weekend project. Want to nail the soft-boiled egg too.' },
  { id: 32, status: 'cook', name: 'Pilau (Kenyan spiced rice)', location: 'Home', cuisine: 'Kenyan', rating: 0, icon: '🍛', review: '', favorite: '', why: 'Mom makes the best pilau. Need to get her recipe and actually learn it properly instead of just eating it.' },
  { id: 33, status: 'cook', name: 'Smash Burgers', location: 'Home', cuisine: 'American', rating: 0, icon: '🍔', review: '', favorite: '', why: 'Cast iron, American cheese, Martin\'s potato bun. Simple but I want to perfect the technique.' },
  { id: 34, status: 'cook', name: 'Beef Wellington', location: 'Home', cuisine: 'British', rating: 0, icon: '🥩', review: '', favorite: '', why: 'The Gordon Ramsay of it all. This is the cooking boss fight. Probably going to fail the first time.' },
]

const descLine = (item) => [item.cuisine, item.location].map(s => (s || '').trim()).filter(Boolean).join(' · ')
const priceLabel = (item) => item.status === 'been' ? ((item.rating || 0) > 0 ? `${item.rating}/10` : '—') : item.status === 'cook' ? 'RECIPE' : 'WISH'
function chefNote(item) {
  if (item.status === 'been' && item.favorite) return { label: 'order', text: item.favorite }
  if (item.status === 'want' && item.why) return { label: 'why', text: item.why }
  if (item.status === 'cook' && item.why) return { label: 'note', text: item.why }
  return null
}

// ── A menu line: name … dotted leader … price (rating where a price would be) ──
function MenuLine({ item, onOpen }) {
  const note = chefNote(item)
  const priced = item.status === 'been' && (item.rating || 0) > 0
  return (
    <button onClick={() => onOpen(item.id)} title={item.name}
      style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 4px', borderBottom: '1px solid rgba(42,29,18,0.08)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(42,29,18,0.05)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 700, fontSize: 15, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>{item.icon} {item.name}</span>
        <span style={{ flex: 1, borderBottom: `2px dotted ${PAPER_EDGE}`, transform: 'translateY(-3px)' }} />
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14, color: priced ? RED : MUSTARD, whiteSpace: 'nowrap' }}>{priceLabel(item)}</span>
      </div>
      <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: FADE, marginTop: 2 }}>{descLine(item)}</div>
      {note && <div style={{ fontFamily: '"Courier Prime", monospace', fontSize: 11, color: '#7c5a3a', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>↳ {note.label}: {note.text}</div>}
    </button>
  )
}

function Masthead() {
  return (
    <div style={{ textAlign: 'center', borderBottom: `3px double ${RED}`, paddingBottom: 10, marginBottom: 6 }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 9, letterSpacing: 3, color: RED, fontWeight: 700 }}>★ EST. 2026 ★</div>
      <div style={{ fontFamily: '"Arial Black", Impact, Georgia, serif', fontWeight: 900, fontSize: 26, letterSpacing: 1, color: INK, lineHeight: 1.05, marginTop: 2 }}>THE FOOD LIST</div>
      <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: FADE, marginTop: 2 }}>good eats &amp; someday eats</div>
    </div>
  )
}

function SectionTabs({ tab, setTab, mobile }) {
  if (mobile) {
    return (
      <div style={{ display: 'flex', background: 'rgba(42,29,18,0.08)', borderRadius: 8, padding: 2 }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setTab(c.id)} className="flex-1 border-none cursor-pointer" style={{ padding: '6px 0', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: 'Georgia, serif', background: tab === c.id ? RED : 'transparent', color: tab === c.id ? '#fff' : INK }}>{c.label}</button>
        ))}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      {CATEGORIES.map(c => (
        <button key={c.id} onClick={() => setTab(c.id)} style={{ padding: '3px 12px', border: `1px solid ${tab === c.id ? RED : 'transparent'}`, cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 12, background: tab === c.id ? RED : 'transparent', color: tab === c.id ? '#fff' : INK, borderRadius: 2 }}>{c.icon} {c.label}</button>
      ))}
    </div>
  )
}

function EmptyMenu({ owner }) {
  return (
    <div style={{ textAlign: 'center', padding: '30px 16px', fontFamily: 'Georgia, serif', color: FADE }}>
      <div style={{ fontSize: 34, marginBottom: 6 }}>🍽️</div>
      <div style={{ fontStyle: 'italic', fontSize: 13 }}>{owner ? 'The menu is empty — add your first dish.' : 'No dishes on the menu yet.'}</div>
    </div>
  )
}

// ── Desktop: printed menu card ──
function DinerMenu({ data, tab, setTab, onOpen, isOwner, onNew }) {
  const items = data.filter(r => r.status === tab)
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', background: OUTER, padding: 16 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', background: PAPER, border: `1px solid ${PAPER_EDGE}`, boxShadow: '0 8px 30px rgba(0,0,0,0.5)', padding: '18px 22px' }}>
        <Masthead />
        <SectionTabs tab={tab} setTab={setTab} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${RED}`, paddingBottom: 4, marginBottom: 4 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14, color: RED, letterSpacing: 1 }}>{headingFor(tab)}</span>
          {isOwner && <button onClick={onNew} style={{ fontFamily: 'Georgia, serif', fontSize: 11, border: `1px solid ${RED}`, background: 'transparent', color: RED, cursor: 'pointer', padding: '2px 8px', borderRadius: 2 }}>+ Add</button>}
        </div>
        {items.length === 0 ? <EmptyMenu owner={isOwner} /> : items.map(item => <MenuLine key={item.id} item={item} onOpen={onOpen} />)}
      </div>
    </div>
  )
}

// ── Mobile: single scrollable menu + segmented control ──
function MobileMenu({ data, tab, setTab, onOpen, isOwner, onNew }) {
  const items = data.filter(r => r.status === tab)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: OUTER }}>
      <div className="shrink-0" style={{ position: 'sticky', top: 0, zIndex: 2, background: PAPER, padding: '12px 14px 10px', borderBottom: `3px double ${RED}` }}>
        <Masthead />
        <SectionTabs tab={tab} setTab={setTab} mobile />
      </div>
      <div className="flex-1 overflow-auto" style={{ background: PAPER }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '8px 16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${RED}`, paddingBottom: 4, marginBottom: 4 }}>
            <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 15, color: RED }}>{headingFor(tab)}</span>
            {isOwner && <button onClick={onNew} style={{ fontFamily: 'Georgia, serif', fontSize: 12, border: `1px solid ${RED}`, background: 'transparent', color: RED, cursor: 'pointer', padding: '3px 10px', borderRadius: 2 }}>+ Add</button>}
          </div>
          {items.length === 0 ? <EmptyMenu owner={isOwner} /> : items.map(item => <MenuLine key={item.id} item={item} onOpen={onOpen} />)}
        </div>
      </div>
    </div>
  )
}

// ── Meal photo gallery (owner: upload to per-user storage or paste a URL) ──
function PhotoStrip({ photos, isOwner, onAdd }) {
  const [url, setUrl] = useState('')
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {photos.map((p, i) => (
          <a key={i} href={p} target="_blank" rel="noreferrer" style={{ display: 'block', aspectRatio: '1', background: '#000', borderRadius: 3, overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
            <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </a>
        ))}
        {photos.length === 0 && !isOwner && <div style={{ gridColumn: '1 / -1', fontSize: 12, color: FADE, fontStyle: 'italic' }}>No photos yet.</div>}
      </div>
      {isOwner && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <UploadButton bucket="photos" label="+ Add meal photo" onUploaded={(u) => onAdd(u)} />
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="…or paste an image URL" style={{ flex: 1, padding: '5px 8px', border: `1px solid ${PAPER_EDGE}`, background: '#fff', color: INK, fontFamily: 'inherit', fontSize: 12, outline: 'none' }} />
            <button onClick={() => { const v = url.trim(); if (v) { onAdd(v); setUrl('') } }} style={{ padding: '5px 12px', border: 'none', cursor: 'pointer', background: RED, color: '#fff', fontWeight: 700, fontSize: 12 }}>Add</button>
          </div>
        </div>
      )}
    </div>
  )
}

// Context-aware link: recipe video (cook) via parseVideoUrl, else a site link.
function LinkBlock({ item }) {
  if (!item.link) return null
  if (item.status === 'cook') {
    const v = parseVideoUrl(item.link)
    if (v.kind === 'iframe') {
      return (
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 12, color: RED, marginBottom: 6 }}>WATCH RECIPE</div>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000', borderRadius: 4, overflow: 'hidden' }}>
            <iframe src={v.embedUrl} title="recipe" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )
    }
    if (v.kind === 'video') {
      return (
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 12, color: RED, marginBottom: 6 }}>WATCH RECIPE</div>
          <video src={v.embedUrl} controls playsInline style={{ width: '100%', borderRadius: 4, background: '#000' }} />
        </div>
      )
    }
    return <a href={item.link} target="_blank" rel="noreferrer" style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14, color: RED }}>Watch ↗</a>
  }
  return <a href={item.link} target="_blank" rel="noreferrer" style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14, color: RED }}>Visit site ↗</a>
}

function Field({ label, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 12, color: RED, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: '"Courier Prime", monospace', fontSize: 13, color: INK, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{children}</div>
    </div>
  )
}

// ── Item detail (overlay on both desktop + mobile) ──
function FoodDetail({ item, isOwner, repo, onChange, onClose, onEdit }) {
  const addPhoto = async (url) => { await repo.foodItems.addPhoto(item.id, url); onChange() }
  const isCook = item.status === 'cook'
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', background: OUTER, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#160a05', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUSTARD, fontFamily: 'Georgia, serif', fontSize: 14 }}>← Menu</button>
        {isOwner && <button onClick={onEdit} style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${MUSTARD}`, cursor: 'pointer', color: MUSTARD, fontFamily: 'Georgia, serif', fontSize: 12, padding: '3px 10px', borderRadius: 2 }}>Edit</button>}
      </div>
      <div style={{ flex: 1, padding: 16, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 540, background: PAPER, border: `1px solid ${PAPER_EDGE}`, boxShadow: '0 6px 24px rgba(0,0,0,0.5)', padding: 22 }}>
          <div style={{ textAlign: 'center', borderBottom: `2px solid ${RED}`, paddingBottom: 10 }}>
            <div style={{ fontSize: 40 }}>{item.icon}</div>
            <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22, color: INK }}>{item.name}</div>
            <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, color: FADE }}>{descLine(item)}</div>
            {item.status === 'been' && (item.rating || 0) > 0 && <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 15, color: RED, marginTop: 4 }}>{item.rating}/10</div>}
            {item.status !== 'been' && <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: MUSTARD, letterSpacing: 1, marginTop: 4 }}>{isCook ? 'FROM MY KITCHEN' : 'ON THE WISH LIST'}</div>}
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 12, color: RED, letterSpacing: 1, marginBottom: 6 }}>PHOTOS</div>
            <PhotoStrip photos={item.photo_urls || []} isOwner={isOwner} onAdd={addPhoto} />
          </div>

          {item.link && <div style={{ marginTop: 14 }}><LinkBlock item={item} /></div>}

          {item.review && <Field label={isCook ? 'HOW IT TURNED OUT' : 'REVIEW'}>{item.review}</Field>}
          {item.favorite && <Field label="ORDER THIS">{item.favorite}</Field>}
          {item.vibe && <Field label="VIBE">{item.vibe}</Field>}
          {item.why && <Field label={isCook ? 'WHY I WANT TO MAKE IT' : 'WHY I WANT TO GO'}>{item.why}</Field>}
        </div>
      </div>
    </div>
  )
}

// ── Owner: create / edit form ──
const FIELD = { width: '100%', padding: '7px 9px', border: `1px solid ${PAPER_EDGE}`, background: '#fff', color: INK, fontFamily: '"Courier Prime", monospace', fontSize: 13, outline: 'none', marginTop: 2 }
const LBL = { display: 'block', fontFamily: 'Georgia, serif', fontSize: 11, color: '#7a6048', letterSpacing: 0.5, marginTop: 8 }

function FoodForm({ item, onSave, onCancel, onDelete, busy }) {
  const [f, setF] = useState({
    name: item?.name || '', status: item?.status || 'been', cuisine: item?.cuisine || '', location: item?.location || '',
    rating: item?.rating ?? 0, icon: item?.icon || '', link: item?.link || '', review: item?.review || '',
    favorite: item?.favorite || '', vibe: item?.vibe || '', why: item?.why || '',
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const isCook = f.status === 'cook'
  const save = () => onSave({
    name: f.name.trim(), status: f.status, cuisine: f.cuisine.trim() || null, location: f.location.trim() || null,
    rating: Number(f.rating) || 0, icon: f.icon.trim() || '🍽️', link: f.link.trim() || null, review: f.review.trim() || null,
    favorite: f.favorite.trim() || null, vibe: f.vibe.trim() || null, why: f.why.trim() || null,
  })
  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 17, color: INK, marginBottom: 4 }}>{item ? 'Edit dish' : 'New dish'}</div>
      <label style={LBL}>Name<input value={f.name} onChange={e => set('name', e.target.value)} style={FIELD} /></label>
      <div style={{ display: 'flex', gap: 8 }}>
        <label style={{ ...LBL, flex: 1 }}>Section
          <select value={f.status} onChange={e => set('status', e.target.value)} style={FIELD}>
            <option value="been">Been To</option>
            <option value="want">Want To Try</option>
            <option value="cook">Want To Cook</option>
          </select>
        </label>
        <label style={{ ...LBL, width: 80 }}>Icon<input value={f.icon} onChange={e => set('icon', e.target.value)} placeholder="🍜" style={FIELD} /></label>
        <label style={{ ...LBL, width: 80 }}>Rating<input type="number" min="0" max="10" value={f.rating} onChange={e => set('rating', e.target.value)} style={FIELD} /></label>
      </div>
      <label style={LBL}>Cuisine<input value={f.cuisine} onChange={e => set('cuisine', e.target.value)} style={FIELD} /></label>
      <label style={LBL}>Location<input value={f.location} onChange={e => set('location', e.target.value)} style={FIELD} /></label>
      <label style={LBL}>{isCook ? 'Recipe video URL' : 'Website link'}<input value={f.link} onChange={e => set('link', e.target.value)} placeholder={isCook ? 'YouTube / Vimeo / .mp4 …' : 'https://…'} style={FIELD} /></label>
      <label style={LBL}>{isCook ? 'How it turned out' : 'Review'}<textarea value={f.review} onChange={e => set('review', e.target.value)} rows={3} style={{ ...FIELD, resize: 'vertical' }} /></label>
      <label style={LBL}>Order this<input value={f.favorite} onChange={e => set('favorite', e.target.value)} style={FIELD} /></label>
      <label style={LBL}>Vibe<input value={f.vibe} onChange={e => set('vibe', e.target.value)} style={FIELD} /></label>
      <label style={LBL}>Why (want / cook)<textarea value={f.why} onChange={e => set('why', e.target.value)} rows={2} style={{ ...FIELD, resize: 'vertical' }} /></label>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={save} disabled={busy || !f.name.trim()} style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', background: RED, color: '#fff', fontWeight: 700, fontSize: 13, opacity: (busy || !f.name.trim()) ? 0.6 : 1 }}>{busy ? 'Saving…' : 'Save'}</button>
        <button onClick={onCancel} style={{ padding: '8px 16px', border: `1px solid ${PAPER_EDGE}`, cursor: 'pointer', background: 'transparent', color: INK, fontSize: 13 }}>Cancel</button>
        {item && onDelete && <button onClick={onDelete} style={{ marginLeft: 'auto', padding: '8px 16px', border: 'none', cursor: 'pointer', background: 'transparent', color: RED, fontSize: 13, textDecoration: 'underline' }}>Delete</button>}
      </div>
    </div>
  )
}

// ── Main ──
export default function Restaurants() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const repo = useRepo()
  const { node, isOwner } = useProfile()
  const [data, setData] = useState(node.kind === 'flagship' ? RESTAURANTS : [])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('been')
  const [openId, setOpenId] = useState(null)
  const [editing, setEditing] = useState(null)   // null | 'new' | id
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const rows = await repo.foodItems.list()
    if (rows && rows.length > 0) setData(rows)
    else if (node.kind !== 'flagship') setData([])
    setLoading(false)
  }, [repo, node])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  // Deep-link from ChemFeed.
  const initialItem = useInitialItem('restaurants')
  useEffect(() => {
    if (!initialItem || !data?.length) return
    const it = data.find(r => String(r.id) === String(initialItem))
    if (!it) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenId(it.id)
    if (it.status) setTab(it.status)
  }, [initialItem, data])

  const openItem = data.find(r => r.id === openId)
  const editingItem = editing && editing !== 'new' ? data.find(r => r.id === editing) : null

  const saveItem = async (patch) => {
    setBusy(true)
    if (editing === 'new') await repo.foodItems.create(patch)
    else await repo.foodItems.update(editing, patch)
    setBusy(false)
    setEditing(null)
    await load()
  }
  const deleteItem = async () => {
    if (!window.confirm('Delete this item?')) return
    await repo.foodItems.remove(editing)
    setEditing(null)
    setOpenId(null)
    await load()
  }

  if (loading) {
    return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: OUTER, color: '#a8916f', fontFamily: 'Georgia, serif' }}>Loading…</div>
  }

  if (editing) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'auto', background: OUTER, padding: 16 }}>
        <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUSTARD, fontFamily: 'Georgia, serif', fontSize: 14, marginBottom: 12 }}>← Back</button>
        <div style={{ maxWidth: 500, margin: '0 auto', background: PAPER, border: `1px solid ${PAPER_EDGE}`, padding: 20 }}>
          <FoodForm item={editingItem} busy={busy} onSave={saveItem} onCancel={() => setEditing(null)} onDelete={editingItem ? deleteItem : null} />
        </div>
      </div>
    )
  }

  if (openItem) {
    return <FoodDetail item={openItem} isOwner={isOwner} repo={repo} onChange={load} onClose={() => setOpenId(null)} onEdit={() => setEditing(openItem.id)} />
  }

  const menuProps = { data, tab, setTab, onOpen: setOpenId, isOwner, onNew: () => setEditing('new') }
  return isMobile ? <MobileMenu {...menuProps} /> : <DinerMenu {...menuProps} />
}
