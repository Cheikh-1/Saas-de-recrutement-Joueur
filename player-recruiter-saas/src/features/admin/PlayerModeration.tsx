import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { AdminNav } from './AdminNav'
import { getFrenchErrorMessage } from '../../lib/errorUtils'

export interface AdminPlayerItem {
  id: string
  full_name: string | null
  source: string | null
  status: string | null
  primary_position: string | null
  age: number | null
  created_at?: string | null
}

export function PlayerModeration() {
  const [players, setPlayers] = useState<AdminPlayerItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchAllPlayers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors du chargement des joueurs:', error)
        setError(getFrenchErrorMessage(error))
        setPlayers([])
      } else {
        setPlayers(data || [])
      }
    } catch (err: any) {
      console.error('Erreur inattendue:', err)
      setError(getFrenchErrorMessage(err))
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllPlayers()
  }, [fetchAllPlayers])

  const handleToggleStatus = async (player: AdminPlayerItem) => {
    setTogglingId(player.id)
    setActionError(null)

    const nextStatus = player.status === 'hidden' ? 'published' : 'hidden'

    try {
      const { data, error } = await supabase
        .from('players')
        .update({ status: nextStatus })
        .eq('id', player.id)
        .select()
        .single()

      if (error) {
        console.error('Erreur Supabase lors du changement de statut:', error)
        setActionError(getFrenchErrorMessage(error))
      } else if (data) {
        setPlayers((prev) =>
          prev.map((item) =>
            item.id === player.id ? { ...item, status: data.status } : item
          )
        )
      }
    } catch (err: any) {
      console.error('Erreur inattendue:', err)
      setActionError(getFrenchErrorMessage(err))
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans pb-16">
      {/* Top Command Navigation Bar */}
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] uppercase tracking-wider font-bold">
                Sécurité & Conformité des Données
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">shield</span>
              Modération des Joueurs
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Gérez la publication et la visibilité publique des fiches talents dans le catalogue des recruteurs
            </p>
          </div>

          {!loading && !error && (
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                {players.length} profil{players.length > 1 ? 's' : ''} analysé{players.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Action Error Notification */}
        {actionError && (
          <div className="p-4 bg-error-container/60 border border-error/30 text-on-error-container rounded-2xl text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-[22px]">warning</span>
            <div>
              <strong className="font-semibold">Erreur de modération :</strong> {actionError}
            </div>
          </div>
        )}

        {/* Loading Error */}
        {error && (
          <div className="p-4 bg-error-container/60 border border-error/30 text-on-error-container rounded-2xl text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-[22px]">error</span>
            <div>
              <strong className="font-semibold">Erreur de chargement :</strong> {error}
            </div>
          </div>
        )}

        {/* Content Table / Cards */}
        {loading ? (
          <div className="p-12 bg-surface-container-lowest border border-outline-variant/20 rounded-3xl text-center space-y-3 shadow-sm">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-on-surface-variant font-medium">Chargement des fiches joueurs...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="p-12 bg-surface-container-lowest border border-outline-variant/20 rounded-3xl text-center space-y-2 shadow-sm">
            <span className="material-symbols-outlined text-outline text-[40px]">groups</span>
            <h3 className="text-base font-bold text-on-surface">Aucun joueur trouvé</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Aucun profil de joueur n'a encore été créé dans l'application.
            </p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low text-xs uppercase text-on-surface-variant font-bold border-b border-outline-variant/20 tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Nom Joueur</th>
                    <th className="py-4 px-6">Origine / Source</th>
                    <th className="py-4 px-6">Poste / Âge</th>
                    <th className="py-4 px-6">Statut Actuel</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {players.map((item) => {
                    const isHidden = item.status === 'hidden'
                    const isPublished = item.status === 'published'
                    const isToggling = togglingId === item.id
                    const displayName = item.full_name || 'Joueur sans nom'
                    const initials = displayName
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w: string) => w[0]?.toUpperCase())
                      .join('') || 'JR'

                    return (
                      <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                        {/* Player Name & Avatar Bubble */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-container text-primary-fixed flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {initials}
                            </div>
                            <div>
                              <span className="font-bold text-primary block leading-tight">
                                {displayName}
                              </span>
                              <span className="text-[11px] text-on-surface-variant">
                                ID: {item.id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Source */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              item.source === 'academy'
                                ? 'bg-primary-fixed/40 text-on-primary-fixed-variant border border-primary-fixed'
                                : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/25'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {item.source === 'academy' ? 'school' : 'person'}
                            </span>
                            <span className="capitalize">{item.source === 'academy' ? 'Académie' : 'Candidat libre'}</span>
                          </span>
                        </td>

                        {/* Poste / Âge */}
                        <td className="py-4 px-6 text-on-surface-variant font-medium">
                          <div>
                            <span className="font-semibold text-on-surface">
                              {item.primary_position || 'Poste non spécifié'}
                            </span>
                            {item.age !== null && item.age !== undefined && (
                              <span className="text-xs text-on-surface-variant ml-1.5 font-normal">
                                • {item.age} ans
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-6">
                          {isPublished ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-secondary-container/30 text-on-secondary-container border border-secondary/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                              ✓ Publié
                            </span>
                          ) : isHidden ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-error-container text-on-error-container border border-error/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                              ✕ Masqué
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Brouillon
                            </span>
                          )}
                        </td>

                        {/* Action Pill Button */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleToggleStatus(item)}
                            disabled={isToggling}
                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                              isHidden
                                ? 'bg-primary hover:bg-primary-container text-on-primary shadow-sm'
                                : 'border border-error/30 text-error hover:bg-error/10 shadow-xs'
                            }`}
                          >
                            {isToggling ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                <span>Traitement...</span>
                              </>
                            ) : isHidden ? (
                              <>
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                <span>Republier le profil</span>
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                                <span>Masquer le profil</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

