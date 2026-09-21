import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Header } from '../../components/Header'
import { supabase } from '../../lib/supabase'

export function AdminNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="space-y-6">
      <Header subtitle="Super Admin Platform" variant="light" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Command & Action Bar */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] uppercase tracking-wider font-bold">
                Plateforme FSF Officielle
              </span>
              <span className="text-on-surface-variant text-xs flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-secondary inline-block animate-pulse"></span>
                Direct Live Dakar GMT
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Administration <span className="text-primary">System</span>
            </h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Supervision générale de l'écosystème footballistique Teranga Draft Sénégal
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* User identity chip */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/20 text-xs">
              <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[10px]">
                <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-on-surface truncate max-w-[170px] sm:max-w-[220px]">
                  {user?.email || 'Administrateur'}
                </span>
                <span className="text-[10px] text-secondary font-bold">Super Admin</span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 h-10 px-4 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-error hover:bg-error/10 border border-outline-variant/20 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Se déconnecter"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="mt-4 flex items-center justify-start overflow-x-auto pb-1">
          <nav className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 p-1.5 rounded-full shadow-sm">
            <Link
              to="/admin"
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                isActive('/admin')
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
              <span>Vue d'ensemble</span>
            </Link>

            <Link
              to="/admin/academies"
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                isActive('/admin/academies')
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">school</span>
              <span>Académies</span>
            </Link>

            <Link
              to="/admin/players"
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                isActive('/admin/players')
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">sports_soccer</span>
              <span>Joueurs</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  )
}

