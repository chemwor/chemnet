import { useState, useRef, useEffect, useCallback } from 'react'

// ── Fake filesystem ──
const FS = {
  '/': {
    type: 'dir',
    children: ['home', 'usr', 'etc', 'var', 'tmp', '.secret'],
  },
  '/home': {
    type: 'dir',
    children: ['eric'],
  },
  '/home/eric': {
    type: 'dir',
    children: ['about.txt', 'projects', 'blog', 'music', 'pictures', 'videos', '.hidden', '.ssh'],
  },
  '/home/eric/about.txt': {
    type: 'file',
    content: `Eric Chemwor
─────────────
Builder. Engineer. Guitarist. BJJ practitioner.

Based out of Nairobi → the world.
Building things that matter, one commit at a time.

Currently working on: ChemNet, DMHOA, MGN
Currently reading: Meditations by Marcus Aurelius
Currently listening to: Kendrick, J. Cole, Afrobeats

"Ship it. Learn from it. Ship the next one."`,
  },
  '/home/eric/projects': {
    type: 'dir',
    children: ['dmhoa.txt', 'mgn.txt', 'chemnet.txt', 'blitzsquares.txt'],
  },
  '/home/eric/projects/dmhoa.txt': {
    type: 'file',
    content: `DMHOA — Homeowners Association Platform
────────────────────────────────────────
A platform to help HOAs communicate, manage dues,
and coordinate community events. Built because our
HOA was stuck in the dark ages of paper notices.

Stack: React, Node.js, PostgreSQL, Stripe
Status: Live and growing`,
  },
  '/home/eric/projects/mgn.txt': {
    type: 'file',
    content: `MGN — Local News Network
────────────────────────
Hyperlocal news platform connecting communities
with the stories that matter to them. Filling the
gap left by dying local newspapers.

Stack: Next.js, Supabase, Mapbox
Status: In development`,
  },
  '/home/eric/projects/chemnet.txt': {
    type: 'file',
    content: `ChemNet — This Site
────────────────────
A personal site styled as a Win95 desktop OS.
Built to chase the feeling of the old internet.

Stack: React, Vite, react95, Tailwind, Framer Motion
Status: You're looking at it`,
  },
  '/home/eric/projects/blitzsquares.txt': {
    type: 'file',
    content: `BlitzSquares — Football Squares Game
─────────────────────────────────────
Real-time football squares game for Super Bowl
parties and watch groups. Automated scoring,
live updates, cash out.

Stack: React Native, Firebase
Status: Seasonal`,
  },
  '/home/eric/blog': {
    type: 'dir',
    children: ['why-i-build.txt', 'chess-and-business.txt', 'kenyan-in-tech.txt'],
  },
  '/home/eric/blog/why-i-build.txt': {
    type: 'file',
    content: `The best projects come from scratching your own itch.
Ship it. Learn from it. Ship the next one.

(Open the Blog app for the full post)`,
  },
  '/home/eric/blog/chess-and-business.txt': {
    type: 'file',
    content: `Control the center. Think three moves ahead.
Sacrifice pieces strategically. Tempo is everything.

(Open the Blog app for the full post)`,
  },
  '/home/eric/blog/kenyan-in-tech.txt': {
    type: 'file',
    content: `Kenyans built M-Pesa before the rest of the world
understood mobile payments. Build for the people in
front of you, not the people on TechCrunch.

(Open the Blog app for the full post)`,
  },
  '/home/eric/music': {
    type: 'dir',
    children: ['now-playing.txt', 'gear.txt'],
  },
  '/home/eric/music/now-playing.txt': {
    type: 'file',
    content: `Now Playing:
  Kendrick Lamar — GNX
  J. Cole — The Fall Off
  Burna Boy — I Told Them
  Tyler, the Creator — CHROMAKOPIA`,
  },
  '/home/eric/music/gear.txt': {
    type: 'file',
    content: `Guitar Gear:
  Fender Stratocaster (MIM, sunburst)
  Orange Crush 20RT
  Boss DS-1 Distortion
  TC Electronic Hall of Fame Reverb
  Snark clip-on tuner (the essentials)`,
  },
  '/home/eric/pictures': {
    type: 'dir',
    children: ['nairobi.jpg', 'kilimanjaro.jpg', 'setup.jpg'],
  },
  '/home/eric/pictures/nairobi.jpg': {
    type: 'file',
    content: `[IMAGE: Nairobi skyline at sunset, 2024]
(Open the Pictures app to view)`,
  },
  '/home/eric/pictures/kilimanjaro.jpg': {
    type: 'file',
    content: `[IMAGE: Summit of Kilimanjaro, Uhuru Peak, 5895m]
(Open the Pictures app to view)`,
  },
  '/home/eric/pictures/setup.jpg': {
    type: 'file',
    content: `[IMAGE: Desk setup — dual monitors, mechanical keyboard, coffee]
(Open the Pictures app to view)`,
  },
  '/home/eric/videos': {
    type: 'dir',
    children: ['README.txt'],
  },
  '/home/eric/videos/README.txt': {
    type: 'file',
    content: `Videos coming soon. Open the Videos app to check.`,
  },

  // ── Hidden files ──
  '/home/eric/.hidden': {
    type: 'dir',
    children: ['thoughts.txt', 'todo.txt', 'easter-egg.txt'],
  },
  '/home/eric/.hidden/thoughts.txt': {
    type: 'file',
    content: `3am thoughts:
─────────────
Is a hotdog a sandwich?
If you try to fail and succeed, which did you do?
The person who invented "knock knock" jokes deserves a no-bell prize.
We live on a rock floating in infinite void and people get mad about fonts.`,
  },
  '/home/eric/.hidden/todo.txt': {
    type: 'file',
    content: `TODO:
  [x] Build personal site
  [x] Make it look like Win95
  [x] Add games
  [x] Add easter eggs
  [ ] Touch grass
  [ ] Stop adding features at 2am
  [ ] Actually write blog posts`,
  },
  '/home/eric/.hidden/easter-egg.txt': {
    type: 'file',
    content: `🎉 You found a secret file!

Here are some hints:
  • Type "IDDQD" anywhere on the site
  • Try the Konami Code (↑↑↓↓←→←→BA)
  • Visit at 3am for a surprise
  • Try "sudo rm -rf /" in this terminal
  • Right-click the desktop

There might be more. Keep looking.`,
  },
  '/home/eric/.ssh': {
    type: 'dir',
    children: ['id_rsa.pub'],
  },
  '/home/eric/.ssh/id_rsa.pub': {
    type: 'file',
    content: `ssh-rsa AAAAB3NzaC1yc2EAAAADAQAB...
(nice try 😏)`,
  },

  // ── System files ──
  '/.secret': {
    type: 'dir',
    children: ['manifesto.txt'],
  },
  '/.secret/manifesto.txt': {
    type: 'file',
    content: `THE CHEMNET MANIFESTO
═════════════════════

1. The internet should be fun again.
2. Personal sites > social media profiles.
3. Ship things. Break things. Fix things. Repeat.
4. Build for people, not algorithms.
5. Leave easter eggs everywhere.
6. Every website should have games.
7. The old internet was better and we all know it.

    — e.c.`,
  },
  '/usr': { type: 'dir', children: ['bin', 'local'] },
  '/usr/bin': { type: 'dir', children: ['games'] },
  '/usr/bin/games': { type: 'file', content: 'Try: open solitaire, open chess, open asteroids, open pacman' },
  '/usr/local': { type: 'dir', children: [] },
  '/etc': { type: 'dir', children: ['motd', 'hostname'] },
  '/etc/motd': { type: 'file', content: 'Welcome to ChemNet OS v1.0\nA place to explore.' },
  '/etc/hostname': { type: 'file', content: 'chemnet' },
  '/var': { type: 'dir', children: ['log'] },
  '/var/log': { type: 'dir', children: ['system.log'] },
  '/var/log/system.log': { type: 'file', content: '[OK] Desktop loaded\n[OK] Games initialized\n[OK] Easter eggs armed\n[OK] Vibes: immaculate' },
  '/tmp': { type: 'dir', children: [] },
}

function resolvePath(cwd, path) {
  if (path.startsWith('/')) return normalizePath(path)
  const parts = cwd.split('/').filter(Boolean)
  for (const seg of path.split('/')) {
    if (seg === '..') parts.pop()
    else if (seg !== '.' && seg !== '') parts.push(seg)
  }
  return '/' + parts.join('/')
}

function normalizePath(p) {
  const parts = p.split('/').filter(Boolean)
  const result = []
  for (const seg of parts) {
    if (seg === '..') result.pop()
    else if (seg !== '.') result.push(seg)
  }
  return '/' + result.join('/')
}

const HELP_TEXT = `Available commands:
  help             show this help
  ls [path]        list directory contents
  ls -a [path]     list all files (including hidden)
  cd <path>        change directory
  cat <file>       read a file
  pwd              print working directory
  whoami           who are you?
  whois eric       about Eric
  open <app>       open an app by name
  find <name>      search for a file
  tree             show directory tree
  history          show command history
  clear            clear the screen
  date             show current date/time
  echo <text>      print text
  cowsay <text>    moo
  sudo rm -rf /    don't.
  exit             close terminal`

export default function Terminal() {
  const [lines, setLines] = useState([
    { type: 'output', text: 'ChemNet Terminal v1.0' },
    { type: 'output', text: 'Type "help" for available commands.\n' },
  ])
  const [input, setInput] = useState('')
  const [cwd, setCwd] = useState('/home/eric')
  const [cmdHistory, setCmdHistory] = useState([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const addOutput = useCallback((text) => {
    setLines(prev => [...prev, { type: 'output', text }])
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const cmd = input.trim()
    if (!cmd) return

    setLines(prev => [...prev, { type: 'input', text: `${cwd} $ ${cmd}` }])
    setCmdHistory(prev => [...prev, cmd])
    setHistoryIdx(-1)
    setInput('')

    const parts = cmd.split(/\s+/)
    const command = parts[0].toLowerCase()
    const args = parts.slice(1)

    switch (command) {
      case 'help':
        addOutput(HELP_TEXT)
        break

      case 'clear':
        setLines([])
        break

      case 'pwd':
        addOutput(cwd)
        break

      case 'whoami':
        addOutput('eric')
        break

      case 'whois':
        if (args[0] === 'eric') {
          addOutput('Eric Chemwor — builder, engineer, guitarist, BJJ practitioner.\nShipping code and exploring the world, one commit at a time.')
        } else {
          addOutput(`whois: ${args[0] || '???'}: not found`)
        }
        break

      case 'date':
        addOutput(new Date().toString())
        break

      case 'echo':
        addOutput(args.join(' '))
        break

      case 'cowsay': {
        const msg = args.join(' ') || 'moo'
        const border = '─'.repeat(msg.length + 2)
        addOutput(` ┌${border}┐\n │ ${msg} │\n └${border}┘\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`)
        break
      }

      case 'ls': {
        const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al')
        const pathArg = args.find(a => !a.startsWith('-'))
        const target = pathArg ? resolvePath(cwd, pathArg) : cwd
        const node = FS[target]
        if (!node) {
          addOutput(`ls: ${pathArg || target}: No such file or directory`)
        } else if (node.type !== 'dir') {
          addOutput(pathArg || target.split('/').pop())
        } else {
          const items = showHidden ? node.children : node.children.filter(c => !c.startsWith('.'))
          if (items.length === 0) {
            addOutput('(empty directory)')
          } else {
            const formatted = items.map(item => {
              const fullPath = target === '/' ? '/' + item : target + '/' + item
              const child = FS[fullPath]
              if (child?.type === 'dir') return item + '/'
              return item
            })
            addOutput(formatted.join('  '))
          }
        }
        break
      }

      case 'cd': {
        if (!args[0] || args[0] === '~') {
          setCwd('/home/eric')
          break
        }
        const target = resolvePath(cwd, args[0])
        const node = FS[target]
        if (!node) {
          addOutput(`cd: ${args[0]}: No such file or directory`)
        } else if (node.type !== 'dir') {
          addOutput(`cd: ${args[0]}: Not a directory`)
        } else {
          setCwd(target)
        }
        break
      }

      case 'cat': {
        if (!args[0]) {
          addOutput('cat: missing file operand')
          break
        }
        const target = resolvePath(cwd, args[0])
        const node = FS[target]
        if (!node) {
          addOutput(`cat: ${args[0]}: No such file or directory`)
        } else if (node.type === 'dir') {
          addOutput(`cat: ${args[0]}: Is a directory`)
        } else {
          addOutput(node.content)
        }
        break
      }

      case 'find': {
        if (!args[0]) {
          addOutput('find: missing search term')
          break
        }
        const term = args[0].toLowerCase()
        const results = Object.keys(FS).filter(path =>
          path.toLowerCase().includes(term)
        )
        if (results.length === 0) {
          addOutput(`find: no results for "${args[0]}"`)
        } else {
          addOutput(results.join('\n'))
        }
        break
      }

      case 'tree': {
        const buildTree = (path, prefix, isLast) => {
          const node = FS[path]
          if (!node || node.type !== 'dir') return []
          const lines = []
          const children = node.children.filter(c => !c.startsWith('.'))
          children.forEach((child, i) => {
            const last = i === children.length - 1
            const connector = last ? '└── ' : '├── '
            const childPath = path === '/' ? '/' + child : path + '/' + child
            const childNode = FS[childPath]
            const display = childNode?.type === 'dir' ? child + '/' : child
            lines.push(prefix + connector + display)
            if (childNode?.type === 'dir') {
              const newPrefix = prefix + (last ? '    ' : '│   ')
              lines.push(...buildTree(childPath, newPrefix))
            }
          })
          return lines
        }
        const treeLines = buildTree(cwd, '')
        addOutput(cwd + '\n' + treeLines.join('\n'))
        break
      }

      case 'open': {
        if (!args[0]) {
          addOutput('open: specify an app (try: open blog, open chess, open solitaire)')
          break
        }
        window.dispatchEvent(new CustomEvent('ericOS:openApp', { detail: args[0].toLowerCase() }))
        addOutput(`Opening ${args[0]}...`)
        break
      }

      case 'history':
        addOutput(cmdHistory.map((c, i) => `  ${i + 1}  ${c}`).join('\n'))
        break

      case 'sudo':
        if (args.join(' ') === 'rm -rf /' || args.join(' ') === 'rm -rf /*') {
          addOutput('Initiating system destruction...')
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('ericOS:meltdown'))
          }, 500)
        } else {
          addOutput('Nice try.')
        }
        break

      case 'exit':
        addOutput('Goodbye.')
        break

      case 'rm':
        addOutput("rm: permission denied (this is a read-only filesystem, you're a guest here)")
        break

      case 'mkdir':
      case 'touch':
      case 'mv':
      case 'cp':
        addOutput(`${command}: permission denied (read-only filesystem)`)
        break

      case 'vim':
      case 'nano':
      case 'emacs':
        addOutput(`${command}: this is a website, not your server`)
        break

      case 'git':
        if (args[0] === 'log') {
          addOutput(`commit a1b2c3d (HEAD -> main)
Author: Eric Chemwor <eric@chemnet.dev>
Date:   2026

    feat: built an entire OS in a browser because why not

commit d4e5f6g
Author: Eric Chemwor <eric@chemnet.dev>
Date:   2026

    fix: stopped adding features at 2am (lie)

commit h7i8j9k
Author: Eric Chemwor <eric@chemnet.dev>
Date:   2026

    initial commit: what have I done`)
        } else {
          addOutput('fatal: not a git repository (but nice try)')
        }
        break

      case 'neofetch':
        addOutput(`        ╔══════╗      eric@chemnet
        ║ CHEM ║      ────────────
        ║  NET ║      OS: ChemNet v1.0
        ╚══════╝      Host: Your Browser
                       Kernel: React 19
                       Shell: ChemTerminal
                       Theme: Warm Slate
                       Icons: Pixel SVG
                       Terminal: 80x24
                       CPU: Vibes @ 3.2GHz
                       Memory: 640K (ought to be enough)`)
        break

      case 'ping':
        addOutput(`PING ${args[0] || 'localhost'}: 64 bytes, time=0ms\nPING ${args[0] || 'localhost'}: 64 bytes, time=0ms\nPING ${args[0] || 'localhost'}: 64 bytes, time=0ms\n--- ping complete ---\n(this isn't a real network, you know that right?)`)
        break

      default:
        addOutput(`command not found: ${command}\nType "help" for available commands.`)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (cmdHistory.length === 0) return
      const newIdx = historyIdx < 0 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1)
      setHistoryIdx(newIdx)
      setInput(cmdHistory[newIdx])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx < 0) return
      const newIdx = historyIdx + 1
      if (newIdx >= cmdHistory.length) {
        setHistoryIdx(-1)
        setInput('')
      } else {
        setHistoryIdx(newIdx)
        setInput(cmdHistory[newIdx])
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      // Basic tab completion for paths
      const parts = input.split(/\s+/)
      const last = parts[parts.length - 1]
      if (!last) return
      const dir = last.includes('/') ? resolvePath(cwd, last.substring(0, last.lastIndexOf('/') + 1)) : cwd
      const prefix = last.includes('/') ? last.substring(last.lastIndexOf('/') + 1) : last
      const node = FS[dir]
      if (!node || node.type !== 'dir') return
      const matches = node.children.filter(c => c.toLowerCase().startsWith(prefix.toLowerCase()))
      if (matches.length === 1) {
        parts[parts.length - 1] = last.includes('/') ? last.substring(0, last.lastIndexOf('/') + 1) + matches[0] : matches[0]
        setInput(parts.join(' '))
      } else if (matches.length > 1) {
        addOutput(matches.join('  '))
      }
    }
  }

  // Listen for openApp events from other parts of the shell
  useEffect(() => {
    const handler = (e) => {
      window.dispatchEvent(new CustomEvent('ericOS:openApp', { detail: e.detail }))
    }
    return () => {}
  }, [])

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: '#0a0a0a',
        color: '#FF6B35',
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
            style={{ color: line.type === 'input' ? '#F0EBE1' : '#FF6B35' }}
          >
            {line.text}
          </div>
        ))}
        <form onSubmit={handleSubmit} className="flex items-center mt-1">
          <span style={{ color: '#F0EBE1' }}>{cwd} $&nbsp;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none"
            style={{
              color: '#F0EBE1',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              caretColor: '#FF6B35',
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
