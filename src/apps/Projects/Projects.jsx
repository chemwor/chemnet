import { useState } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'

function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^?&]+)/)
  return m ? m[1] : null
}

const PROJECTS = [
  {
    id: 'dmhoa',
    name: 'Dispute My HOA',
    icon: '🏠',
    status: 'active',
    type: 'tech',
    tagline: 'The tool homeowners wish they had the first time their HOA sent a letter.',
    description: `Dispute My HOA (DMHOA) helps homeowners fight back against unfair, incorrect, or overreaching HOA violations — without hiring a lawyer, without spending weeks writing letters, and without getting steamrolled by a management company that does this every day.

You upload your violation notice, answer a few questions about your situation, and DMHOA generates a professional, legally-aware dispute letter tailored to your case — ready to send to your HOA or management company. One letter. Forty-nine dollars. No subscriptions, no retainers, no games.

HOAs hold real power over homeowners — fines, liens, forced compliance, even foreclosure in extreme cases. And the system is stacked: management companies have lawyers, templates, and years of experience. The average homeowner has a violation notice, a deadline, and Google.

Most disputes never get filed, not because homeowners are in the wrong, but because the process feels overwhelming. The violation language is vague or contradicts the CC&Rs. Deadlines are short. Hiring an attorney costs more than just paying the fine. Writing a proper dispute letter requires knowing what to cite, what tone to use, and what not to say.

DMHOA closes that gap. It gives homeowners the same kind of structured, professional response that a paid attorney would draft — in minutes, for a flat fee, with no legal background required.

Handles: lawn/landscaping, architectural modifications, parking, trash/storage, holiday decorations, fines, selective enforcement, procedural errors, hearing requests, and record inspection.

DMHOA is not a law firm. It's a tool that gives homeowners leverage they didn't have before — clearly, affordably, and on their schedule.

You paid for your home. You should be able to defend it.`,
    stack: ['React', 'Node.js', 'PostgreSQL', 'Stripe', 'AI Letter Generation'],
    links: [],
    learnings: [
      'The system is stacked against homeowners. Management companies have lawyers and templates. Homeowners have Google and a deadline.',
      'Most disputes never get filed not because people are wrong but because the process feels overwhelming. Reducing friction is the whole product.',
      'Flat pricing ($49) removes the biggest barrier. People will pay to respond properly. They won\'t pay to start a subscription they might use once.',
      'Tone matters as much as content. Letters that are firm but measured get taken seriously. Angry midnight emails get ignored.',
    ],
    notes: 'Platform informed by how management companies actually respond to disputes and what kinds of letters they take seriously versus ignore. Private by default. Violation details, property info, and letter content stay with the user. No data selling.',
    roadmap: [
      { item: 'Find a winning ad', done: false },
      { item: 'Make content pipeline automated', done: false },
    ],
  },
  {
    id: 'mgn',
    name: 'My Guardian Neighbor',
    icon: '🛡️',
    status: 'on-hold',
    type: 'tech',
    tagline: 'Neighbors helping neighbors. Built for Metro Atlanta.',
    description: `My Guardian Neighbor (MGN) is a free, community-powered platform connecting Metro Atlanta families navigating hardship with local volunteers ready to show up. Groceries when the month runs long. A ride to a medical appointment. Help rewriting a resume after a layoff. A check-in on an aging parent whose kids live out of state.

No paywall. No gatekeepers. No 40-page application. Just a simple, direct way to ask for help — or to offer it — in your own neighborhood.

Atlanta is a city full of people who would help if they knew how. The problem isn't a shortage of kindness — it's a shortage of infrastructure. Families facing hardship get routed through fragmented nonprofits, overloaded 211 lines, and social services with months-long waitlists. Meanwhile, neighbors two streets over have a truck, a free Saturday, and no idea anyone nearby needs them.

MGN is built for that gap — the in-between moments where someone needs a hand today, and the system isn't fast enough to respond. The single parent between paychecks. The elder whose family lives three states away. The veteran reentering civilian life.

We're not trying to replace nonprofits, churches, or mutual aid networks. We're trying to make them all work faster by making the connection between need and neighbor as frictionless as possible.

Free, forever. Hyperlocal by design. Infrastructure, not charity. Built to last.`,
    stack: ['Next.js', 'Supabase', 'Mapbox', 'AI Moderation', 'SMS Integration'],
    links: [],
    learnings: [
      'The strongest safety net isn\'t built by institutions. It\'s built by neighbors who know each other and have easy ways to help.',
      'SMS-first coordination matters. Participation can\'t require a smartphone or a data plan if you want to reach everyone.',
      'Hyperlocal density is the chicken-and-egg problem. Launching neighborhood by neighborhood is better than going city-wide and being thin everywhere.',
      'Trust and moderation have to be built in from day one, not bolted on later.',
    ],
    notes: 'On hold until DMHOA ads are profitable. Verified volunteer matching, request/fulfillment pipeline, AI-assisted moderation, career tools (resume review, cover letter generator, skills-matching quiz). Designed for Metro Atlanta communities first. Every feature tuned for local, not generic national.',
  },
  {
    id: 'chemnet',
    name: 'ChemNet',
    icon: '💻',
    status: 'active',
    type: 'tech',
    tagline: "You're looking at it.",
    description: `This site. A personal space styled as a Win95 desktop OS because the internet should be fun again.

Built to chase the feeling of the old internet. A tech garden free from the homogeny of social media. Games, blogs, a terminal with secrets, hidden layers, and easter eggs tucked everywhere.

The site itself is the project. It will always be a work in progress.`,
    stack: ['React', 'Vite', 'react95', 'Tailwind', 'Framer Motion', 'Supabase'],
    links: [],
    learnings: [
      'Building a fake OS is basically building a real UI framework. Window management, z-indexing, and keeping state isolated between apps are all real problems.',
      'The retro aesthetic has constraints that force creative solutions. Win95 bevels look wrong if the colors are even slightly off.',
      'Having fun with a project is the best productivity hack. Added more features to this in two weeks than I have to work projects in months.',
    ],
    notes: '',
    roadmap: [
      { item: 'Wire all apps to read from Supabase (Blog done, Reviews done, Restaurants done)', done: true },
      { item: 'Admin Panel for content management', done: true },
      { item: 'Layer 3-5 puzzle system to unlock deeper content', done: false },
      { item: 'Boot sequence animation on first visit', done: false },
      { item: 'Photo uploads via admin for Projects, Trips, Car Mods', done: false },
      { item: 'Real-time Guestbook and Message Board via Supabase', done: false },
      { item: 'Push notifications / email integration for ChemMail', done: false },
      { item: 'Custom domain + SSL (ericchemwor.com)', done: false },
      { item: 'PWA support so it can be installed on phone home screen', done: false },
      { item: 'Shared high scores leaderboard (Supabase backed)', done: false },
      { item: 'More mobile-native app views (Guestbook, Trips, etc.)', done: false },
      { item: 'Fix games that are broken', done: false },
      { item: 'Add more games', done: false },
      { item: 'Thought board / Twitter equivalence', done: false },
      { item: 'Music player', done: false },
      { item: 'Connect Spotify', done: false },
      { item: 'Dark mode toggle for mobile', done: false },
      { item: 'Visitor analytics (privacy-respecting)', done: false },
    ],
  },
  {
    id: 'bmo',
    name: 'BMO',
    icon: '🤖',
    status: 'planning',
    type: 'hybrid',
    tagline: 'Personal AI assistant. Software + hardware.',
    description: `BMO is a personal AI assistant project. Named after BMO from Adventure Time because that's the energy. The idea is to replicate what this guy did and build my own version of it as a house assistant.

The main use case is a home companion. Ask it for recipes, have it help with meal planning, general house stuff. Not a generic chatbot. Something that sits in the kitchen or on the desk and is actually useful day to day.

Software side is an AI agent with memory and personality. Hardware side is a physical device with a small screen, speaker, and mic. Still in the planning phase. Figuring out what the right architecture looks like and what parts I need.`,
    stack: ['Python', 'LangChain', 'OpenAI', 'Raspberry Pi', 'Speaker/Mic', 'Small Display'],
    video: 'https://youtu.be/l5ggH-YhuAw?si=UnZ62DCUy6jggU_d',
    links: [],
    learnings: [
      'The gap between a chatbot and a useful assistant is context. It needs to remember things across conversations.',
      'Hardware adds a whole layer of complexity. Audio processing, wake words, display rendering. Might need to be software first, hardware second.',
      'The personality part is the hardest to get right. It needs to feel like talking to someone, not querying a database.',
    ],
    notes: 'Planning phase. Replicating the BMO build from the inspiration video as a starting point. Want it to handle recipes, kitchen help, and general house assistant tasks. Investigating RAG for personal knowledge base. Hardware enclosure could be 3D printed with a Raspberry Pi and small touchscreen.',
  },
  {
    id: 'bathroom',
    name: 'Bathroom Renovation',
    icon: '🚿',
    status: 'planned',
    type: 'physical',
    tagline: 'First real home renovation. Moody, warm, full gut.',
    description: `Full bathroom — gut and redo. Tile, vanity, fixtures, lighting, layout where it makes sense. The current setup is dated and feels like a rental.

The direction is moody and warm. Deep green herringbone tile in the shower with brass fixtures, and a pebble mosaic accent to break up the geometry with something organic. Sahara Carrara polished hexagon marble is the alternative if the green ends up feeling like too much. The whole palette pulls toward burnt orange, warm wood, and brass — a long way from the cold beige standard.

Plan to do as much hands-on as possible. Watching way too many YouTube videos on waterproofing, Schluter, and cutting tile around fixtures. Quotes still pending for the parts I won't do myself (plumbing rough-in, electrical).

Budget and timeline TBD.`,
    stack: [],
    photos: [
      { src: '/projects/bathroom/green-herringbone-shower.jpg', caption: 'Green herringbone shower walls + floor with pebble accent — Floor & Decor' },
      { src: '/projects/bathroom/pebble-mosaic-accent.jpg', caption: 'Pebble mosaic — accent wall option, organic texture against the herringbone' },
      { src: '/projects/bathroom/sahara-carrara-hexagon.jpg', caption: 'Sahara Carrara Polished hex marble — alt floor candidate ($14.99/sqft)' },
      { src: '/projects/bathroom/burnt-orange-mood.webp', caption: 'Color & material mood — burnt orange, brass, warm earth tones' },
    ],
    roadmap: [
      { item: 'Finalize tile selection (green herringbone vs Carrara hex)', done: false },
      { item: 'Get plumbing + electrical quotes', done: false },
      { item: 'Demo', done: false },
      { item: 'Rough plumbing + electrical', done: false },
      { item: 'Waterproofing + tile prep', done: false },
      { item: 'Tile install', done: false },
      { item: 'Vanity + fixtures install', done: false },
      { item: 'Paint, mirror, hardware, lighting', done: false },
    ],
    links: [],
  },
  {
    id: 'carmods',
    name: '2016 Camaro LT Build',
    icon: '🏎️',
    status: 'active',
    type: 'physical',
    tagline: 'Turning the V6 into something special.',
    description: `The Camaro project. A 2016 LT V6 (3.6L LGX) that I'm building into an SS-level daily over time. Phase by phase, mod by mod.

Current focus is catch-up maintenance (spark plugs, alignment), then Phase 1 (exhaust, brakes, tint, badge delete). Full interior carbon fiber treatment and exterior ZL1 conversion planned.

The full mod list, prices, and links are tracked in the Car Mods app on this site.`,
    stack: [],
    links: [{ label: 'Open Car Mods', url: '#carmods' }],
  },
  {
    id: 'lightdice',
    name: 'Light Dice Board',
    icon: '🎲',
    status: 'concept',
    type: 'physical',
    tagline: 'LED-powered dice board game.',
    description: `An idea for a custom board game that uses LED-lit dice and an interactive board. Tabletop game where the dice results trigger different light patterns on the board, creating a visual experience on top of the gameplay.

Still in the concept phase. Sketching out the electronics (LED strips, microcontroller), the game mechanics, and the physical design. The goal is to make something that feels premium and fun to play in person.

Probably going to be an Arduino or Raspberry Pi project with a custom PCB.`,
    stack: ['Arduino/RPi', 'LED Strips', 'Custom PCB', 'Game Design'],
    links: [],
  },
]

const STATUS_STYLES = {
  active: { color: '#4ADE80', label: 'ACTIVE', bg: '#1a3a1a' },
  planning: { color: '#FBBF24', label: 'PLANNING', bg: '#3a2a1a' },
  planned: { color: '#60A5FA', label: 'PLANNED', bg: '#1a1a3a' },
  concept: { color: '#A78BFA', label: 'CONCEPT', bg: '#2a1a3a' },
  'on-hold': { color: '#F97316', label: 'ON HOLD', bg: '#3a2418' },
  completed: { color: '#888', label: 'DONE', bg: '#2a2a2a' },
}

const TYPE_LABELS = { tech: '💻 Software', physical: '🔧 Physical', hybrid: '⚡ Software + Hardware' }

// ── Desktop View ──
function DesktopProjects() {
  const [selectedId, setSelectedId] = useState(null)
  const selected = PROJECTS.find(p => p.id === selectedId)

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0f0f14', fontFamily: 'monospace', color: '#F0EBE1' }}>
      <div className="px-3 py-2 shrink-0" style={{ background: '#1a1a24', borderBottom: '1px solid #2a2a3a' }}>
        <div className="font-bold text-sm">📁 Projects</div>
        <div className="text-xs" style={{ color: '#666' }}>{PROJECTS.length} projects · {PROJECTS.filter(p => p.status === 'active').length} active</div>
      </div>

      {!selected ? (
        <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
          {PROJECTS.map(p => {
            const st = STATUS_STYLES[p.status]
            return (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="flex items-start gap-3 px-3 py-2.5 cursor-pointer"
                style={{ borderBottom: '1px solid #1a1a1a' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1a1a2a'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span className="text-2xl shrink-0">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{p.name}</span>
                    <span className="text-xs px-1.5 py-0.5" style={{ background: st.bg, color: st.color, fontSize: 8 }}>{st.label}</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#888' }}>{p.tagline}</div>
                  <div className="text-xs mt-1" style={{ color: '#555' }}>{TYPE_LABELS[p.type]}</div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
          {/* Back button — sticky header */}
          <div className="px-3 py-2 shrink-0" style={{ borderBottom: '1px solid #1a1a1a', background: '#0f0f14' }}>
            <button onClick={() => setSelectedId(null)} className="text-xs border-none bg-transparent cursor-pointer" style={{ color: '#FF6B35', fontFamily: 'inherit' }}>← Back to Projects</button>
          </div>

          <div className="flex-1 overflow-auto p-4" style={{ maxWidth: 640 }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{selected.icon}</span>
              <div>
                <div className="font-bold text-lg">{selected.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5" style={{ background: STATUS_STYLES[selected.status].bg, color: STATUS_STYLES[selected.status].color }}>{STATUS_STYLES[selected.status].label}</span>
                  <span className="text-xs" style={{ color: '#555' }}>{TYPE_LABELS[selected.type]}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="text-sm leading-relaxed mb-4" style={{ color: '#bbb' }}>
              {selected.description.split('\n\n').map((para, i) => (
                <p key={i} style={{ margin: '0 0 10px' }}>{para}</p>
              ))}
            </div>

            {/* Inspiration / photos */}
            {selected.photos?.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: '#FF6B35' }}>INSPIRATION</div>
                <div className="grid grid-cols-2 gap-2">
                  {selected.photos.map((p, i) => (
                    <a key={i} href={p.src} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                      <img src={p.src} alt={p.caption || ''} style={{ width: '100%', height: 120, objectFit: 'cover', border: '1px solid #2a2a3a', display: 'block' }} loading="lazy" />
                      {p.caption && (
                        <div className="text-xs mt-1" style={{ color: '#777', lineHeight: 1.4 }}>{p.caption}</div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {selected.video && getYouTubeId(selected.video) && (
              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: '#FF6B35' }}>VIDEO</div>
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 3, border: '1px solid #333' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(selected.video)}`}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Project video"
                  />
                </div>
              </div>
            )}

            {/* Stack */}
            {selected.stack.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: '#FF6B35' }}>STACK</div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.stack.map(s => (
                    <span key={s} className="text-xs px-2 py-1" style={{ background: '#1a1a2a', color: '#999', borderRadius: 2 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Learnings */}
            {selected.learnings?.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: '#FF6B35' }}>WHAT I'VE LEARNED</div>
                {selected.learnings.map((l, i) => (
                  <div key={i} className="text-xs mb-2 pl-3" style={{ color: '#999', lineHeight: 1.5, borderLeft: '2px solid #2a2a3a' }}>{l}</div>
                ))}
              </div>
            )}

            {/* Notes */}
            {selected.notes && (
              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: '#FF6B35' }}>NOTES</div>
                <div className="text-xs" style={{ color: '#999', lineHeight: 1.5 }}>{selected.notes}</div>
              </div>
            )}

            {/* Roadmap */}
            {selected.roadmap?.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold mb-2" style={{ color: '#FF6B35' }}>ROADMAP ({selected.roadmap.filter(r => r.done).length}/{selected.roadmap.length})</div>
                {selected.roadmap.map((r, i) => (
                  <div key={i} className="text-xs mb-1.5 flex items-start gap-2" style={{ color: r.done ? '#4ADE80' : '#777' }}>
                    <span>{r.done ? '✓' : '○'}</span>
                    <span style={{ textDecoration: r.done ? 'line-through' : 'none', opacity: r.done ? 0.6 : 1 }}>{r.item}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Links */}
            {selected.links?.length > 0 && (
              <div className="mb-4">
                {selected.links.map((l, i) => (
                  l.url.startsWith('#') ? (
                    <button key={i} onClick={() => window.dispatchEvent(new CustomEvent('ericOS:openApp', { detail: l.url.slice(1) }))} className="text-xs block mb-1 border-none bg-transparent cursor-pointer p-0" style={{ color: '#4A90D9', fontFamily: 'inherit' }}>🔗 {l.label}</button>
                  ) : (
                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="text-xs block mb-1" style={{ color: '#4A90D9' }}>🔗 {l.label}</a>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Mobile View ──
function MobileProjects() {
  const [selectedId, setSelectedId] = useState(null)
  const selected = PROJECTS.find(p => p.id === selectedId)

  if (selected) {
    const st = STATUS_STYLES[selected.status]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
        <div className="flex items-center px-3 shrink-0" style={{ height: 44, borderBottom: '0.5px solid #e5e5ea' }}>
          <button onClick={() => setSelectedId(null)} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 15, fontFamily: 'inherit' }}>‹ Back</button>
        </div>
        <div className="flex-1 overflow-auto">
          <div style={{ textAlign: 'center', padding: '20px 16px 12px' }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>{selected.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{selected.name}</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: '#f2f2f7', color: st.color }}>{st.label}</span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: '#f2f2f7', color: '#666', marginLeft: 6 }}>{TYPE_LABELS[selected.type]}</span>
            </div>
          </div>
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ fontSize: 13, color: '#8e8e93', fontStyle: 'italic', marginBottom: 12 }}>{selected.tagline}</div>
            {selected.description.split('\n\n').map((para, i) => (
              <p key={i} style={{ fontSize: 15, lineHeight: 1.6, color: '#333', margin: '0 0 12px' }}>{para}</p>
            ))}
            {selected.photos?.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '0.5px solid #e5e5ea' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#8e8e93', marginBottom: 8, textTransform: 'uppercase' }}>Inspiration</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {selected.photos.map((p, i) => (
                    <a key={i} href={p.src} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                      <img src={p.src} alt={p.caption || ''} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, display: 'block' }} loading="lazy" />
                      {p.caption && (
                        <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 4, lineHeight: 1.4 }}>{p.caption}</div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {selected.stack.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '0.5px solid #e5e5ea' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#8e8e93', marginBottom: 6, textTransform: 'uppercase' }}>Tech Stack</div>
                <div className="flex flex-wrap gap-1">
                  {selected.stack.map(s => (
                    <span key={s} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: '#f2f2f7', color: '#333' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {selected.learnings?.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '0.5px solid #e5e5ea' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#8e8e93', marginBottom: 6, textTransform: 'uppercase' }}>What I've Learned</div>
                {selected.learnings.map((l, i) => (
                  <div key={i} style={{ fontSize: 14, color: '#555', lineHeight: 1.5, marginBottom: 8, paddingLeft: 10, borderLeft: '2px solid #e5e5ea' }}>{l}</div>
                ))}
              </div>
            )}

            {selected.notes && (
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '0.5px solid #e5e5ea' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#8e8e93', marginBottom: 6, textTransform: 'uppercase' }}>Notes</div>
                <div style={{ fontSize: 14, color: '#555', lineHeight: 1.5 }}>{selected.notes}</div>
              </div>
            )}

            {selected.roadmap?.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '0.5px solid #e5e5ea' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#8e8e93', marginBottom: 6, textTransform: 'uppercase' }}>
                  Roadmap ({selected.roadmap.filter(r => r.done).length}/{selected.roadmap.length})
                </div>
                {selected.roadmap.map((r, i) => (
                  <div key={i} style={{ fontSize: 14, marginBottom: 6, display: 'flex', gap: 8, color: r.done ? '#34C759' : '#333' }}>
                    <span>{r.done ? '✓' : '○'}</span>
                    <span style={{ textDecoration: r.done ? 'line-through' : 'none', opacity: r.done ? 0.6 : 1 }}>{r.item}</span>
                  </div>
                ))}
              </div>
            )}

            {selected.video && getYouTubeId(selected.video) && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#8e8e93', marginBottom: 6, textTransform: 'uppercase' }}>Video</div>
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 10 }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(selected.video)}`}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Project video"
                  />
                </div>
              </div>
            )}

            {selected.links?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {selected.links.map((l, i) => (
                  l.url.startsWith('#') ? (
                    <button key={i} onClick={() => window.dispatchEvent(new CustomEvent('ericOS:openApp', { detail: l.url.slice(1) }))} style={{ display: 'block', width: '100%', textAlign: 'center', padding: '12px', background: '#007AFF', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', marginBottom: 8, fontFamily: 'inherit' }}>
                      {l.label}
                    </button>
                  ) : (
                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#007AFF', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none', marginBottom: 8 }}>
                      {l.label}
                    </a>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f2f2f7', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      <div className="flex-1 overflow-auto">
        <div style={{ padding: '8px 16px 4px', fontSize: 11, color: '#8e8e93', fontWeight: 600, textTransform: 'uppercase' }}>
          {PROJECTS.length} Projects
        </div>
        {PROJECTS.map(p => {
          const st = STATUS_STYLES[p.status]
          return (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              style={{ padding: '14px 16px', background: '#fff', borderBottom: '0.5px solid #e5e5ea', display: 'flex', gap: 12, alignItems: 'center' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{p.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>{p.tagline}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 6, background: st.bg || '#f2f2f7', color: st.color }}>{st.label}</span>
                  <span style={{ fontSize: 10, color: '#aaa' }}>{TYPE_LABELS[p.type]}</span>
                </div>
              </div>
              <span style={{ color: '#c7c7cc', fontSize: 16 }}>›</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Projects() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  return isMobile ? <MobileProjects /> : <DesktopProjects />
}
