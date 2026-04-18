import { useState, useEffect, useRef } from 'react'

const LINES = [
  { text: '> cat README.txt', delay: 0, style: 'command' },
  { text: '', delay: 300 },
  { text: '╔══════════════════════════════════════════╗', delay: 400, style: 'border' },
  { text: '║         Welcome to ChemNet v1.0          ║', delay: 500, style: 'border' },
  { text: '╚══════════════════════════════════════════╝', delay: 600, style: 'border' },
  { text: '', delay: 700 },
  { text: "Hey — welcome to my site.", delay: 800 },
  { text: '', delay: 900 },
  { text: "I'm Eric Chemwor.", delay: 1000 },
  { text: '', delay: 1100 },
  { text: 'When building this site, I wanted to chase the', delay: 1200 },
  { text: 'feeling of the old internet — back when the web', delay: 1300 },
  { text: 'was weird, personal, and actually fun to explore.', delay: 1400 },
  { text: '', delay: 1500 },
  { text: 'I wanted to build myself a tech garden that\'s', delay: 1600 },
  { text: 'free from the homogeny of social media. A space', delay: 1700 },
  { text: 'that has some personality. Something that feels', delay: 1800 },
  { text: 'like mine.', delay: 1900 },
  { text: '', delay: 2000 },
  { text: 'So here it is.', delay: 2100, style: 'accent' },
  { text: '', delay: 2200 },
  { text: 'Explore — there\'s a lot to do here:', delay: 2300 },
  { text: '', delay: 2400 },
  { text: '  → Blogs      writings on building, life, and code', delay: 2500, style: 'item' },
  { text: '  → Videos     things I\'ve been watching and making', delay: 2600, style: 'item' },
  { text: '  → Projects   companies and products I\'ve built', delay: 2700, style: 'item' },
  { text: '  → Games      solitaire, chess, asteroids, and more', delay: 2800, style: 'item' },
  { text: '  → Music      what I\'ve been listening to', delay: 2900, style: 'item' },
  { text: '  → Terminal   if you know, you know', delay: 3000, style: 'item' },
  { text: '', delay: 3100 },
  { text: 'There are also some easter eggs hidden around.', delay: 3200 },
  { text: 'Good luck finding them.', delay: 3300, style: 'accent' },
  { text: '', delay: 3400 },
  { text: 'If you\'re interested in anything, have questions,', delay: 3500 },
  { text: 'or just want to say what\'s up — feel free to', delay: 3600 },
  { text: 'reach out. I\'d love to hear from you.', delay: 3700 },
  { text: '', delay: 3800 },
  { text: '— Eric', delay: 3900, style: 'accent' },
  { text: '', delay: 4000 },
  { text: '> _', delay: 4200, style: 'cursor' },
]

export default function About() {
  const [visibleCount, setVisibleCount] = useState(0)
  const containerRef = useRef(null)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    LINES.forEach((line, i) => {
      setTimeout(() => {
        setVisibleCount(i + 1)
      }, line.delay)
    })
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
