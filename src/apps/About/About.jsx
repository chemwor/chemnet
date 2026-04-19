import { useState, useEffect, useRef } from 'react'

const LINES = [
  { text: '> ./README.sh', delay: 0, style: 'command' },
  { text: '', delay: 600 },
  { text: '╔══════════════════════════════════════════╗', delay: 900, style: 'border' },
  { text: '║         Welcome to ChemNet v1.0          ║', delay: 1100, style: 'border' },
  { text: '╚══════════════════════════════════════════╝', delay: 1300, style: 'border' },
  { text: '', delay: 1800 },
  { text: 'Hey. Karibu (welcome in Swahili). I\'m Eric. Come in.', delay: 2200 },
  { text: '', delay: 2800 },
  { text: 'This is my place on the internet. I built it,', delay: 3300 },
  { text: 'I tend it, I decide what grows here. Think of', delay: 3900 },
  { text: 'it less like a website and more like a garden', delay: 4500 },
  { text: 'with a house in the middle of it. You\'re', delay: 5100 },
  { text: 'welcome to wander.', delay: 5700 },
  { text: '', delay: 6300 },
  { text: 'The internet used to have weird corners. Then', delay: 6900 },
  { text: 'social media ate them. This is me building one', delay: 7500 },
  { text: 'back.', delay: 8100 },
  { text: '', delay: 8700 },
  { text: 'Stuff to do while you\'re here:', delay: 9300 },
  { text: '', delay: 9800 },
  { text: '  → Blogs      things I\'m thinking about', delay: 10300, style: 'item' },
  { text: '  → Videos     my videos + stuff I\'m watching', delay: 10800, style: 'item' },
  { text: '  → Projects   what I\'m building', delay: 11300, style: 'item' },
  { text: '  → Games      solitaire, chess, asteroids, etc.', delay: 11800, style: 'item' },
  { text: '  → Music      my productions + current rotation', delay: 12300, style: 'item' },
  { text: '  → Terminal   if you know, you know', delay: 12800, style: 'item' },
  { text: '', delay: 13500 },
  { text: 'There are easter eggs tucked around. I won\'t', delay: 14100 },
  { text: 'tell you how many.', delay: 14700, style: 'accent' },
  { text: '', delay: 15300 },
  { text: 'Stay as long as you want. If something catches', delay: 15900 },
  { text: 'your eye, or you just want to say what\'s up,', delay: 16500 },
  { text: 'the door\'s open. I actually read everything.', delay: 17100 },
  { text: '', delay: 17700 },
  { text: 'Asante (thank you in Swahili).', delay: 18300, style: 'accent' },
  { text: '', delay: 18900 },
  { text: '— Eric', delay: 19500, style: 'accent' },
  { text: '', delay: 20100 },
  { text: '> _', delay: 20800, style: 'cursor' },
]

// Module-level flag — survives remounts but resets on page reload
let hasCompleted = false

export default function About() {
  const [visibleCount, setVisibleCount] = useState(hasCompleted ? LINES.length : 0)
  const containerRef = useRef(null)

  useEffect(() => {
    if (hasCompleted) return

    setVisibleCount(0)
    const timers = LINES.map((line, i) =>
      setTimeout(() => {
        setVisibleCount(i + 1)
        if (i === LINES.length - 1) hasCompleted = true
      }, line.delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [visibleCount])

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto p-4"
      style={{
        background: '#0a0a0a',
        fontFamily: '"Courier New", "Courier", monospace',
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      {LINES.slice(0, visibleCount).map((line, i) => {
        let color = '#33FF33'
        if (line.style === 'command') color = '#AAFFAA'
        else if (line.style === 'border') color = '#227722'
        else if (line.style === 'accent') color = '#66FF66'
        else if (line.style === 'item') color = '#44DD44'
        else if (line.style === 'cursor') color = '#33FF33'

        return (
          <div
            key={i}
            style={{
              color,
              minHeight: line.text === '' ? 8 : undefined,
              whiteSpace: 'pre',
            }}
          >
            {line.text}
            {line.style === 'cursor' && (
              <span style={{ animation: 'blink 0.8s step-end infinite' }}>█</span>
            )}
          </div>
        )
      })}

      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
