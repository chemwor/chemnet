import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createGlobalStyle, ThemeProvider } from 'styled-components'
import { styleReset } from 'react95'
import original from 'react95/dist/themes/original'
import './index.css'
import App from './App.jsx'

const GlobalStyles = createGlobalStyle`
  ${styleReset}
`

const warmSlate = {
  ...original,
  desktopBackground: '#1E1C28',
  headerBackground: 'linear-gradient(90deg, #3D2B1F, #2C2A35)',
  headerNotActiveBackground: 'linear-gradient(90deg, #2C2A35, #1A1820)',
  headerNotActiveText: '#5A5465',
  headerText: '#F0EBE1',
  material: '#2C2A35',
  materialDark: '#110F18',
  materialText: '#F0EBE1',
  materialTextDisabled: '#5A5465',
  materialTextDisabledShadow: '#110F18',
  materialTextInvert: '#1E1C28',
  borderDark: '#110F18',
  borderDarkest: '#1A1820',
  borderLight: '#4A4555',
  borderLightest: '#5A5465',
  canvas: '#1E1C28',
  canvasText: '#F0EBE1',
  canvasTextDisabled: '#5A5465',
  canvasTextDisabledShadow: '#110F18',
  canvasTextInvert: '#F0EBE1',
  checkmark: '#F0EBE1',
  checkmarkDisabled: '#5A5465',
  flatDark: '#2C2A35',
  flatLight: '#4A4555',
  focusSecondary: '#110F18',
  hoverBackground: '#FF6B35',
  progress: '#FF6B35',
  tooltip: '#2C2A35',
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalStyles />
    <ThemeProvider theme={warmSlate}>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
