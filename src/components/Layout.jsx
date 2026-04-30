import { NavLink, Link, Outlet, useLocation } from 'react-router-dom'
import { Home, BookOpen, Repeat, Share2, TrendingUp } from 'lucide-react'
import { GlobeHemisphereWest } from '@phosphor-icons/react'
import { useRef, useEffect, useState } from 'react'
import MosaicBackground from './MosaicBackground'

const sunIcon = '/sun.svg'

const navItems = [
  { to: '/', label: 'TODAY', index: '01', icon: Home },
  { to: '/schoolwork', label: 'SCHOOL', index: '02', icon: BookOpen },
  { to: '/habits', label: 'HABITS', index: '03', icon: Repeat },
  { to: '/content', label: 'CONTENT', index: '04', icon: Share2 },
  { to: '/insights', label: 'INSIGHTS', index: '05', icon: TrendingUp },
]

export default function Layout() {
  const location = useLocation()
  const navRef = useRef(null)
  const itemRefs = useRef([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('life-tracker-theme') === 'dark' ? 'dark' : 'light'
  )

  const activeIndex = navItems.findIndex((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('life-tracker-theme', theme)
  }, [theme])

  useEffect(() => {
    const el = itemRefs.current[activeIndex]
    const nav = navRef.current
    if (!el || !nav) return
    const navRect = nav.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    setIndicator({ left: elRect.left - navRect.left, width: elRect.width, ready: true })
  }, [activeIndex])

  return (
    <div className="min-h-screen">
      <MosaicBackground />

      <button
        type="button"
        onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
        className="theme-toggle fixed top-3 right-3 z-[60] w-9 h-9 rounded-lg text-forest flex items-center justify-center"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <span
          key={theme}
          aria-hidden="true"
          className="theme-toggle-icon block w-5 h-5 bg-current"
          style={{
            WebkitMask: `url(${sunIcon}) center / contain no-repeat`,
            mask: `url(${sunIcon}) center / contain no-repeat`,
          }}
        />
      </button>

      {/* Desktop Header */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 items-center px-6 border-b border-grid/20 bg-paper/95 backdrop-blur-sm">
        <Link to="/" className="w-8 h-8 bg-forest rounded-sm flex items-center justify-center flex-shrink-0 hover:scale-110 hover:bg-forest/80 transition-all duration-150">
          <GlobeHemisphereWest size={20} color="white" weight="bold" />
        </Link>

        <nav ref={navRef} className="relative flex items-center gap-8 ml-10">
          {navItems.map((item, i) => (
            <span key={item.to} ref={(el) => (itemRefs.current[i] = el)}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                    isActive ? 'text-forest' : 'text-grid/60 hover:text-grid'
                  }`
                }
              >
                {item.index}. {item.label}
              </NavLink>
            </span>
          ))}
          {indicator.ready && (
            <span
              className="absolute bottom-0 h-px bg-forest transition-all duration-300 ease-in-out"
              style={{ left: indicator.left, width: indicator.width }}
            />
          )}
        </nav>
      </header>

      {/* Page Content */}
      <main className="max-w-[960px] mx-auto px-4 md:px-6 pt-16 md:pt-20 pb-24 md:pb-12">
        <Outlet />
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 border-t border-grid/20 bg-paper/95 backdrop-blur-sm">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 ${
                  isActive ? 'text-forest' : 'text-grid/50'
                }`
              }
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="font-mono text-[8px] uppercase tracking-[0.1em]">
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
