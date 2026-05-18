import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

if (new URLSearchParams(window.location.search).get('debug') === '1') {
  import('eruda').then(({ default: eruda }) => eruda.init())
}

createRoot(document.getElementById('root')!).render(<App />)
