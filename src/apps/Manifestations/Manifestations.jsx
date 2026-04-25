import { useState } from 'react'

const MANIFESTATIONS = [
  {
    text: `There will always be someone better, more talented, more intelligent than you. But don't spend a second of your life worrying about that person. They will do their thing, you do your thing. There's no comparison. All you were put on this earth for was to give your best at every opportunity that comes your way. Forget about everything else. That's how you make the most of yourself and your life.`,
  },
  {
    text: `You have your way. I have my way. As for the right way, the correct way, and the only way, it does not exist.`,
    attribution: 'Friedrich Nietzsche',
  },
  { text: `Life hits different the moment you make peace with your vulnerability.` },
  { text: `The strength of your success is measured by the strength of your desire.` },
  { text: `At the end of the game, both the king and the pawn go into the same box.` },
  { text: `You're always being watched by your future self through their memories.` },
  { text: `Don't blame a clown for acting like a clown. Ask yourself why you keep going to the circus.` },
  { text: `Build a man a fire, and he'll be warm for a day. Set a man on fire, and he'll be warm for the rest of his life.` },
  { text: `The game is rigged, but you cannot lose if you don't play.` },
  { text: `To worry is to pay a debt of misery that may never come due.` },
  { text: `You don't drown because you fall into the water, but because you stay in it.` },
  { text: `Do not regret growing older. It is a privilege denied to many.` },
  { text: `Everything in moderation. Especially moderation.` },
  { text: `Comparison is the thief of joy.`, attribution: 'Theodore Roosevelt' },
  { text: `The cave you fear to enter holds the treasure you seek.`, attribution: 'Joseph Campbell' },
  { text: `Pain is inevitable. Suffering is optional.` },
  { text: `The obstacle is the way.`, attribution: 'Marcus Aurelius' },
  { text: `Action is the antidote to despair.`, attribution: 'Joan Baez' },
  { text: `If you're going through hell, keep going.`, attribution: 'Winston Churchill' },
  { text: `What you do every day matters more than what you do once in a while.` },
  { text: `Memento mori. Remember you will die.` },
]

export default function Manifestations() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * MANIFESTATIONS.length))
  const [pulseKey, setPulseKey] = useState(0)

  function draw() {
    let next = index
    if (MANIFESTATIONS.length > 1) {
      while (next === index) {
        next = Math.floor(Math.random() * MANIFESTATIONS.length)
      }
    }
    setIndex(next)
    setPulseKey(k => k + 1)
  }

  const m = MANIFESTATIONS[index]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background:
          'radial-gradient(ellipse at center, #f8f1e1 0%, #e8dcc4 100%)',
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      {/* Masthead */}
      <div
        style={{
          padding: '10px 16px 8px',
          textAlign: 'center',
          borderBottom: '1px dashed #b8a880',
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#3d2b1f',
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          Manifestations
        </div>
        <div
          style={{
            fontSize: 10,
            color: '#7a6a4a',
            marginTop: 2,
            fontFamily: 'monospace',
          }}
        >
          A small piece of paper, just for you.
        </div>
      </div>

      {/* Quote card */}
      <div
        className="flex-1 overflow-auto"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          key={pulseKey}
          style={{
            maxWidth: 460,
            textAlign: 'center',
            animation: 'manifestFade 400ms ease-out',
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: '#7a4a1a',
              lineHeight: 1,
              marginBottom: 8,
              fontFamily: 'Georgia, serif',
            }}
          >
            “
          </div>
          <div
            style={{
              fontSize: 17,
              fontStyle: 'italic',
              color: '#2a2218',
              lineHeight: 1.55,
              fontFamily: 'Georgia, serif',
            }}
          >
            {m.text}
          </div>
          {m.attribution && (
            <div
              style={{
                marginTop: 14,
                fontSize: 12,
                color: '#7a6a4a',
                fontFamily: 'Georgia, serif',
              }}
            >
              — {m.attribution}
            </div>
          )}
        </div>
      </div>

      {/* Footer / button */}
      <div
        style={{
          padding: '10px 16px 14px',
          textAlign: 'center',
          borderTop: '1px dashed #b8a880',
        }}
      >
        <button
          onClick={draw}
          style={{
            padding: '8px 18px',
            background: '#3d2b1f',
            color: '#f5f0e0',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'Georgia, serif',
            letterSpacing: 1,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#FF6B35')}
          onMouseLeave={e => (e.currentTarget.style.background = '#3d2b1f')}
        >
          🥠 Draw Another
        </button>
      </div>

      <style>{`
        @keyframes manifestFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
