import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface HeaderProps {
  subtitle?: string
  variant?: 'light' | 'dark'
}

export function Header({ subtitle, variant: _variant = 'dark' }: HeaderProps) {
  const { user, role } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const getDashboardPath = () => {
    if (role === 'player') return '/player/dashboard'
    if (role === 'academy') return '/academy/dashboard'
    if (role === 'recruiter') return '/recruiter/dashboard'
    if (role === 'admin') return '/admin'
    return '/'
  }

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl border-b transition-colors bg-surface-container-lowest/90 border-outline-variant/30 text-on-surface shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link to={user ? getDashboardPath() : '/'} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-[0_0_15px_rgba(168,230,0,0.4)] group-hover:scale-105 transition-transform font-sans bg-primary text-on-primary">
            TD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight font-sans transition-colors text-white">
                TERANGA <span className="text-primary font-black">DRAFT</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 font-semibold">
                Sénégal
              </span>
            </div>
            {subtitle ? (
              <p className="text-xs text-on-surface-variant">
                {subtitle}
              </p>
            ) : (
              <p className="text-[11px] hidden sm:block text-on-surface-variant">
                Plateforme de détection &amp; recrutement de talents
              </p>
            )}
          </div>
        </Link>

        {/* User Navigation / Quick Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to={getDashboardPath()}
                className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-colors bg-surface-container-low hover:bg-surface-container-high text-primary border-outline-variant/40"
              >
                Mon Tableau de Bord
              </Link>
              <button
                onClick={handleSignOut}
                className="px-3.5 py-1.5 bg-error/10 hover:bg-error/20 text-error border border-error/25 rounded-full text-xs font-semibold transition-colors cursor-pointer"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-semibold transition-colors text-on-surface-variant hover:text-primary"
              >
                Se connecter
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-xs font-bold rounded-full shadow-md transition-all transform hover:-translate-y-0.5 bg-primary text-on-primary hover:bg-primary-container"
              >
                Créer un compte
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
