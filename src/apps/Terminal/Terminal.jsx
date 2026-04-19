import { useState, useRef, useEffect, useCallback } from 'react'
import { recordDiscovery } from '../../lib/layers'

// ── Fake filesystem ──
const FS = {
  '/': {
    type: 'dir',
    children: ['home', 'usr', 'etc', 'var', 'tmp'],
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
    type: 'file', date: 'Apr 19 2026',
    content: `Eric Chemwor\n─────────────\nBuilder. Engineer. Guitarist. BJJ practitioner.\n\nBased out of Nairobi → the world.\nBuilding things that matter, one commit at a time.\n\nCurrently working on: ChemNet, DMHOA, MGN\nCurrently reading: Meditations by Marcus Aurelius\nCurrently listening to: Kendrick, J. Cole, Afrobeats\n\n"Ship it. Learn from it. Ship the next one."`,
  },
  '/home/eric/projects': { type: 'dir', date: 'Apr 19 2026', children: ['dmhoa.txt', 'mgn.txt', 'chemnet.txt', 'blitzsquares.txt'] },
  '/home/eric/projects/dmhoa.txt': {
    type: 'file', date: 'Apr 19 2026',
    content: `DMHOA — Homeowners Association Platform\n────────────────────────────────────────\nA platform to help HOAs communicate, manage dues,\nand coordinate community events. Built because our\nHOA was stuck in the dark ages of paper notices.\n\nStack: React, Node.js, PostgreSQL, Stripe\nStatus: Live and growing`,
  },
  '/home/eric/projects/mgn.txt': {
    type: 'file', date: 'Apr 19 2026',
    content: `MGN — Local News Network\n────────────────────────\nHyperlocal news platform connecting communities\nwith the stories that matter to them. Filling the\ngap left by dying local newspapers.\n\nStack: Next.js, Supabase, Mapbox\nStatus: In development`,
  },
  '/home/eric/projects/chemnet.txt': {
    type: 'file', date: 'Apr 19 2026',
    content: `ChemNet — This Site\n────────────────────\nA personal site styled as a Win95 desktop OS.\nBuilt to chase the feeling of the old internet.\n\nStack: React, Vite, react95, Tailwind, Framer Motion\nStatus: You're looking at it`,
  },
  '/home/eric/projects/blitzsquares.txt': {
    type: 'file', date: 'Apr 19 2026',
    content: `BlitzSquares — Football Squares Game\n─────────────────────────────────────\nReal-time football squares game for Super Bowl\nparties and watch groups. Automated scoring,\nlive updates, cash out.\n\nStack: React Native, Firebase\nStatus: Seasonal`,
  },
  '/home/eric/blog': { type: 'dir', date: 'Apr 19 2026', children: ['why-i-build.txt', 'chess-and-business.txt', 'kenyan-in-tech.txt'] },
  '/home/eric/blog/why-i-build.txt': {
    type: 'file', date: 'Apr 19 2026',
    content: `The best projects come from scratching your own itch.\nShip it. Learn from it. Ship the next one.\n\n(Open the Blog app for the full post)`,
  },
  '/home/eric/blog/chess-and-business.txt': {
    type: 'file', date: 'Apr 19 2026',
    content: `Control the center. Think three moves ahead.\nSacrifice pieces strategically. Tempo is everything.\n\n(Open the Blog app for the full post)`,
  },
  '/home/eric/blog/kenyan-in-tech.txt': {
    type: 'file', date: 'Apr 19 2026',
    content: `Kenyans built M-Pesa before the rest of the world\nunderstood mobile payments. Build for the people in\nfront of you, not the people on TechCrunch.\n\n(Open the Blog app for the full post)`,
  },
  '/home/eric/music': { type: 'dir', date: 'Apr 19 2026', children: ['now-playing.txt', 'gear.txt'] },
  '/home/eric/music/now-playing.txt': {
    type: 'file', date: 'Apr 19 2026',
    content: `Now Playing:\n  Kendrick Lamar — GNX\n  J. Cole — The Fall Off\n  Burna Boy — I Told Them\n  Tyler, the Creator — CHROMAKOPIA`,
  },
  '/home/eric/music/gear.txt': {
    type: 'file', date: 'Apr 19 2026',
    content: `Guitar Gear:\n  Fender Stratocaster (MIM, sunburst)\n  Orange Crush 20RT\n  Boss DS-1 Distortion\n  TC Electronic Hall of Fame Reverb\n  Snark clip-on tuner (the essentials)`,
  },
  '/home/eric/pictures': { type: 'dir', date: 'Apr 19 2026', children: ['nairobi.jpg', 'kilimanjaro.jpg', 'setup.jpg'] },
  '/home/eric/pictures/nairobi.jpg': { type: 'file', date: 'Apr 19 2026', content: `[IMAGE: Nairobi skyline at sunset, 2024]\n(Open the Pictures app to view)` },
  '/home/eric/pictures/kilimanjaro.jpg': { type: 'file', date: 'Apr 19 2026', content: `[IMAGE: Summit of Kilimanjaro, Uhuru Peak, 5895m]\n(Open the Pictures app to view)` },
  '/home/eric/pictures/setup.jpg': { type: 'file', date: 'Apr 19 2026', content: `[IMAGE: Desk setup — dual monitors, mechanical keyboard, coffee]\n(Open the Pictures app to view)` },
  '/home/eric/videos': { type: 'dir', date: 'Apr 19 2026', children: ['README.txt'] },
  '/home/eric/videos/README.txt': { type: 'file', date: 'Apr 19 2026', content: `Videos coming soon. Open the Videos app to check.` },

  // ── Hidden files (polished + raw drafts) ──
  '/home/eric/.hidden': { type: 'dir', date: 'Apr 19 2026', children: ['thoughts.txt', 'todo.txt', 'easter-egg.txt', 'manifesto.txt'] },
  '/home/eric/.hidden/thoughts.txt': {
    type: 'file', date: 'Apr 19 2026',
    content: `3am Thoughts\n─────────────\nIs a hotdog a sandwich? The structural argument says yes — starch on both sides of a protein. But the vibes say no. Vibes matter.\n\nIf you try to fail and succeed, which have you done? This kept me up for an hour. I still don't have an answer.\n\nThe person who invented knock-knock jokes deserves a no-bell prize. I'm not sorry.\n\nWe exist on a rock hurtling through infinite void at 67,000 mph and people lose their minds over font choices. Then again, I spent three hours picking the green for this terminal. So maybe I get it.`,
    raw: `3am thoughts\n\nis a hotdog a sandwich?? i think technically yes but it feels wrong\n\nif u try to fail and u succeed... did u fail or succeed. been thinking abt this for like an hour\n\nknock knock jokes. no bell prize. lol\n\nwe literally live on a flying rock in space and ppl get mad about fonts. tbf i just spent 3 hrs picking this green color so maybe im the problem`,
  },
  '/home/eric/.hidden/todo.txt': {
    type: 'file', date: 'Apr 19 2026',
    content: `TODO\n────\n  [x] Build personal site\n  [x] Make it look like Win95\n  [x] Add games\n  [x] Add easter eggs\n  [x] Add layer system\n  [ ] Touch grass\n  [ ] Stop adding features at 2am\n  [ ] Actually write blog posts\n  [ ] Learn to cook something besides eggs\n  [ ] Call mom back`,
    raw: `todo\n\nbuild site ✓\nmake it look old ✓\ngames ✓\neaster eggs ✓\nlayers ✓\ngo outside lol\nstop coding at 2am (wont happen)\nwrite blogs (keep saying ill do this)\nlearn to cook more than eggs\ncall mom she called twice`,
  },
  '/home/eric/.hidden/easter-egg.txt': {
    type: 'file', date: 'Apr 19 2026',
    content: `You found a secret file.\n\nHere's what's hidden around the site:\n  • Type "IDDQD" anywhere — triggers a BSOD\n  • Konami Code (↑↑↓↓←→←→BA) — inverts the screen\n  • Visit between 3am-4am — scary screensaver\n  • "sudo rm -rf /" in this terminal — meltdown sequence\n  • Right-click the desktop — context menu\n  • Drag a window off screen — it snaps back with a message\n\nThere are more. I won't say how many.`,
    raw: `easter eggs i put in\n\nIDDQD = bsod lol classic doom reference\nkonami code = screen goes weird for 3 sec\n3am screensaver = the scary one haha\nsudo rm -rf = fake meltdown, ppl will panic\nright click desktop = context menu w "why are you right clicking"\ndrag window off screen = snaps back, says hey where u taking that\n\nthink thats all of them? maybe ill add more idk`,
  },
  '/home/eric/.hidden/manifesto.txt': {
    type: 'file', date: 'Apr 19 2026',
    content: `THE CHEMNET MANIFESTO\n═════════════════════\n\n1. The internet should be fun again.\n2. Personal sites should matter more than social media profiles.\n3. Ship things. Break things. Fix things. Repeat.\n4. Build for people, not algorithms.\n5. Leave easter eggs everywhere.\n6. Every website should have games.\n7. The old internet was better and we all know it.\n\n    — e.c.`,
    raw: `manifesto or whatever\n\n1. internet should be fun again. it used to be\n2. personal sites > social media. linkedins are all the same\n3. ship stuff break stuff fix stuff do it again\n4. build for actual ppl not the algorithm\n5. put easter eggs in everything why not\n6. websites should have games. i said what i said\n7. old internet was better fight me\n\n- ec`,
  },
  '/home/eric/.ssh': { type: 'dir', date: 'Apr 19 2026', children: ['id_rsa.pub'] },
  '/home/eric/.ssh/id_rsa.pub': { type: 'file', date: 'Apr 19 2026', content: `ssh-rsa AAAAB3NzaC1yc2EAAAADAQAB...\n(nice try 😏)` },

  // ── System files ──
  '/usr': { type: 'dir', date: 'Apr 19 2026', children: ['bin', 'local'] },
  '/usr/bin': { type: 'dir', date: 'Apr 19 2026', children: ['games'] },
  '/usr/bin/games': { type: 'file', date: 'Apr 19 2026', content: 'Try: open solitaire, open chess, open asteroids, open pacman' },
  '/usr/local': { type: 'dir', date: 'Apr 19 2026', children: [] },
  '/etc': { type: 'dir', date: 'Apr 19 2026', children: ['motd', 'hostname'] },
  '/etc/motd': { type: 'file', date: 'Apr 19 2026', content: 'Welcome to ChemNet OS v1.0\nA place to explore.' },
  '/etc/hostname': { type: 'file', date: 'Apr 19 2026', content: 'chemnet' },
  '/var': { type: 'dir', date: 'Apr 19 2026', children: ['log'] },
  '/var/log': { type: 'dir', date: 'Apr 19 2026', children: ['system.log'] },
  '/var/log/system.log': { type: 'file', date: 'Apr 19 2026', content: '[OK] Desktop loaded\n[OK] Games initialized\n[OK] Easter eggs armed\n[OK] Vibes: immaculate' },
  '/tmp': { type: 'dir', date: 'Apr 19 2026', children: [] },
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
  cat <file>       read a file (polished)
  cat --raw <file> read the rough draft
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

      case 'whoami': {
        const responses = [
          `$ whoami\n\nDepends who's asking.\n\n  [COMPILER]  A process with elevated privileges\n              and unresolved warnings.\n\n  [CATS]      The true admins of this household.\n              I just run background processes.\n\n  [PARENTS]   For shipping v1 with surprisingly\n              few bugs, and for every patch since.\n\n  [FRIENDS]   My peer reviewers. Merciless,\n              essential, and mostly unpaid.\n\n  [SELF]      Guitarist. Pianist. Cook. Grappler.\n              Boxer-ish. Coder. Creator. Wizard.\n              Mid at most. Shows up anyway.\n\n> eric\n\nBut wait — if I'm Eric, who are YOU?\nYou're on MY computer right now. Typing in MY terminal.\nI built this whole site and now some stranger is poking\naround my filesystem like they own the place.\n\nBold move. I respect it. Carry on.`,
          `$ whoami\n\nDepends who's asking.\n\n  [COMPILER]  A process with elevated privileges\n              and unresolved warnings.\n\n  [CATS]      The true admins of this household.\n              I just run background processes.\n\n  [PARENTS]   For shipping v1 with surprisingly\n              few bugs, and for every patch since.\n\n  [FRIENDS]   My peer reviewers. Merciless,\n              essential, and mostly unpaid.\n\n  [SELF]      Guitarist. Pianist. Cook. Grappler.\n              Boxer-ish. Coder. Creator. Wizard.\n              Mid at most. Shows up anyway.\n\n> eric (most days)\n\nReal talk though — I know I'm Eric. I typed this.\nThe better question is who are YOU? You showed up to\na stranger's fake operating system and started running\ncommands. That's either curiosity or a cry for help.\n\nEither way, welcome. You're my kind of weird.`,
          `$ whoami\n\nRunning identity check...\n\n  [COMPILER]  A process with elevated privileges\n              and unresolved warnings.\n\n  [CATS]      The true admins of this household.\n              I just run background processes.\n\n  [PARENTS]   For shipping v1 with surprisingly\n              few bugs, and for every patch since.\n\n  [FRIENDS]   My peer reviewers. Merciless,\n              essential, and mostly unpaid.\n\n  [SELF]      Guitarist. Pianist. Cook. Grappler.\n              Boxer-ish. Coder. Creator. Wizard.\n              Mid at most. Shows up anyway.\n\nConclusion: inconclusive.\nTry again after green tea.\n\n──────────────────────────\n\nNow running visitor check...\n\n  Name:        ???\n  Location:    somewhere on the internet\n  Intent:      snooping around my site\n  Threat level: low (probably)\n  Vibe check:  passed (you found the terminal)\n\nConclusion: you seem cool.\nDon't touch anything weird.`,
        ]
        addOutput(responses[Math.floor(Math.random() * responses.length)])
        break
      }

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
        if (showHidden) recordDiscovery('ls-a')
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
            const rows = items.map(item => {
              const fullPath = target === '/' ? '/' + item : target + '/' + item
              const child = FS[fullPath]
              const isDir = child?.type === 'dir'
              const name = isDir ? item + '/' : item
              const date = child?.date || ''
              const type = isDir ? '<DIR>' : '     '
              return `${date.padEnd(13)}${type}  ${name}`
            })
            addOutput(rows.join('\n'))
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
          if (target.includes('.hidden')) {
            recordDiscovery('found-hidden-dir')
          }
        }
        break
      }

      case 'cat': {
        const useRaw = args.includes('--raw')
        const fileArg = args.find(a => a !== '--raw')
        if (!fileArg) {
          addOutput('cat: missing file operand')
          break
        }
        const target = resolvePath(cwd, fileArg)
        const node = FS[target]
        if (!node) {
          addOutput(`cat: ${fileArg}: No such file or directory`)
        } else if (node.type === 'dir') {
          addOutput(`cat: ${fileArg}: Is a directory`)
        } else if (useRaw && node.raw) {
          addOutput(`── raw draft ──\n\n${node.raw}\n\n── (use "cat ${fileArg}" for the polished version) ──`)
        } else if (useRaw && !node.raw) {
          addOutput(`cat: no raw draft available for ${fileArg}`)
        } else {
          let output = node.content
          if (node.raw) output += `\n\n── (use "cat --raw ${fileArg}" to see the rough draft) ──`
          addOutput(output)
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
