import { useMediaQuery } from './hooks/useMediaQuery'
import { useWindowManager } from './hooks/useWindowManager'
import { DesktopShell } from './shell/DesktopShell'
import { MobileShell } from './shell/MobileShell'
import './App.css'

export default function App() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const windowManager = useWindowManager()

  return isMobile
    ? <MobileShell windowManager={windowManager} />
    : <DesktopShell windowManager={windowManager} />
}
