import { useState, useRef, useEffect } from 'react'

const HELP_TEXT = `Available commands:
  help           list all commands
  whois eric     short bio
  ls             list all apps
  clear          clear terminal
  sudo rm -rf /  don't do it
  exit           close terminal`

const STUB_RESPONSE = {
  'help': HELP_TEXT,
  'whois eric': 'Eric — builder, guitarist, BJJ blue belt.\nShipping code and choking people (consensually).',
  'ls': 'about.txt  projects/  terminal  now  writing  music  bjj  kili  contact  guestbook  minesweeper  solitaire  trash  settings',
  'sudo': 'Nice try.',
  'exit': null,
  'clear': null,
}

export default function Terminal() {
  const [lines, setLines] = useState([
    { type: 'output', text: 'EricOS Terminal v1.0' },
    { type: 'output', text: 'Type "help" for available commands.\n' },
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const cmd = input.trim()
    if (!cmd) return

    const newLines = [...lines, { type: 'input', text: `$ ${cmd}` }]

    if (cmd === 'clear') {
      setLines([])
      setInput('')
      return
    }

    if (cmd === 'sudo rm -rf /' || cmd === 'sudo rm -rf /*') {
      setLines([...newLines, { type: 'output', text: 'Initiating system destruction...' }])
      setInput('')
      // Dispatch event for DesktopShell to catch
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ericOS:meltdown'))
      }, 500)
      return
    }

    const response = STUB_RESPONSE[cmd] ?? STUB_RESPONSE[cmd.split(' ')[0]] ?? `command not found: ${cmd}`
    setLines([...newLines, { type: 'output', text: response }])
    setInput('')
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: '#0a0a0a',
        color: '#C0392B',
        fontFamily: '"Courier New", monospace',
        fontSize: 13,
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 overflow-auto p-3">
        {lines.map((line, i) => (
          <div
            key={i}
            className="whitespace-pre-wrap"
            style={{ color: line.type === 'input' ? '#F0EBE1' : '#C0392B' }}
          >
            {line.text}
          </div>
        ))}
        <form onSubmit={handleSubmit} className="flex items-center mt-1">
          <span style={{ color: '#F0EBE1' }}>$&nbsp;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none"
            style={{
              color: '#F0EBE1',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              caretColor: '#C0392B',
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </form>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
