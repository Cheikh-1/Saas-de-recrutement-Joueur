import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Header } from '../../components/Header'
import { PlayerCatalog } from './PlayerCatalog'
import { RecruiterContactRequests } from './RecruiterContactRequests'

export function RecruiterDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Real stats
  const [totalPublishedCount, setTotalPublishedCount] = useState<number | null>(null)
  const [favoritesCount, setFavoritesCount] = useState<number | null>(null)
  const [contactRequestsSentCount, setContactRequestsSentCount] = useState<number | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('inactif')
  const [loadingStats, setLoadingStats] = useState<boolean>(true)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const fetchRecruiterStats = useCallback(async () => {
    if (!user) return

    setLoadingStats(true)
    try {
      // 1. Total published players in catalog
      const publishedPromise = supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')

      // 2. Total favorites for this recruiter
      const favoritesPromise = supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('recruiter_id', user.id)

      // 3. Contact requests sent by this recruiter
      const requestsPromise = supabase
        .from('contact_requests')
        .select('*', { count: 'exact', head: true })
        .eq('recruiter_id', user.id)

      // 4. Recruiter subscription status from recruiter_profiles
      const profilePromise = supabase
        .from('recruiter_profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .maybeSingle()

      const [pubRes, favRes, reqRes, profRes] = await Promise.all([
        publishedPromise,
        favoritesPromise,
        requestsPromise,
        profilePromise,
      ])

      setTotalPublishedCount(pubRes.count ?? 0)
      setFavoritesCount(favRes.count ?? 0)
      setContactRequestsSentCount(reqRes.count ?? 0)

      const status = profRes.data?.subscription_status
      if (status && (status === 'active' || status === 'actif')) {
        setSubscriptionStatus('actif')
      } else if (status) {
        setSubscriptionStatus(status)
      } else {
        setSubscriptionStatus('inactif')
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques du recruteur:', err)
    } finally {
      setLoadingStats(false)
    }
  }, [user])

  useEffect(() => {
    fetchRecruiterStats()
  }, [fetchRecruiterStats])

  const isSubscriptionActive =
    subscriptionStatus === 'actif' ||
    subscriptionStatus === 'active' ||
    subscriptionStatus === 'premium'

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      <Header subtitle="Espace Recruteur" variant="light" />

      <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* 1. En-tête du dashboard recruteur façon "Entête du Dashboard Recruteur" de la maquette */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center text-primary-fixed shadow-md shrink-0">
              <span className="material-symbols-outlined text-[32px]">badge</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                  Saison 2024 / 2025 • Sénégal &amp; Académies
                </span>
                <span className="inline-flex items-center gap-1 text-secondary font-semibold text-xs">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  Flux en direct
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                Espace Recrutement &amp; <span className="text-primary">Détection</span>
              </h1>
              <p className="text-sm text-on-surface-variant flex items-center gap-1.5 font-body">
                <span className="material-symbols-outlined text-[16px] text-outline">account_circle</span>
                <span>
                  Connecté en tant que <strong className="text-white font-semibold">{user?.email}</strong>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => navigate('/recruiter/favorites')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-all shadow-sm text-sm font-semibold cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-rose-500">favorite</span>
              <span>Mes favoris ({favoritesCount ?? 0})</span>
            </button>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-error/10 hover:bg-error-container text-error hover:text-on-error-container border border-error/20 transition-all text-sm font-semibold cursor-pointer"
              type="button"
              title="Se déconnecter"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* 2. Cartes KPI (façon "4 Cartes Statistiques KPI", la 1ère en accent vert forêt inversé) avec chiffres RÉELS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* KPI 1 : Inversé Vert Forêt Sombre - Nombre total de joueurs publiés visibles */}
          <div className="relative overflow-hidden rounded-2xl bg-primary-container text-on-primary p-6 shadow-md flex flex-col justify-between group">
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-secondary-fixed opacity-10 pointer-events-none blur-xl"></div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-primary-container uppercase tracking-wider">
                  Talents disponibles
                </span>
                <div className="w-9 h-9 rounded-full bg-surface-container-lowest/15 flex items-center justify-center text-primary-fixed">
                  <span className="material-symbols-outlined text-[20px]">groups</span>
                </div>
              </div>
              <div className="my-4 flex flex-col">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight leading-none text-on-primary font-sans">
                  {loadingStats ? '...' : totalPublishedCount ?? 0}
                </span>
                <span className="text-xs text-primary-fixed-dim mt-1.5 font-medium">
                  Profils publiés et visibles au catalogue
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-on-primary/15 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-lowest/20 text-secondary-fixed font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed"></span>
                Catalogue actif
              </span>
              <span className="text-on-primary-container font-medium">Données réelles</span>
            </div>
          </div>

          {/* KPI 2 : Nombre de favoris du recruteur */}
          <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Mes talents favoris
                </span>
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-rose-500">
                  <span className="material-symbols-outlined text-[20px]">favorite</span>
                </div>
              </div>
              <div className="my-4 flex flex-col">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight leading-none text-primary font-sans">
                  {loadingStats ? '...' : favoritesCount ?? 0}
                </span>
                <span className="text-xs text-on-surface-variant mt-1.5 font-medium">
                  Joueur{favoritesCount !== 1 ? 's' : ''} dans ma sélection
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-semibold">
                <span className="material-symbols-outlined text-[13px]">star</span>
                Surveillance active
              </span>
              <span className="text-on-surface-variant font-medium">Shortlist</span>
            </div>
          </div>

          {/* KPI 3 : Nombre de demandes de contact envoyées par ce recruteur */}
          <div
            onClick={() => {
              const el = document.getElementById('mes-discussions')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
            className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface-variant group-hover:text-primary transition-colors uppercase tracking-wider">
                  Demandes envoyées
                </span>
                <div className="w-9 h-9 rounded-full bg-surface-container group-hover:bg-primary/10 flex items-center justify-center text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </div>
              </div>
              <div className="my-4 flex flex-col">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight leading-none text-primary font-sans">
                  {loadingStats ? '...' : contactRequestsSentCount ?? 0}
                </span>
                <span className="text-xs text-on-surface-variant mt-1.5 font-medium">
                  Prises de contact transmises
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-semibold">
                <span className="material-symbols-outlined text-[13px]">forum</span>
                Voir les discussions
              </span>
              <span className="text-primary font-semibold flex items-center gap-0.5">
                <span>Accéder</span>
                <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
              </span>
            </div>
          </div>

          {/* KPI 4 : Statut d'abonnement réel (actif/inactif) */}
          <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Statut Abonnement
                </span>
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
                </div>
              </div>
              <div className="my-4 flex flex-col">
                <span className={`text-3xl sm:text-4xl font-bold tracking-tight leading-none font-sans capitalize ${
                  isSubscriptionActive ? 'text-secondary' : 'text-primary'
                }`}>
                  {loadingStats ? '...' : isSubscriptionActive ? 'Actif' : 'Inactif'}
                </span>
                <span className="text-xs text-on-surface-variant mt-1.5 font-medium">
                  {isSubscriptionActive ? 'Accès illimité aux talents' : 'Accès standard découverte'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10 text-xs">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold ${
                isSubscriptionActive
                  ? 'bg-secondary/10 text-secondary'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSubscriptionActive ? 'bg-secondary' : 'bg-outline'}`}></span>
                {isSubscriptionActive ? 'Compte Pro Détection' : 'Formule Standard'}
              </span>
              <span className="text-on-surface-variant font-medium">FSF Scouting</span>
            </div>
          </div>
        </div>

        {/* 2.5 Section Prises de contact & Discussions avec les joueurs */}
        <div id="mes-discussions">
          <RecruiterContactRequests
            onCountChange={(count) => setContactRequestsSentCount(count)}
          />
        </div>

        {/* 3. Catalogue de joueurs (PlayerCatalog) et ses filtres */}
        <main>
          <PlayerCatalog onFavoriteToggled={fetchRecruiterStats} />
        </main>
      </div>
    </div>
  )
}
