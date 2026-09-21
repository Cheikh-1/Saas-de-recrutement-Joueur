import { Link } from 'react-router-dom'
import { Header } from '../../components/Header'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col justify-between">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl flex items-center justify-center text-3xl mb-6 shadow-sm text-primary">
          🔍
        </div>

        <h1 className="text-4xl font-extrabold text-primary tracking-tight mb-3 font-sans">Page introuvable</h1>
        <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <Link
          to="/"
          className="px-6 py-3.5 bg-primary hover:bg-primary-container text-on-primary font-bold text-sm rounded-full shadow-sm transition-all transform hover:-translate-y-0.5"
        >
          Retourner à l'accueil
        </Link>
      </main>

      <footer className="py-6 border-t border-outline-variant/20 text-center text-xs text-on-surface-variant">
        © {new Date().getFullYear()} Teranga Draft. Tous droits réservés.
      </footer>
    </div>
  )
}
