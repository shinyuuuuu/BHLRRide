import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Browsepage from './Browsepage.jsx'
import './index.css'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Browsepage />
  </StrictMode>,
)
