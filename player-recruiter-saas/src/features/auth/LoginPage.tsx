import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Header } from '../../components/Header'
import { getFrenchErrorMessage } from '../../lib/errorUtils'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(getFrenchErrorMessage(signInError))
        setLoading(false)
        return
      }

      if (data.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle()

        const role = profileData?.role

        let redirectUrl = '/'
        if (role === 'player') {
          redirectUrl = '/player/dashboard'
        } else if (role === 'academy') {
          redirectUrl = '/academy/dashboard'
        } else if (role === 'recruiter') {
          redirectUrl = '/recruiter/dashboard'
        } else if (role === 'admin') {
          redirectUrl = '/admin'
        }

        window.location.href = redirectUrl
      }
    } catch (err: any) {
      setError(getFrenchErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col justify-center items-center p-4 py-12">
        <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-sm backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-on-primary font-black text-xl mb-4 shadow-sm">
              TD
            </div>
            <h1 className="text-2xl font-black text-primary tracking-tight font-sans">Connexion</h1>
            <p className="text-on-surface-variant text-sm mt-1">Accédez à votre espace Teranga Draft</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container/60 border border-error/30 rounded-xl text-on-error-container text-sm flex items-start gap-3">
              <span className="text-base leading-none">⚠️</span>
              <div className="flex-1 break-words">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-on-surface-variant mb-1.5">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@domaine.com"
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-on-surface-variant mb-1.5">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary-container text-on-primary rounded-full font-bold tracking-wide shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm cursor-pointer mt-2"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-on-surface-variant">
            Pas encore de compte ?{' '}
            <Link to="/signup" className="text-primary hover:underline font-semibold transition-colors">
              Créer un compte
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
