import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Header } from '../../components/Header'
import type { PlayerCatalogItem } from './PlayerCatalog'
import { getFrenchErrorMessage } from '../../lib/errorUtils'

export function FavoritesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [players, setPlayers] = useState<PlayerCatalogItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const fetchFavoritePlayers = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Récupère la liste des player_id favoris pour le recruteur
      const { data: favs, error: favsError } = await supabase
        .from('favorites')
        .select('player_id')
        .eq('recruiter_id', user.id)

      if (favsError) {
        console.error('Erreur lors de la récupération des favoris:', favsError)
        setError(getFrenchErrorMessage(favsError))
        setPlayers([])
        return
      }

      if (!favs || favs.length === 0) {
        setPlayers([])
        return
      }

      const playerIds = favs.map((f: any) => f.player_id).filter(Boolean)

      // 2. Récupère les détails des joueurs correspondant à ces IDs
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .in('id', playerIds)

      if (playersError) {
        console.error('Erreur lors de la récupération des joueurs:', playersError)
        setError(getFrenchErrorMessage(playersError))
        setPlayers([])
      } else {
        setPlayers(playersData || [])
      }
    } catch (err: any) {
      console.error('Erreur inattendue favoris:', err)
      setError(getFrenchErrorMessage(err))
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchFavoritePlayers()
  }, [fetchFavoritePlayers])

  // Retirer des favoris
  const handleRemoveFavorite = async (e: React.MouseEvent, playerId: string) => {
    e.stopPropagation()

    if (!user) return

    setRemovingId(playerId)

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('recruiter_id', user.id)
        .eq('player_id', playerId)

      if (error) {
        console.error('Erreur lors de la suppression du favori:', error)
      } else {
        setPlayers((prev) => prev.filter((p) => p.id !== playerId))
      }
    } catch (err) {
      console.error('Erreur retrait favori:', err)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      <Header subtitle="Mes Favoris" variant="light" />

      <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/recruiter/dashboard')}
              className="px-4 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface rounded-full text-xs font-semibold border border-outline-variant/30 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Retour au catalogue</span>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary font-sans">
                Mes Talents Favoris
              </h1>
              <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[14px] text-outline">account_circle</span>
                <span>Connecté en tant que <strong className="text-primary font-semibold">{user?.email}</strong></span>
              </p>
            </div>
          </div>

          {!loading && !error && (
            <div>
              <span className="text-xs font-semibold px-3.5 py-1.5 bg-rose-500/10 text-rose-600 border border-rose-500/25 rounded-full shadow-xs inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">favorite</span>
                <span>{players.length} favori{players.length !== 1 ? 's' : ''} sauvegardé{players.length !== 1 ? 's' : ''}</span>
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm text-center space-y-3 animate-pulse">
            <div className="text-on-surface-variant font-medium text-sm">Chargement de vos favoris...</div>
          </div>
        ) : error ? (
          <div className="p-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl text-center">
            <div className="p-4 bg-error-container border border-error/20 text-on-error-container rounded-2xl text-sm max-w-lg mx-auto flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-error shrink-0">error</span>
              <span><strong>Erreur : </strong> {error}</span>
            </div>
          </div>
        ) : players.length === 0 ? (
          <div className="p-12 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-1">
              <span className="material-symbols-outlined text-[32px]">favorite</span>
            </div>
            <h3 className="text-lg font-bold text-primary font-sans">Aucun joueur dans vos favoris</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Vous n'avez pas encore ajouté de talents à votre sélection. Parcourez le catalogue et cliquez sur le cœur pour les sauvegarder.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/recruiter/dashboard')}
                className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-full text-xs shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">search</span>
                <span>Explorer le catalogue</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => {
              const isRemovingThis = removingId === player.id

              return (
                <div
                  key={player.id}
                  onClick={() => navigate(`/recruiter/players/${player.id}`)}
                  className="p-6 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-2xl shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 group relative"
                >
                  <div className="space-y-4">
                    {/* Header Card */}
                    <div className="border-b border-outline-variant/15 pb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-surface-container-high border border-primary/20 flex items-center justify-center shrink-0 shadow-xs">
                          {player.avatar_url ? (
                            <img
                              src={player.avatar_url}
                              alt={player.full_name || 'Joueur'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-[24px] text-on-surface-variant/50 select-none">
                              person
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-primary group-hover:text-secondary transition-colors font-sans leading-tight">
                            {player.full_name || 'Joueur sans nom'}
                          </h3>
                          <p className="text-xs text-secondary font-semibold mt-0.5">
                            {player.primary_position || 'Poste non renseigné'}
                            {player.age !== null && player.age !== undefined ? ` • ${player.age} ans` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Remove from Favorite Button */}
                        <button
                          type="button"
                          onClick={(e) => handleRemoveFavorite(e, player.id)}
                          disabled={isRemovingThis}
                          title="Retirer des favoris"
                          className="w-8 h-8 rounded-full border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-all duration-200 text-xs cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isRemovingThis ? 'sync' : 'delete'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Attributes & Details */}
                    <div className="space-y-3 text-xs text-on-surface-variant">
                      <div className="flex items-center justify-between">
                        <span className="text-outline">Statut disponibilité :</span>
                        <span
                          className={`px-3 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 text-[11px] ${
                            player.availability_status === 'Disponible'
                              ? 'bg-secondary/10 text-secondary border border-secondary/25'
                              : 'bg-surface-container text-on-surface-variant border border-outline-variant/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              player.availability_status === 'Disponible'
                                ? 'bg-secondary'
                                : 'bg-outline'
                            }`}
                          ></span>
                          {player.availability_status || 'Inconnu'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-outline">Gabarit & Pied :</span>
                        <span className="font-semibold text-on-surface">
                          {player.height ? `${player.height} cm` : 'Taille N/R'} • {player.strong_foot ? `Pied ${player.strong_foot}` : 'Pied N/R'}
                        </span>
                      </div>

                      {player.bio && (
                        <div className="pt-2 border-t border-outline-variant/15">
                          <p className="text-xs text-on-surface-variant line-clamp-2 italic bg-surface-container-low/60 p-2.5 rounded-xl border border-outline-variant/15">
                            "{player.bio}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-outline-variant/15 flex items-center justify-between text-xs text-primary font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>Consulter la fiche complète</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
