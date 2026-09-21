import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AdminNav } from './AdminNav'

interface StatResult {
  value: number | null
  error: string | null
}

interface AdminStats {
  academies: StatResult
  recruiters: StatResult
  playersTotal: StatResult
  playersPublished: StatResult
  contactRequests: StatResult
}

export function AdminOverview() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState<boolean>(true)
  const [stats, setStats] = useState<AdminStats>({
    academies: { value: null, error: null },
    recruiters: { value: null, error: null },
    playersTotal: { value: null, error: null },
    playersPublished: { value: null, error: null },
    contactRequests: { value: null, error: null },
  })

  useEffect(() => {
    async function fetchAdminStats() {
      setLoading(true)

      const fetchAcademies = async (): Promise<StatResult> => {
        try {
          const { count, error } = await supabase
            .from('academy_profiles')
            .select('*', { count: 'exact', head: true })

          if (error) return { value: null, error: error.message }
          return { value: count ?? 0, error: null }
        } catch (err: any) {
          return { value: null, error: err.message || 'Erreur inconnue' }
        }
      }

      const fetchRecruiters = async (): Promise<StatResult> => {
        try {
          const { count, error } = await supabase
            .from('recruiter_profiles')
            .select('*', { count: 'exact', head: true })

          if (error) return { value: null, error: error.message }
          return { value: count ?? 0, error: null }
        } catch (err: any) {
          return { value: null, error: err.message || 'Erreur inconnue' }
        }
      }

      const fetchPlayersTotal = async (): Promise<StatResult> => {
        try {
          const { count, error } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })

          if (error) return { value: null, error: error.message }
          return { value: count ?? 0, error: null }
        } catch (err: any) {
          return { value: null, error: err.message || 'Erreur inconnue' }
        }
      }

      const fetchPlayersPublished = async (): Promise<StatResult> => {
        try {
          const { count, error } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published')

          if (error) return { value: null, error: error.message }
          return { value: count ?? 0, error: null }
        } catch (err: any) {
          return { value: null, error: err.message || 'Erreur inconnue' }
        }
      }

      const fetchContactRequests = async (): Promise<StatResult> => {
        try {
          const { count, error } = await supabase
            .from('contact_requests')
            .select('*', { count: 'exact', head: true })

          if (error) return { value: null, error: error.message }
          return { value: count ?? 0, error: null }
        } catch (err: any) {
          return { value: null, error: err.message || 'Erreur inconnue' }
        }
      }

      const [academiesRes, recruitersRes, playersTotalRes, playersPublishedRes, contactRequestsRes] =
        await Promise.all([
          fetchAcademies(),
          fetchRecruiters(),
          fetchPlayersTotal(),
          fetchPlayersPublished(),
          fetchContactRequests(),
        ])

      setStats({
        academies: academiesRes,
        recruiters: recruitersRes,
        playersTotal: playersTotalRes,
        playersPublished: playersPublishedRes,
        contactRequests: contactRequestsRes,
      })

      setLoading(false)
    }

    fetchAdminStats()
  }, [])

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans pb-16">
      {/* Top Command Navigation Bar */}
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        {/* Header Title with live pulse */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
              Vue d'ensemble des données
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Métriques et indicateurs clés en temps réel issus de Supabase
            </p>
          </div>
          {loading && (
            <span className="text-xs text-secondary font-semibold flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              Synchronisation des données...
            </span>
          )}
        </div>

        {/* 4 Top KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Card 1: Inverted Hero Pitch Forest KPI (Total Joueurs & Joueurs Publiés) */}
          <div
            onClick={() => navigate('/admin/players')}
            className="relative overflow-hidden rounded-2xl bg-primary-container text-on-primary p-6 shadow-sm flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all"
          >
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-secondary opacity-15 blur-2xl pointer-events-none group-hover:scale-125 transition-transform"></div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary-fixed uppercase tracking-wider">
                  Base de Données Élite
                </span>
                <div className="w-9 h-9 rounded-full bg-surface-container-lowest/10 flex items-center justify-center text-primary-fixed">
                  <span className="material-symbols-outlined text-[20px]">sports_soccer</span>
                </div>
              </div>
              <p className="text-sm text-on-primary-container font-medium mt-2">Total Joueurs Inscrits</p>
              <div className="mt-2 flex items-baseline gap-2">
                {loading ? (
                  <div className="h-10 bg-surface-container-highest/20 rounded-lg animate-pulse w-20"></div>
                ) : stats.playersTotal.error ? (
                  <span className="text-xs text-red-300">{stats.playersTotal.error}</span>
                ) : (
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-primary">
                    {stats.playersTotal.value ?? 0}
                  </span>
                )}
                <span className="text-xs text-primary-fixed font-semibold">talents</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-on-primary/15 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-secondary-fixed font-semibold">
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>
                  {loading
                    ? '...'
                    : `${stats.playersPublished.value ?? 0} publié${
                        (stats.playersPublished.value ?? 0) > 1 ? 's' : ''
                      }`}
                </span>
              </div>
              <span className="text-xs text-primary-fixed group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Modérer <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
          </div>

          {/* Card 2: Profils Académies */}
          <div
            onClick={() => navigate('/admin/academies')}
            className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-6 shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Centres Conventionnés
                </span>
                <div className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center text-primary group-hover:bg-primary-fixed group-hover:text-on-primary-fixed transition-colors">
                  <span className="material-symbols-outlined text-[20px]">school</span>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant font-medium mt-2">Profils Académies</p>
              <div className="mt-2 flex items-baseline gap-2">
                {loading ? (
                  <div className="h-10 bg-surface-container-low rounded-lg animate-pulse w-20"></div>
                ) : stats.academies.error ? (
                  <span className="text-xs text-red-600">{stats.academies.error}</span>
                ) : (
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary">
                    {stats.academies.value ?? 0}
                  </span>
                )}
                <span className="text-xs text-on-surface-variant font-medium">pôles enregistrés</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-outline-variant/15 flex items-center justify-between">
              <span className="text-xs text-secondary font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                Centres partenaires
              </span>
              <span className="text-xs text-primary font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                Certifier <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
          </div>

          {/* Card 3: Profils Recruteurs */}
          <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Réseau International
                </span>
                <div className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">travel_explore</span>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant font-medium mt-2">Profils Recruteurs</p>
              <div className="mt-2 flex items-baseline gap-2">
                {loading ? (
                  <div className="h-10 bg-surface-container-low rounded-lg animate-pulse w-20"></div>
                ) : stats.recruiters.error ? (
                  <span className="text-xs text-red-600">{stats.recruiters.error}</span>
                ) : (
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary">
                    {stats.recruiters.value ?? 0}
                  </span>
                )}
                <span className="text-xs text-secondary font-semibold">scouts & clubs</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-outline-variant/15 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-secondary">verified_user</span>
                Accréditations vérifiées
              </span>
              <span className="text-xs text-on-surface-variant font-medium">Actifs</span>
            </div>
          </div>

          {/* Card 4: Demandes de contact */}
          <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Mises en Relation
                </span>
                <div className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant font-medium mt-2">Demandes de Contact</p>
              <div className="mt-2 flex items-baseline gap-2">
                {loading ? (
                  <div className="h-10 bg-surface-container-low rounded-lg animate-pulse w-20"></div>
                ) : stats.contactRequests.error ? (
                  <span className="text-xs text-red-600">{stats.contactRequests.error}</span>
                ) : (
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary">
                    {stats.contactRequests.value ?? 0}
                  </span>
                )}
                <span className="text-xs text-on-surface-variant font-medium">sollicitations</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-outline-variant/15 flex items-center justify-between">
              <span className="text-xs text-secondary font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">forward_to_inbox</span>
                Interactions directes
              </span>
              <span className="text-xs text-on-surface-variant font-medium">Enregistrées</span>
            </div>
          </div>
        </div>

        {/* Quick Management Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Action Module: Académies */}
          <div
            onClick={() => navigate('/admin/academies')}
            className="p-6 sm:p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">school</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-primary group-hover:text-primary-container transition-colors">
                  Gestion des Académies
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                  Consulter la liste complète des académies partenaires et basculer leur statut d'homologation officielle.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-bold shrink-0 hover:bg-primary-container transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>Accéder</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          {/* Action Module: Joueurs */}
          <div
            onClick={() => navigate('/admin/players')}
            className="p-6 sm:p-7 rounded-3xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">shield</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-primary group-hover:text-primary-container transition-colors">
                  Modération des Joueurs
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                  Gérer la visibilité des fiches talents, masquer les profils non conformes ou réactiver les publications.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-bold shrink-0 hover:bg-primary-container transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>Accéder</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

