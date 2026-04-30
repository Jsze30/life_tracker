import { useState, useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { migrateFromLocalStorage } from './lib/migrate'
import { useStore } from './store'
import Layout from './components/Layout'
import TodayPage from './pages/TodayPage'
import SchoolworkPage from './pages/SchoolworkPage'
import HabitsPage from './pages/HabitsPage'
import ContentPage from './pages/ContentPage'
import InsightsPage from './pages/InsightsPage'

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F7F7F5' }}>
      <span style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#1A3C2B', fontSize: '0.875rem' }}>Loading…</span>
    </div>
  )
}

function LoginScreen() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [linkSent, setLinkSent] = useState(false)

  async function sendMagicLink(e) {
    e.preventDefault()
    setSending(true)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setLinkSent(true)
    setSending(false)
  }

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#F7F7F5',
    gap: '1rem',
  }

  if (linkSent) {
    return (
      <div style={containerStyle}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#1A3C2B', fontSize: '1.25rem', margin: 0 }}>Check your email</h1>
        <p style={{ fontFamily: 'General Sans, sans-serif', color: '#3A3A38', fontSize: '0.875rem', margin: 0 }}>Magic link sent to {email}</p>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#1A3C2B', fontSize: '1.5rem', margin: 0 }}>Habit Tracker</h1>
      <form onSubmit={sendMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', width: '260px' }}>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: '0.625rem 0.75rem',
            border: '1px solid rgba(58,58,56,0.2)',
            borderRadius: '2px',
            fontFamily: 'General Sans, sans-serif',
            fontSize: '0.875rem',
            background: '#fff',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={sending}
          style={{
            padding: '0.625rem',
            background: '#1A3C2B',
            color: '#fff',
            border: 'none',
            borderRadius: '2px',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '0.875rem',
            cursor: sending ? 'not-allowed' : 'pointer',
            opacity: sending ? 0.7 : 1,
          }}
        >
          {sending ? 'Sending…' : 'Send magic link'}
        </button>
      </form>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const initStore = useStore((s) => s.initStore)
  const storeLoading = useStore((s) => s.loading)
  const initialized = useRef(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session && !initialized.current) {
      initialized.current = true
      migrateFromLocalStorage().then(() => initStore())
    }
  }, [session])

  if (authLoading || (session && storeLoading)) return <LoadingScreen />
  if (!session) return <LoginScreen />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<TodayPage />} />
        <Route path="/schoolwork" element={<SchoolworkPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/content" element={<ContentPage />} />
        <Route path="/insights" element={<InsightsPage />} />
      </Route>
    </Routes>
  )
}
