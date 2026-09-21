import { Link } from 'react-router-dom'
import { Header } from '../../components/Header'

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 bg-error-container/60 text-error rounded-full flex items-center justify-center mx-auto text-3xl mb-2 border border-error/30">
            🚫
          </div>
          <h1 className="text-2xl font-bold text-primary font-sans">Accès non autorisé</h1>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
          </p>
          <Link
            to="/"
            className="inline-block w-full mt-6 py-3 px-4 bg-primary hover:bg-primary-container text-on-primary rounded-full font-bold transition-all text-sm shadow-sm"
          >
            Retourner à l'accueil
          </Link>
        </div>
      </main>
    </div>
  )
}
