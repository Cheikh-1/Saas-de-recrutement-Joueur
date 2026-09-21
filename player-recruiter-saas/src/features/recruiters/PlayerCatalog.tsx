import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export interface PlayerCatalogItem {
  id: string
  full_name: string | null
  age: number | null
  primary_position: string | null
  availability_status: string | null
  height?: number | null
  strong_foot?: string | null
  bio?: string | null
  video_url?: string | null
  avatar_url?: string | null
  status?: string | null
  created_at?: string | null
}

const POSITIONS = ['Tous', 'Gardien', 'Défenseur', 'Milieu', 'Attaquant']
const AVAILABILITY_STATUSES = ['Tous', 'Disponible', 'En club', 'Non disponible']

interface PlayerCatalogProps {
  onFavoriteToggled?: () => void
}

export function PlayerCatalog({ onFavoriteToggled }: PlayerCatalogProps = {}) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [players, setPlayers] = useState<PlayerCatalogItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Favorites state: Set of player IDs favorited by current recruiter
  const [favoritePlayerIds, setFavoritePlayerIds] = useState<Set<string>>(new Set())
  const [togglingFavId, setTogglingFavId] = useState<string | null>(null)

  // Filters state
  const [selectedPosition, setSelectedPosition] = useState<string>('Tous')
  const [selectedAvailability, setSelectedAvailability] = useState<string>('Tous')

  // Fetch Favorites
  const fetchFavorites = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('player_id')
        .eq('recruiter_id', user.id)

      if (error) {
        console.error('Erreur lors du chargement des favoris:', error)
      } else if (data) {
        const favSet = new Set<string>(data.map((fav: any) => fav.player_id))
        setFavoritePlayerIds(favSet)
      }
    } catch (err) {
      console.error('Erreur inattendue favoris:', err)
    }
  }, [user])

  // Fetch Published Players with filters
  const fetchPublishedPlayers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('players')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (selectedPosition !== 'Tous') {
        query = query.eq('primary_position', selectedPosition)
      }

      if (selectedAvailability !== 'Tous') {
        query = query.eq('availability_status', selectedAvailability)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erreur lors de la récupération des joueurs filtrés:', error)
        setError(error.message)
        setPlayers([])
      } else {
        setPlayers(data || [])
      }
    } catch (err: any) {
      console.error('Erreur inattendue:', err)
      setError(err.message || 'Une erreur est survenue lors du chargement des joueurs.')
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }, [selectedPosition, selectedAvailability])

  useEffect(() => {
    fetchPublishedPlayers()
  }, [fetchPublishedPlayers])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  // Toggle Favorite
  const handleToggleFavorite = async (e: React.MouseEvent, playerId: string) => {
    e.stopPropagation() // Empêche la redirection vers la fiche détail

    if (!user) return

    setTogglingFavId(playerId)

    const isFav = favoritePlayerIds.has(playerId)

    try {
      if (isFav) {
        // Delete from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('recruiter_id', user.id)
          .eq('player_id', playerId)

        if (error) {
          console.error('Erreur suppression favori:', error)
        } else {
          setFavoritePlayerIds((prev) => {
            const next = new Set(prev)
            next.delete(playerId)
            return next
          })
          onFavoriteToggled?.()
        }
      } else {
        // Insert into favorites
        const { error } = await supabase
          .from('favorites')
          .insert([{ recruiter_id: user.id, player_id: playerId }])
          .select()

        if (error) {
          console.error('Erreur ajout favori:', error)
        } else {
          setFavoritePlayerIds((prev) => {
            const next = new Set(prev)
            next.add(playerId)
            return next
          })
          onFavoriteToggled?.()
        }
      }
    } catch (err) {
      console.error('Erreur toggle favori:', err)
    } finally {
      setTogglingFavId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section of catalog */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">manage_search</span>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white font-sans">Catalogue des <span className="text-primary">Talents</span></h2>
            <p className="text-xs text-on-surface-variant font-body">
              Filtrez et découvrez les pépites sénégalaises homologuées et publiées par les académies
            </p>
          </div>
        </div>

        {/* Real Count Badge */}
        {!loading && !error && (
          <div className="self-start sm:self-auto">
            <span className="text-xs font-semibold px-3.5 py-1.5 bg-secondary/10 text-secondary border border-secondary/25 rounded-full shadow-xs inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">sports_soccer</span>
              <span>{players.length} joueur{players.length !== 1 ? 's' : ''} visible{players.length !== 1 ? 's' : ''}</span>
            </span>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="p-5 sm:p-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Position Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2.5">
              Filtrer par poste
            </label>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((pos) => {
                const isSelected = selectedPosition === pos
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setSelectedPosition(pos)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 border cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    {pos}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2.5">
              Filtrer par statut de disponibilité
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_STATUSES.map((status) => {
                const isSelected = selectedAvailability === status
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedAvailability(status)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 border cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    {status}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-4">
          <div className="text-xs text-on-surface-variant italic">Chargement des joueurs depuis la base...</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="p-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm animate-pulse space-y-4"
              >
                <div className="h-6 bg-surface-container-low rounded-full w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-surface-container-low rounded-full w-1/2"></div>
                  <div className="h-4 bg-surface-container-low rounded-full w-2/3"></div>
                  <div className="h-4 bg-surface-container-low rounded-full w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl text-center">
          <div className="p-4 bg-error-container border border-error/20 text-on-error-container rounded-2xl text-sm max-w-lg mx-auto flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-error shrink-0">error</span>
            <span><strong>Erreur : </strong> {error}</span>
          </div>
        </div>
      ) : players.length === 0 ? (
        <div className="p-12 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-outline mx-auto mb-2">
            <span className="material-symbols-outlined text-[28px]">sports_soccer</span>
          </div>
          <h4 className="text-base font-bold text-primary font-sans">Aucun joueur disponible</h4>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Aucun profil ne correspond à vos filtres actuels ou aucun joueur n'a encore été publié par les académies.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => {
            const isFav = favoritePlayerIds.has(player.id)
            const isTogglingThis = togglingFavId === player.id

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
                        <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors font-sans leading-tight">
                          {player.full_name || 'Joueur sans nom'}
                        </h3>
                        <p className="text-xs text-primary font-semibold mt-0.5">
                          {player.primary_position || 'Poste non renseigné'}
                          {player.age !== null && player.age !== undefined ? ` • ${player.age} ans` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(e, player.id)}
                        disabled={isTogglingThis}
                        title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 text-xs cursor-pointer ${
                          isFav
                            ? 'bg-rose-500/15 text-rose-500 border-rose-500/30 hover:bg-rose-500/25'
                            : 'bg-surface-container-low text-outline border-outline-variant/30 hover:bg-surface-container hover:text-rose-500'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isFav ? 'favorite' : 'favorite_border'}
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
                  <span>Consulter la fiche détaillée</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
