import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Header } from '../../components/Header'
import { getFrenchErrorMessage } from '../../lib/errorUtils'

type Role = 'player' | 'academy' | 'recruiter'

interface RoleOption {
  id: Role
  label: string
  description: string
  icon: string
}

const ROLES: RoleOption[] = [
  {
    id: 'player',
    label: 'Joueur',
    description: 'Développez votre carrière et faites-vous repérer',
    icon: 'sports_soccer',
  },
  {
    id: 'academy',
    label: 'Académie',
    description: 'Gérez vos talents et mettez en avant vos jeunes',
    icon: 'stadium',
  },
  {
    id: 'recruiter',
    label: 'Recruteur',
    description: 'Découvrez les meilleurs talents pour votre club',
    icon: 'travel_explore',
  },
]

export function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('player')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailVerificationNeeded, setEmailVerificationNeeded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
          },
        },
      })

      if (signUpError) {
        setError(getFrenchErrorMessage(signUpError))
        setLoading(false)
        return
      }

      if (data.user && !data.session) {
        setEmailVerificationNeeded(true)
      } else if (data.session) {
        window.location.href = `/${role}/dashboard`
      }
    } catch (err: any) {
      setError(getFrenchErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (emailVerificationNeeded) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2 border border-primary/25">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-primary font-sans">Vérifiez votre boîte mail</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Un e-mail de confirmation a été envoyé à <span className="font-semibold text-primary">{email}</span>.
              Veuillez cliquer sur le lien pour activer votre compte.
            </p>
            <button
              onClick={() => {
                setEmailVerificationNeeded(false)
                setEmail('')
                setPassword('')
              }}
              className="w-full mt-6 py-2.5 px-4 bg-surface-container-low hover:bg-surface-container-high text-on-surface rounded-full font-medium transition-colors text-sm cursor-pointer border border-outline-variant/30"
            >
              Retour à l'inscription
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col justify-center items-center p-4 py-12">
        <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-sm backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-on-primary font-black text-xl mb-4 shadow-sm">
              TD
            </div>
            <h1 className="text-2xl font-black text-primary tracking-tight font-sans">Créer un compte</h1>
            <p className="text-on-surface-variant text-sm mt-1">Rejoignez Teranga Draft et sélectionnez votre profil</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container/60 border border-error/30 rounded-xl text-on-error-container text-sm flex items-start gap-3">
              <span className="text-base leading-none">⚠️</span>
              <div className="flex-1 break-words">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélecteur de rôle */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
                Choisissez votre rôle
              </label>
              <div className="grid grid-cols-1 gap-3">
                {ROLES.map((r) => {
                  const isSelected = role === r.id
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`flex items-center p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary/10 border-primary text-on-surface shadow-sm'
                          : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3.5 border shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-primary/20 text-primary border-primary/40'
                            : 'bg-primary/10 text-primary border-primary/20'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[22px] select-none">
                          {r.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{r.label}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">{r.description}</div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ml-2 transition-colors ${
                          isSelected ? 'border-primary bg-primary' : 'border-outline-variant/40'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-on-primary" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Formulaire Email + Mot de passe */}
            <div className="space-y-4">
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
            </div>

            {/* Bouton de Soumission */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary-container text-on-primary rounded-full font-bold tracking-wide shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm cursor-pointer"
            >
              {loading ? 'Création du compte...' : "S'inscrire"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-on-surface-variant">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold transition-colors">
              Se connecter
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
