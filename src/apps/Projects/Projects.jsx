import { useState } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'

const PROJECTS = [
  {
    id: 'dmhoa',
    name: 'Dispute My HOA',
    icon: '🏠',
    status: 'active',
    type: 'tech',
    tagline: 'Fighting HOA overreach with tech.',
    description: `Dispute My HOA is a platform that helps homeowners navigate and challenge unfair HOA practices. It streamlines the dispute process by guiding users through their rights, generating formal response letters, and tracking case progress.

The idea came from personal frustration — dealing with an HOA that operated without transparency or accountability. The tools that exist for homeowners are scattered and confusing. DMHOA puts everything in one place.`,
    stack: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
    links: [],
  },
  {
    id: 'mgn',
    name: 'My Guardian Neighbor',
    icon: '🛡️',
    status: 'active',
    type: 'tech',
    tagline: 'Community safety, neighbor to neighbor.',
    description: `My Guardian Neighbor connects communities through a hyperlocal safety and communication network. Think of it as a neighborhood watch powered by modern tech — real-time alerts, incident tracking, and direct communication between neighbors.

The gap it fills is that existing neighborhood platforms are either too broad (Nextdoor) or too limited (group chats). MGN focuses specifically on safety and mutual aid at the block level.`,
    stack: ['Next.js', 'Supabase', 'Mapbox'],
    links: [],
  },
  {
    id: 'chemnet',
    name: 'ChemNet',
    icon: '💻',
    status: 'active',
    type: 'tech',
    tagline: "You're looking at it.",
    description: `This site. A personal space styled as a Win95 desktop OS — because the internet should be fun again.

Built to chase the feeling of the old internet. A tech garden free from the homogeny of social media. Games, blogs, a terminal with secrets, hidden layers, and easter eggs tucked everywhere.

The site itself is the project. It will always be a work in progress.`,
    stack: ['React', 'Vite', 'react95', 'Tailwind', 'Framer Motion', 'Supabase'],
    links: [{ label: 'GitHub', url: 'https://github.com/chemwor/chemnet' }],
  },
  {
    id: 'bmo',
    name: 'BMO',
    icon: '🤖',
    status: 'planning',
    type: 'tech',
    tagline: 'Personal AI assistant. Named after the best Adventure Time character.',
    description: `BMO is a personal AI assistant project — the idea is to build something that actually knows me. Not a generic chatbot, but an assistant trained on my preferences, schedule, habits, and goals.

Think of it as a digital companion that can help with task management, research, and decision-making in a way that's personalized to how I think and work. Named after BMO from Adventure Time because that's the energy.

Still in the planning phase. Exploring what the right architecture looks like — whether it's a fine-tuned model, a RAG system, or something else entirely.`,
    stack: ['Python', 'LangChain', 'OpenAI', 'TBD'],
    links: [],
  },
  {
    id: 'bathroom',
    name: 'Bathroom Renovation',
    icon: '🚿',
    status: 'planned',
    type: 'physical',
    tagline: 'First real home renovation project.',
    description: `Planning a full bathroom renovation. Gut and redo — new tile, vanity, fixtures, lighting. The current setup is dated and the layout could be better.

This is the first big hands-on project. Learning as I go — watching way too many YouTube videos on waterproofing and tile work. The goal is to do as much of it myself as possible and document the process.

Budget and timeline TBD. Waiting on quotes and finalizing the design.`,
    stack: [],
    links: [],
  },
  {
    id: 'carmods',
    name: '2016 Camaro LT Build',
    icon: '🏎️',
    status: 'active',
    type: 'physical',
    tagline: 'Turning the V6 into something special.',
    description: `The Camaro project — a 2016 LT V6 (3.6L LGX) that I'm building into an SS-level daily over time. Phase by phase, mod by mod.

Current focus: catch-up maintenance (spark plugs, alignment), then Phase 1 (exhaust, brakes, tint, badge delete). Full interior carbon fiber treatment and exterior ZL1 conversion planned.

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
    description: `An idea for a custom board game that uses LED-lit dice and an interactive board. Think of a tabletop game where the dice results trigger different light patterns on the board, creating a visual experience on top of the gameplay.

Still in the concept phase — sketching out the electronics (LED strips, microcontroller), the game mechanics, and the physical design. The goal is to make something that feels premium and fun to play in person.

This might end up being an Arduino or Raspberry Pi project with a custom PCB.`,
    stack: ['Arduino/RPi', 'LED Strips', 'Custom PCB', 'Game Design'],
    links: [],
  },
]

const STATUS_STYLES = {
  active: { color: '#4ADE80', label: 'ACTIVE', bg: '#1a3a1a' },
  planning: { color: '#FBBF24', label: 'PLANNING', bg: '#3a2a1a' },
  planned: { color: '#60A5FA', label: 'PLANNED', bg: '#1a1a3a' },
  concept: { color: '#A78BFA', label: 'CONCEPT', bg: '#2a1a3a' },
  completed: { color: '#888', label: 'DONE', bg: '#2a2a2a' },
}

const TYPE_LABELS = { tech: '💻 Software', physical: '🔧 Physical' }

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

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Project list */}
        <div className="flex-1 overflow-auto">
          {PROJECTS.map(p => {
            const st = STATUS_STYLES[p.status]
            return (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="flex items-start gap-3 px-3 py-2.5 cursor-pointer"
                style={{ background: selectedId === p.id ? '#1a1a2a' : 'transparent', borderBottom: '1px solid #1a1a1a' }}
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

        {/* Detail panel */}
        {selected && (
          <div className="shrink-0 overflow-auto p-3" style={{ width: 280, background: '#12121a', borderLeft: '1px solid #2a2a3a' }}>
            <div className="text-center text-3xl mb-2">{selected.icon}</div>
            <div className="font-bold text-sm text-center mb-1">{selected.name}</div>
            <div className="text-center mb-3">
              <span className="text-xs px-2 py-0.5" style={{ background: STATUS_STYLES[selected.status].bg, color: STATUS_STYLES[selected.status].color }}>{STATUS_STYLES[selected.status].label}</span>
            </div>

            <div className="text-xs leading-relaxed mb-3" style={{ color: '#aaa' }}>
              {selected.description.split('\n\n').map((para, i) => (
                <p key={i} style={{ margin: '0 0 8px' }}>{para}</p>
              ))}
            </div>

            {selected.stack.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-bold mb-1" style={{ color: '#FF6B35' }}>Stack</div>
                <div className="flex flex-wrap gap-1">
                  {selected.stack.map(s => (
                    <span key={s} className="text-xs px-1.5 py-0.5" style={{ background: '#1a1a2a', color: '#888' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {selected.links.length > 0 && (
              <div>
                {selected.links.map((l, i) => (
                  <a key={i} href={l.url} target={l.url.startsWith('#') ? undefined : '_blank'} rel="noopener noreferrer" className="text-xs block mb-1" style={{ color: '#4A90D9' }}>🔗 {l.label}</a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
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
            {selected.links.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {selected.links.map((l, i) => (
                  <a key={i} href={l.url} target={l.url.startsWith('#') ? undefined : '_blank'} rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#007AFF', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none', marginBottom: 8 }}>
                    {l.label}
                  </a>
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
