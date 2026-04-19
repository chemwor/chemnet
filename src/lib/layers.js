// ── Layer Access System ──
// 5 layers of depth — the deeper you go, the more you need to know
//
// Layer 1 — Surface:   Default. Everything on the desktop/start menu.
// Layer 2 — Curious:   Found by exploring (ls -a, hidden folders, right-click).
// Layer 3 — Explorer:  Solve puzzles, find passwords, beat challenges.
// Layer 4 — Insider:   Collect 3 keys scattered across the site.
// Layer 5 — The Vault: Time-gated + Layer 4 + obscure final step.

const STORAGE_KEY = 'chemnet_layers'

const DEFAULT_STATE = {
  unlockedLayers: [1],        // everyone starts with layer 1
  layer2: {
    usedLsA: false,           // typed ls -a in terminal
    foundHiddenDir: false,    // cd'd into .hidden
    rightClicked: false,      // used desktop context menu
    unlocked: false,
  },
  layer3: {
    // Future: password found, game challenge beaten
    unlocked: false,
  },
  layer4: {
    // Future: 3 keys collected
    keys: [],
    unlocked: false,
  },
  layer5: {
    // Future: final step
    unlocked: false,
  },
  discoveries: [],            // log of what the user has found
}

function load() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return JSON.parse(JSON.stringify(DEFAULT_STATE))
    return { ...JSON.parse(JSON.stringify(DEFAULT_STATE)), ...JSON.parse(data) }
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_STATE))
  }
}

function save(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

// ── Queries ──

export function getLayerState() {
  return load()
}

export function isLayerUnlocked(layer) {
  const state = load()
  return state.unlockedLayers.includes(layer)
}

export function getHighestLayer() {
  const state = load()
  return Math.max(...state.unlockedLayers)
}

export function getDiscoveries() {
  return load().discoveries
}

// ── Layer 2 progress ──

export function recordDiscovery(action) {
  const state = load()

  // Prevent duplicates
  if (state.discoveries.includes(action)) return false

  state.discoveries.push(action)

  // Layer 2 unlocks
  if (action === 'ls-a') state.layer2.usedLsA = true
  if (action === 'found-hidden-dir') state.layer2.foundHiddenDir = true
  if (action === 'right-click-desktop') state.layer2.rightClicked = true

  // Check if layer 2 is unlocked (need at least 2 of 3 discoveries)
  const l2Count = [state.layer2.usedLsA, state.layer2.foundHiddenDir, state.layer2.rightClicked].filter(Boolean).length
  if (l2Count >= 2 && !state.layer2.unlocked) {
    state.layer2.unlocked = true
    if (!state.unlockedLayers.includes(2)) {
      state.unlockedLayers.push(2)
      save(state)
      // Dispatch event so UI can react
      window.dispatchEvent(new CustomEvent('chemnet:layer-unlocked', { detail: { layer: 2 } }))
      return true // newly unlocked
    }
  }

  save(state)
  return false
}

// ── Layer 3 (future) ──

export function checkLayer3() {
  const state = load()
  // Placeholder — will be wired when puzzles are created
  if (state.layer3.unlocked) return true
  return false
}

export function unlockLayer3() {
  const state = load()
  if (state.layer3.unlocked) return false
  state.layer3.unlocked = true
  if (!state.unlockedLayers.includes(3)) state.unlockedLayers.push(3)
  save(state)
  window.dispatchEvent(new CustomEvent('chemnet:layer-unlocked', { detail: { layer: 3 } }))
  return true
}

// ── Layer 4 (future) ──

export function submitKey(key) {
  const state = load()
  if (state.layer4.keys.includes(key)) return false
  state.layer4.keys.push(key)

  if (state.layer4.keys.length >= 3 && !state.layer4.unlocked) {
    state.layer4.unlocked = true
    if (!state.unlockedLayers.includes(4)) state.unlockedLayers.push(4)
    save(state)
    window.dispatchEvent(new CustomEvent('chemnet:layer-unlocked', { detail: { layer: 4 } }))
    return 'layer4'
  }

  save(state)
  return 'key'
}

// ── Layer 5 (future) ──

export function unlockLayer5() {
  const state = load()
  if (state.layer5.unlocked) return false
  if (!state.layer4.unlocked) return false // requires layer 4
  state.layer5.unlocked = true
  if (!state.unlockedLayers.includes(5)) state.unlockedLayers.push(5)
  save(state)
  window.dispatchEvent(new CustomEvent('chemnet:layer-unlocked', { detail: { layer: 5 } }))
  return true
}

// ── Reset ──

export function resetLayers() {
  save(JSON.parse(JSON.stringify(DEFAULT_STATE)))
}
