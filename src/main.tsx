import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRoutes from './router'           // <- fișierul tău index.tsx din router
import { AuthProvider } from './context/AuthContext' // dacă folosești context

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </React.StrictMode>
)