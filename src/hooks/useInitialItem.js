import { useState } from 'react'

// Deep-link "open to this item" handoff. When ChemFeed (or any link) opens an
// app focused on a specific row, the shell stashes { app, itemId } here before
// opening the app. The app reads it once on mount via useInitialItem(appId).
let pending = null

export function setInitialItem(app, itemId) {
  pending = { app, itemId: String(itemId) }
}

// Returns the pending item id for this app exactly once, then clears it so the
// focus does not re-trigger on later renders.
export function useInitialItem(appId) {
  const [itemId] = useState(() => {
    if (pending && pending.app === appId) {
      const id = pending.itemId
      pending = null
      return id
    }
    return null
  })
  return itemId
}
