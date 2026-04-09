import { useWindowManager } from './hooks/useWindowManager'
import { DesktopShell } from './shell/DesktopShell'
import './App.css'

export default function App() {
  const windowManager = useWindowManager()

  return <DesktopShell windowManager={windowManager} />
}
