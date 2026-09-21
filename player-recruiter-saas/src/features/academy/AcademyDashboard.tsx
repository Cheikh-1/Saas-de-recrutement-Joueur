import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Header } from '../../components/Header'
import { AddPlayerForm, type PlayerRecord } from './AddPlayerForm'
import { AcademyContactRequests } from './AcademyContactRequests'
import { getFrenchErrorMessage } from '../../lib/errorUtils'

export function AcademyDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [players, setPlayers] = useState<PlayerRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Real contact requests count
  const [contactRequestsCount, setContactRequestsCount] = useState<number>(0)

  // Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false)
  const [editingPlayer, setEditingPlayer] = useState<PlayerRecord | null>(null)

  // Toggle Loading State per Player ID
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const fetchAcademyPlayers = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('academy_id', user.id)
        .eq('source', 'academy')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors du chargement des joueurs de l\'académie:', error)
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
  }, [user?.id])

  useEffect(() => {
    fetchAcademyPlayers()
  }, [fetchAcademyPlayers])

  const handlePlayerSaved = () => {
    fetchAcademyPlayers()
    setShowAddForm(false)
    setEditingPlayer(null)
  }

  const handleEditClick = (player: PlayerRecord) => {
    setEditingPlayer(player)
    setShowAddForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggleStatus = async (player: PlayerRecord) => {
    if (!player.id || !user?.id) return

    setTogglingId(player.id)
    setActionError(null)

    const isPublished = player.status === 'published'
    const nextStatus = isPublished ? 'draft' : 'published'

    try {
      const { data, error } = await supabase
        .from('players')
        .update({ status: nextStatus })
        .eq('id', player.id)
        .eq('academy_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Erreur lors du changement de statut du joueur:', error)
        setActionError(getFrenchErrorMessage(error))
      } else if (data) {
        setPlayers((prev) =>
          prev.map((item) =>
            item.id === player.id ? { ...item, status: data.status } : item
          )
        )
      }
    } catch (err: any) {
      console.error('Erreur toggle statut:', err)
      setActionError(getFrenchErrorMessage(err))
    } finally {
      setTogglingId(null)
    }
  }

  // Real Counts
  const totalPlayersCount = players.length
  const publishedPlayersCount = players.filter((p) => p.status === 'published').length
  const draftPlayersCount = totalPlayersCount - publishedPlayersCount

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      <Header subtitle="Espace Académie" variant="light" />

      <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* 1. En-tête de l'académie restylé façon "Entête de l'Académie" de la maquette */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center text-primary-fixed shadow-md shrink-0">
              <span className="material-symbols-outlined text-[32px]">domain</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-semibold text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-secondary">verified</span> Espace Officiel Homologué FSF
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-semibold text-xs">
                  Saison 2024 / 2025
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                  Espace <span className="text-primary">Académie</span>
                </h1>
              </div>
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
              onClick={() => {
                if (showAddForm) {
                  setShowAddForm(false)
                  setEditingPlayer(null)
                } else {
                  setEditingPlayer(null)
                  setShowAddForm(true)
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary-container transition-all font-semibold text-sm shadow-md hover:shadow-lg cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showAddForm ? 'close' : 'person_add'}
              </span>
              <span>{showAddForm ? 'Fermer le formulaire' : '+ Inscrire un Jeune Joueur'}</span>
            </button>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-error/10 hover:bg-error-container text-error hover:text-on-error-container border border-error/20 transition-all font-semibold text-sm cursor-pointer"
              type="button"
              title="Se déconnecter"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* 2, 3, 4. Cartes Métriques (Rythme de la maquette avec count réel Supabase) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Carte 1 (Hero Accent Pitch Forest) - Nombre RÉEL de joueurs rattachés */}
          <div className="relative overflow-hidden rounded-2xl bg-primary-container text-on-primary p-6 shadow-md flex flex-col justify-between group">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-secondary-container opacity-15 pointer-events-none blur-2xl transition-transform group-hover:scale-125"></div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-primary-container uppercase tracking-wider">
                  Effectif sous contrat
                </span>
                <div className="w-9 h-9 rounded-full bg-surface-container-lowest/15 flex items-center justify-center text-primary-fixed">
                  <span className="material-symbols-outlined text-[20px]">groups_3</span>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-bold text-on-primary tracking-tight">
                  {loading ? '...' : totalPlayersCount}
                </span>
                <span className="text-xs text-primary-fixed-dim font-medium">pensionnaires</span>
              </div>
            </div>
            <div className="mt-5 pt-3 flex items-center justify-between border-t border-on-primary/15">
              <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest/20 text-xs text-primary-fixed flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed"></span> 100% rattachés
              </span>
              <span className="text-xs text-on-primary-container font-medium">
                Total académie
              </span>
            </div>
          </div>

          {/* Carte 2 - Nombre RÉEL de joueurs publiés */}
          <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Profils certifiés FSF
                </span>
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-bold text-primary tracking-tight">
                  {loading ? '...' : publishedPlayersCount}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">
                  / {totalPlayersCount} validés
                </span>
              </div>
            </div>
            <div className="mt-5 pt-3 flex items-center justify-between border-t border-outline-variant/10">
              <span className="px-2.5 py-1 rounded-full bg-secondary/10 text-xs text-secondary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                {totalPlayersCount > 0
                  ? `${Math.round((publishedPlayersCount / totalPlayersCount) * 100)}% homologués`
                  : '0% homologués'}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                {draftPlayersCount} en brouillon
              </span>
            </div>
          </div>

          {/* Carte 3 - Nombre RÉEL de demandes de contact reçues au total */}
          <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Demandes de recruteurs
                </span>
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">contact_mail</span>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-bold text-primary tracking-tight">
                  {contactRequestsCount}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">dossiers actifs</span>
              </div>
            </div>
            <div className="mt-5 pt-3 flex items-center justify-between border-t border-outline-variant/10">
              <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-xs text-on-surface flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span> Intérêt recruteurs
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                {contactRequestsCount} reçu{contactRequestsCount !== 1 ? 's' : ''} au total
              </span>
            </div>
          </div>
        </div>

        {/* 7. Formulaire d'ajout/édition de joueur (si ouvert) */}
        {showAddForm && (
          <section className="animate-fadeIn">
            <AddPlayerForm
              initialData={editingPlayer}
              onPlayerAdded={handlePlayerSaved}
              onCancel={() => {
                setShowAddForm(false)
                setEditingPlayer(null)
              }}
            />
          </section>
        )}

        {/* Action Error notification */}
        {actionError && (
          <div className="p-4 bg-error-container border border-error/20 text-on-error-container rounded-2xl text-sm flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-error shrink-0">error</span>
            <span><strong>Erreur d'action : </strong> {actionError}</span>
          </div>
        )}

        {/* 5. La liste "Vos Joueurs Rattachés" (tableau nom/poste/âge/statut/actions) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">groups</span>
              </div>
              <h2 className="text-xl font-bold text-primary font-sans">
                Vos Joueurs Rattachés
              </h2>
            </div>
            {!loading && !error && (
              <span className="text-xs font-bold px-3 py-1 bg-secondary/10 text-secondary border border-secondary/25 rounded-full">
                {players.length} joueur{players.length !== 1 ? 's' : ''} enregistré{players.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {error && (
            <div className="p-4 bg-error-container border border-error/20 text-on-error-container rounded-2xl text-sm flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-error shrink-0">error</span>
              <span><strong>Erreur : </strong> {error}</span>
            </div>
          )}

          {loading ? (
            <div className="p-8 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl text-center text-on-surface-variant animate-pulse shadow-sm">
              Chargement de l'effectif rattaché...
            </div>
          ) : players.length === 0 ? (
            <div className="p-12 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-surface-container flex items-center justify-center text-primary mx-auto">
                <span className="material-symbols-outlined text-[36px]">sports_soccer</span>
              </div>
              <h3 className="text-lg font-bold text-primary font-sans">Aucun joueur dans votre académie</h3>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                Commencez à référencer vos jeunes pépites pour leur donner de la visibilité auprès des recruteurs pros.
              </p>
              <div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-full text-xs shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  <span>Ajouter mon premier joueur</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-on-surface">
                  <thead className="bg-surface-container-low text-xs uppercase text-on-surface-variant font-bold border-b border-outline-variant/20 tracking-wider">
                    <tr>
                      <th className="py-4 px-6">Nom</th>
                      <th className="py-4 px-6">Poste / Âge</th>
                      <th className="py-4 px-6">Disponibilité</th>
                      <th className="py-4 px-6">Statut Publication</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15">
                    {players.map((player) => {
                      const isPublished = player.status === 'published'
                      const isToggling = togglingId === player.id

                      return (
                        <tr key={player.id} className="hover:bg-surface-container-low/60 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-container-high border border-primary/20 flex items-center justify-center shrink-0 shadow-xs">
                                {player.avatar_url ? (
                                  <img
                                    src={player.avatar_url}
                                    alt={player.full_name || 'Joueur'}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant/50 select-none">
                                    person
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-primary">
                                {player.full_name || 'Sans nom'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-on-surface-variant font-medium">
                            {player.primary_position || 'Non spécifié'}
                            {player.age !== null && player.age !== undefined ? ` • ${player.age} ans` : ''}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
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
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                                isPublished
                                  ? 'bg-secondary-container/40 text-on-secondary-container border border-secondary/30'
                                  : 'bg-amber-500/10 text-amber-800 border border-amber-500/25'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {isPublished ? 'check_circle' : 'edit_document'}
                              </span>
                              {isPublished ? 'Publié' : 'Brouillon'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Publish / Unpublish Toggle */}
                              <button
                                onClick={() => handleToggleStatus(player)}
                                disabled={isToggling}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1 ${
                                  isPublished
                                    ? 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30'
                                    : 'bg-primary hover:bg-primary-container text-on-primary border-primary shadow-xs'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  {isToggling ? 'sync' : isPublished ? 'visibility_off' : 'visibility'}
                                </span>
                                <span>{isToggling ? '...' : isPublished ? 'Retirer' : 'Publier'}</span>
                              </button>

                              {/* Edit Player Button */}
                              <button
                                onClick={() => handleEditClick(player)}
                                className="px-3.5 py-1.5 bg-surface-container-low hover:bg-surface-container text-primary font-semibold rounded-full text-xs border border-outline-variant/30 transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                <span>Modifier</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* 6. Section "Demandes de contact reçues" restylée en liste de cartes façon maquette */}
        {user?.id && (
          <section>
            <AcademyContactRequests
              academyId={user.id}
              onCountChange={setContactRequestsCount}
            />
          </section>
        )}
      </div>
    </div>
  )
}
