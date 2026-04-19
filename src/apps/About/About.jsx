import { useState, useEffect, useRef } from 'react'

const LINES = [
  { text: '> ./README.sh', delay: 0, style: 'command' },
  { text: '', delay: 600 },
  { text: '╔══════════════════════════════════════════╗', delay: 900, style: 'border' },
  { text: '║         Welcome to ChemNet v1.0          ║', delay: 1100, style: 'border' },
  { text: '╚══════════════════════════════════════════╝', delay: 1300, style: 'border' },
  { text: '', delay: 1800 },
  { text: "Hey — welcome to my site.", delay: 2200 },
  { text: '', delay: 2800 },
  { text: "I'm Eric Chemwor.", delay: 3300 },
  { text: '', delay: 3900 },
  { text: 'When building this site, I wanted to chase the', delay: 4400 },
  { text: 'feeling of the old internet — back when the web', delay: 5000 },
  { text: 'was weird, personal, and actually fun to explore.', delay: 5600 },
  { text: '', delay: 6200 },
  { text: 'I wanted to build myself a tech garden that\'s', delay: 6800 },
  { text: 'free from the homogeny of social media. A space', delay: 7400 },
  { text: 'that has some personality. Something that feels', delay: 8000 },
  { text: 'like mine.', delay: 8600 },
  { text: '', delay: 9200 },
  { text: 'So here it is.', delay: 9800, style: 'accent' },
  { text: '', delay: 10400 },
  { text: 'Explore — there\'s a lot to do here:', delay: 11000 },
  { text: '', delay: 11500 },
  { text: '  → Blogs      writings on building, life, and code', delay: 12000, style: 'item' },
  { text: '  → Videos     stuff I\'m making and sharing', delay: 12500, style: 'item' },
  { text: '  → Projects   things I\'ve built', delay: 13000, style: 'item' },
  { text: '  → Games      solitaire, chess, asteroids, and more', delay: 13500, style: 'item' },
  { text: '  → Music      current rotation + my own productions', delay: 14000, style: 'item' },
  { text: '  → Terminal   if you know, you know', delay: 14500, style: 'item' },
  { text: '', delay: 15200 },
  { text: 'There are also some easter eggs hidden around.', delay: 15800 },
  { text: 'Good luck finding them.', delay: 16500, style: 'accent' },
  { text: '', delay: 17200 },
  { text: 'If you\'re interested in anything, have questions,', delay: 17800 },
  { text: 'or just want to say what\'s up — feel free to', delay: 18500 },
  { text: 'reach out. I\'d love to hear from you.', delay: 19200 },
  { text: '', delay: 19900 },
  { text: '— Eric', delay: 20500, style: 'accent' },
  { text: '', delay: 21200 },
  { text: '> _', delay: 22000, style: 'cursor' },
]

export default function About() {
  const [visibleCount, setVisibleCount] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => {
    setVisibleCount(0)
    const timers = LINES.map((line, i) =>
      setTimeout(() => setVisibleCount(i + 1), line.delay)
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
