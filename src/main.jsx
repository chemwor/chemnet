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

const boneRust = {
  ...original,
  desktopBackground: '#E8E2D6',
  headerBackground: 'linear-gradient(90deg, #C0392B, #A03020)',
  headerNotActiveBackground: 'linear-gradient(90deg, #B8B0A0, #A89F8F)',
  headerNotActiveText: '#6B6560',
  headerText: '#F0EBE1',
  material: '#F0EBE1',
  materialDark: '#B8B0A0',
  materialText: '#2C2826',
  materialTextDisabled: '#B8B0A0',
  materialTextDisabledShadow: '#FAF7F2',
  materialTextInvert: '#F0EBE1',
  borderDark: '#B8B0A0',
  borderDarkest: '#A89F8F',
  borderLight: '#FAF7F2',
  borderLightest: '#FFFFFF',
  canvas: '#F0EBE1',
  canvasText: '#2C2826',
  canvasTextDisabled: '#B8B0A0',
  canvasTextDisabledShadow: '#FAF7F2',
  canvasTextInvert: '#F0EBE1',
  checkmark: '#2C2826',
  checkmarkDisabled: '#B8B0A0',
  flatDark: '#DDD7CB',
  flatLight: '#FAF7F2',
  focusSecondary: '#B8B0A0',
  hoverBackground: '#C0392B',
  progress: '#C0392B',
  tooltip: '#F0EBE1',
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalStyles />
    <ThemeProvider theme={boneRust}>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
