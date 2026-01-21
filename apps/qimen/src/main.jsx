import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@my-meta/ui/fonts.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
