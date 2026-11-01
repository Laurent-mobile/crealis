//frontend-web/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AppProvider } from './context/AppContext'
import './styles/crealis.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <App />
      <Toaster position="bottom-right" />
    </AppProvider>
  </React.StrictMode>
)
