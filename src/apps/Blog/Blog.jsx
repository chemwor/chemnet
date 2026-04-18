import { useState } from 'react'
import { iconUrl } from '../../shell/icons'

// ── Blog posts (filler content for testing) ──
const POSTS = [
  {
    id: 'why-i-build',
    filename: 'Why I Build Things.doc',
    date: '2026-03-15',
    size: '24 KB',
    title: 'Why I Build Things',
    content: `There's something about taking an idea from zero to something real that never gets old.

I've been building things since I was a kid — taking apart electronics, writing scripts that automate the boring stuff, putting together projects that nobody asked for but everyone ends up using.

The best projects come from scratching your own itch. DMHOA started because I was frustrated with how our homeowners association communicated. MGN came from seeing a gap in how local news reached people. Every project I've shipped started as "this should exist, and nobody's making it."

I don't build to impress. I build because the alternative — waiting for someone else to solve the problem — is worse. The code doesn't have to be perfect. It has to work, and it has to ship.

That's the philosophy. Ship it. Learn from it. Ship the next one.`,
  },
  {
    id: 'lessons-from-chess',
    filename: 'Lessons From Chess.doc',
    date: '2026-02-28',
    size: '18 KB',
    title: 'Lessons From Chess That Apply to Business',
    content: `I've been playing chess since I was young. The game teaches you things that no business book can.

Control the center. In chess, the player who controls the center controls the game. In business, it's the same — find the core problem, own it, and everything else radiates outward.

Think three moves ahead. Every decision you make has second and third-order effects. Hiring someone isn't just about filling a seat — it changes team dynamics, culture, and velocity.

Sacrifice pieces strategically. Sometimes you have to let go of a good thing to gain something better. Kill features, sunset products, say no to clients. Not every piece on the board needs to survive.

The endgame matters most. Most people focus on openings. But games are won and lost in the endgame — execution, follow-through, and closing. Start strong, but finish stronger.

Tempo is everything. A move that gains you tempo — that forces your opponent to react — is worth more than a move that simply improves your position. In business, speed of iteration is your tempo.`,
  },
  {
    id: 'on-being-kenyan',
    filename: 'On Being Kenyan in Tech.doc',
    date: '2026-02-10',
    size: '21 KB',
    title: 'On Being Kenyan in Tech',
    content: `Growing up in Kenya gives you a different relationship with technology.

You learn to build with constraints. Internet is unreliable. Power goes out. Hardware is expensive. You learn to make things work with what you have, and that resourcefulness becomes your superpower.

Kenyans built M-Pesa before the rest of the world understood mobile payments. We leapfrogged entire generations of financial infrastructure. That wasn't luck — that was necessity mothering invention.

When I moved into tech professionally, I brought that mentality with me. Don't wait for perfect conditions. Don't wait for the right tools. Build with what's in front of you and iterate.

The Kenyan tech ecosystem is growing fast. Nairobi is a hub. But the real story isn't the startups getting funded — it's the thousands of developers building solutions for problems that Silicon Valley doesn't even know exist.

I carry that with me. Build for the people in front of you, not the people on TechCrunch.`,
  },
  {
    id: 'bjj-and-code',
    filename: 'What BJJ Taught Me About Code.doc',
    date: '2026-01-20',
    size: '16 KB',
    title: 'What BJJ Taught Me About Writing Code',
    content: `I started Brazilian Jiu-Jitsu a few years ago. The parallels to software engineering are everywhere.

Fundamentals beat tricks. A solid guard pass will beat a flashy submission attempt every time. In code, clean architecture and good data modeling will outlast any clever hack.

Drilling matters more than sparring. You get better by repeating the basics until they're automatic, not by constantly testing yourself in live situations. Write the same patterns over and over. Build CRUD apps until it's muscle memory.

Tap early, tap often. In BJJ, ego gets you injured. In code, ego gets you stuck. Admit when your approach isn't working. Throw it away and start fresh. The cost of tapping is nothing compared to the cost of a torn ligament — or a spaghetti codebase.

Position before submission. Get to a dominant position before you attack. In code, set up your architecture, your tooling, your CI pipeline before you start building features. The setup is the work.

Everyone gets submitted. The best grapplers in the world get tapped. The best engineers ship bugs. It's not about being perfect — it's about recovering fast and learning from it.`,
  },
  {
    id: 'remote-work',
    filename: 'My Remote Work Setup.doc',
    date: '2026-01-05',
    size: '14 KB',
    title: 'My Remote Work Setup in 2026',
    content: `People ask about my setup a lot, so here it is.

Hardware: M3 MacBook Pro 16", two Dell 27" 4K monitors stacked vertically, Keychron Q1 mechanical keyboard (Gateron Brown switches), Logitech MX Master 3S. Standing desk from FlexiSpot. Herman Miller Aeron chair for when I sit.

Software: VS Code with Vim keybindings. iTerm2 with tmux. Arc browser. Linear for project management. Figma for design. Notion for docs. Slack, reluctantly.

Audio: AirPods Pro for calls. Sony WH-1000XM5 for deep work. A pair of Yamaha HS5 monitors for music.

The real productivity hack isn't the gear though. It's time blocking. I do deep work from 6am to 11am. Meetings from 11am to 1pm. Afternoon is for code review, planning, and admin. After 5pm, I'm done.

No notifications on my phone except calls. Slack notifications off except DMs. Email checked twice a day. The world can wait.`,
  },
  {
    id: 'climbing-kili',
    filename: 'Climbing Kilimanjaro.doc',
    date: '2025-12-18',
    size: '28 KB',
    title: 'Climbing Kilimanjaro: What Nobody Tells You',
    content: `I summited Kilimanjaro last year. Here's what the travel blogs leave out.

The altitude hits different than you expect. It's not dramatic. It's subtle. You feel fine at 3,000 meters. At 4,000, you notice you're breathing harder. At 5,000, every step takes three breaths. At Uhuru Peak (5,895m), your brain is running on fumes.

The key is pole pole — slowly, slowly. The guides say it constantly. You'll feel like you can go faster. Don't. The mountain doesn't care about your pace. It cares about whether you acclimatize.

Night summit is brutal and beautiful. You start at midnight, headlamp on, freezing cold, walking in a line of lights up the mountain. You can see the lights of climbers above you snaking up the switchbacks. It looks impossible. Then you look back and realize how far you've come.

The sunrise from the summit is the most beautiful thing I've ever seen. The clouds below you. The glaciers glowing orange. Africa stretching to the horizon in every direction. Worth every step.

Would I do it again? Absolutely. But I'd train my legs more.`,
  },
]

// ── Document icon SVG ──
const DOC_ICON = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="4" y="2" width="20" height="28" fill="#fff" stroke="#000" stroke-width=".8"/><rect x="4" y="2" width="6" height="6" fill="#00a"/><path d="M4 2h6v6H4z" fill="#00a"/><text x="7" y="7" fill="#fff" font-size="5" font-family="serif" font-weight="bold">W</text><line x1="8" y1="12" x2="20" y2="12" stroke="#000" stroke-width=".4"/><line x1="8" y1="15" x2="20" y2="15" stroke="#000" stroke-width=".4"/><line x1="8" y1="18" x2="20" y2="18" stroke="#000" stroke-width=".4"/><line x1="8" y1="21" x2="16" y2="21" stroke="#000" stroke-width=".4"/></svg>`)}`

// ── File directory view ──
function FileDirectory({ posts, onOpen }) {
  const [selectedId, setSelectedId] = useState(null)

  return (
    <div className="flex flex-col h-full" style={{ background: '#fff' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 shrink-0" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-bevel-dark)' }}>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          📂 C:\Documents\Blog
        </span>
        <span className="ml-auto text-xs" style={{ color: 'var(--color-text-disabled)' }}>
          {posts.length} item(s)
        </span>
      </div>

      {/* Column headers */}
      <div
        className="flex items-center px-2 py-0.5 text-xs shrink-0"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-bevel-dark)',
          color: 'var(--color-text-primary)',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ width: 28 }} />
        <div className="flex-1 font-bold">Name</div>
        <div className="font-bold" style={{ width: 70, textAlign: 'right' }}>Size</div>
        <div className="font-bold" style={{ width: 90, textAlign: 'right' }}>Modified</div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-auto" style={{ background: '#fff' }}>
        {posts.map(post => {
          const isSelected = selectedId === post.id
          return (
            <div
              key={post.id}
              className="flex items-center px-2 py-1 cursor-pointer"
              style={{
                background: isSelected ? '#000080' : 'transparent',
                color: isSelected ? '#fff' : '#000',
                fontFamily: 'monospace',
                fontSize: 12,
              }}
              onClick={() => setSelectedId(post.id)}
              onDoubleClick={() => onOpen(post.id)}
            >
              <img
                src={DOC_ICON}
                alt=""
                width={20}
                height={20}
                style={{ imageRendering: 'pixelated', marginRight: 8 }}
                draggable={false}
              />
              <div className="flex-1 truncate">{post.filename}</div>
              <div style={{ width: 70, textAlign: 'right', color: isSelected ? '#ccc' : '#666' }}>{post.size}</div>
              <div style={{ width: 90, textAlign: 'right', color: isSelected ? '#ccc' : '#666' }}>{post.date}</div>
            </div>
          )
        })}
      </div>

      {/* Status bar */}
      <div
        className="flex items-center px-2 py-0.5 text-xs shrink-0"
        style={{
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-bevel-dark)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {selectedId
          ? `${posts.find(p => p.id === selectedId)?.filename} — Double-click to open`
          : 'Select a document to read'}
      </div>
    </div>
  )
}

// ── Word-style document viewer ──
function DocumentViewer({ post, onBack }) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#fff' }}>
      {/* Menu bar */}
      <div
        className="flex items-center gap-3 px-2 py-1 text-xs shrink-0"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-bevel-dark)',
          fontFamily: 'monospace',
          color: 'var(--color-text-primary)',
        }}
      >
        <button
          onClick={onBack}
          className="border-none bg-transparent cursor-pointer text-xs underline"
          style={{ color: 'var(--color-accent)' }}
        >
          ← Back to Blog
        </button>
        <span style={{ color: 'var(--color-text-disabled)' }}>|</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>File</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>Edit</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>View</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>Format</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>Help</span>
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-2 py-1 shrink-0"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-bevel-dark)',
        }}
      >
        <select
          className="text-xs px-1 py-0.5"
          style={{
            background: '#fff',
            border: '1px solid #999',
            fontFamily: 'monospace',
            color: '#000',
          }}
          defaultValue="times"
          disabled
        >
          <option value="times">Times New Roman</option>
        </select>
        <select
          className="text-xs px-1 py-0.5"
          style={{
            background: '#fff',
            border: '1px solid #999',
            fontFamily: 'monospace',
            color: '#000',
            width: 40,
          }}
          defaultValue="12"
          disabled
        >
          <option value="12">12</option>
        </select>
        <div style={{ width: 1, height: 16, background: '#ccc', margin: '0 4px' }} />
        <span className="text-xs font-bold" style={{ color: '#666' }}>B</span>
        <span className="text-xs italic" style={{ color: '#666' }}>I</span>
        <span className="text-xs underline" style={{ color: '#666' }}>U</span>
      </div>

      {/* Ruler */}
      <div
        className="px-2 shrink-0"
        style={{
          background: '#f0f0f0',
          borderBottom: '1px solid #ccc',
          height: 14,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i} className="text-[7px]" style={{ color: '#999', width: '5%', textAlign: 'center' }}>
            {i % 2 === 0 ? i / 2 : '·'}
          </span>
        ))}
      </div>

      {/* Document area */}
      <div className="flex-1 overflow-auto" style={{ background: '#e8e8e8' }}>
        <div
          className="mx-auto my-4"
          style={{
            background: '#fff',
            maxWidth: 540,
            minHeight: 600,
            padding: '48px 56px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontSize: 14,
            lineHeight: 1.7,
            color: '#1a1a1a',
          }}
        >
          {/* Title */}
          <h1 style={{
            fontSize: 22,
            fontWeight: 'bold',
            margin: '0 0 8px',
            color: '#000',
            fontFamily: '"Georgia", serif',
          }}>
            {post.title}
          </h1>

          <div style={{
            fontSize: 11,
            color: '#888',
            marginBottom: 24,
            paddingBottom: 12,
            borderBottom: '1px solid #ddd',
            fontFamily: 'monospace',
          }}>
            {post.date} &middot; {post.size}
          </div>

          {/* Body */}
          {post.content.split('\n\n').map((para, i) => (
            <p key={i} style={{ margin: '0 0 16px', textAlign: 'justify' }}>
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-2 py-0.5 text-xs shrink-0"
        style={{
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-bevel-dark)',
          color: 'var(--color-text-secondary)',
          fontFamily: 'monospace',
        }}
      >
        <span>{post.filename}</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  )
}

// ── Main Blog component ──
export default function Blog() {
  const [openPostId, setOpenPostId] = useState(null)

  const openPost = POSTS.find(p => p.id === openPostId)

  if (openPost) {
    return <DocumentViewer post={openPost} onBack={() => setOpenPostId(null)} />
  }

  return <FileDirectory posts={POSTS} onOpen={setOpenPostId} />
}
