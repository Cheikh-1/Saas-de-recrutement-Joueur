import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Header } from '../../components/Header'
import { getFrenchErrorMessage } from '../../lib/errorUtils'

interface PlayerDetail {
  id: string
  full_name: string | null
  age: number | null
  primary_position: string | null
  height: number | null
  strong_foot: string | null
  availability_status: string | null
  bio: string | null
  video_url: string | null
  avatar_url?: string | null
  status: string | null
}

export function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [player, setPlayer] = useState<PlayerDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [notFound, setNotFound] = useState<boolean>(false)

  // Favorite State
  const [isFavorite, setIsFavorite] = useState<boolean>(false)
  const [togglingFav, setTogglingFav] = useState<boolean>(false)

  // Contact Form State
  const [showContactForm, setShowContactForm] = useState<boolean>(false)
  const [contactMessage, setContactMessage] = useState<string>('')
  const [submittingContact, setSubmittingContact] = useState<boolean>(false)
  const [contactSuccess, setContactSuccess] = useState<string | null>(null)
  const [contactError, setContactError] = useState<string | null>(null)

  // Check initial favorite status from Supabase
  const checkFavoriteStatus = useCallback(async () => {
    if (!user || !id) return

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('recruiter_id', user.id)
        .eq('player_id', id)
        .maybeSingle()

      if (!error && data) {
        setIsFavorite(true)
      } else {
        setIsFavorite(false)
      }
    } catch (err) {
      console.error('Erreur vérification favori:', err)
      setIsFavorite(false)
    }
  }, [user, id])

  useEffect(() => {
    async function fetchPlayerDetail() {
      if (!id) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setLoading(true)
      setNotFound(false)

      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('id', id)
          .eq('status', 'published')
          .maybeSingle()

        if (error || !data) {
          setNotFound(true)
          setPlayer(null)
        } else {
          setPlayer(data)
          await checkFavoriteStatus()

          // Enregistrement d'une vue réelle dans profile_views (une seule fois par session de navigation)
          if (user && data?.id && user.id !== (data as any).owner_id) {
            const sessionKey = `teranga_viewed_${data.id}_${user.id}`
            let alreadyViewed = false
            try {
              alreadyViewed = sessionStorage.getItem(sessionKey) === 'true'
            } catch {
              alreadyViewed = false
            }

            if (!alreadyViewed) {
              try {
                sessionStorage.setItem(sessionKey, 'true')
              } catch {
                // Ignore storage error in private mode
              }

              supabase
                .from('profile_views')
                .insert([
                  {
                    player_id: data.id,
                    recruiter_id: user.id,
                  },
                ])
                .then(
                  ({ error: viewErr }) => {
                    if (viewErr) {
                      console.error('Erreur enregistrement vue profil:', viewErr)
                    }
                  },
                  (err: unknown) => {
                    console.error('Exception enregistrement vue:', err)
                  }
                )
            }
          }
        }
      } catch (err) {
        console.error('Erreur lors de la récupération de la fiche joueur:', err)
        setNotFound(true)
        setPlayer(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerDetail()
  }, [id, checkFavoriteStatus])

  // Toggle Favorite Handler
  const handleToggleFavorite = async () => {
    if (!user || !id) return

    setTogglingFav(true)

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('recruiter_id', user.id)
          .eq('player_id', id)

        if (error) {
          console.error('Erreur suppression favori:', error)
        } else {
          setIsFavorite(false)
        }
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{ recruiter_id: user.id, player_id: id }])
          .select()

        if (error) {
          console.error('Erreur ajout favori:', error)
        } else {
          setIsFavorite(true)
        }
      }
    } catch (err) {
      console.error('Erreur toggle favori:', err)
    } finally {
      setTogglingFav(false)
    }
  }

  // Handle Contact Form Submit
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !id || !contactMessage.trim()) return

    setSubmittingContact(true)
    setContactError(null)
    setContactSuccess(null)

    try {
      const { error } = await supabase
        .from('contact_requests')
        .insert([
          {
            recruiter_id: user.id,
            player_id: id,
            message: contactMessage.trim(),
          },
        ])
        .select()

      if (error) {
        setContactError(getFrenchErrorMessage(error))
      } else {
        setContactSuccess('Demande envoyée avec succès !')
        setContactMessage('')
      }
    } catch (err: any) {
      console.error('Erreur envoi message:', err)
      setContactError(getFrenchErrorMessage(err))
    } finally {
      setSubmittingContact(false)
    }
  }

  const handleBack = () => {
    navigate('/recruiter/dashboard')
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      <Header subtitle="Espace Recruteur - Fiche Joueur" variant="light" />

      <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-5xl w-full mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface rounded-full text-xs font-semibold border border-outline-variant/30 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Retour au catalogue</span>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary font-sans">Fiche Détaillée du Joueur</h1>
              <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[14px] text-outline">account_circle</span>
                <span>Connecté en tant que <strong className="text-primary font-semibold">{user?.email}</strong></span>
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm text-center space-y-3 animate-pulse">
            <div className="text-on-surface-variant font-medium text-sm">Chargement de la fiche joueur...</div>
          </div>
        ) : notFound || !player ? (
          <div className="p-12 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline mx-auto">
              <span className="material-symbols-outlined text-[32px]">person_off</span>
            </div>
            <div className="text-lg font-bold text-primary font-sans">
              Ce profil n'est pas disponible
            </div>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Ce talent a peut-être été retiré de la publication ou n'existe plus dans le catalogue.
            </p>
            <div>
              <button
                onClick={handleBack}
                className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer text-xs inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">search</span>
                <span>Retourner au catalogue</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 bg-surface-container-lowest border border-outline-variant/20 rounded-3xl shadow-sm space-y-8">
            {/* Player Main Info Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant/15 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-container-high border border-primary/20 flex items-center justify-center shrink-0 shadow-md">
                  {player.avatar_url ? (
                    <img
                      src={player.avatar_url}
                      alt={player.full_name || 'Joueur'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[36px] text-on-surface-variant/50 select-none">
                      person
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-0.5 rounded-full bg-secondary/10 text-secondary font-semibold text-xs inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">sports_soccer</span>
                      {player.primary_position || 'Poste non renseigné'}
                    </span>
                    {player.age !== null && player.age !== undefined && (
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-semibold text-xs">
                        {player.age} ans
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-primary font-sans">
                    {player.full_name || 'Joueur sans nom'}
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
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

                {/* Favorite Button */}
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  disabled={togglingFav}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                    isFavorite
                      ? 'bg-rose-500/15 text-rose-600 border-rose-500/30 hover:bg-rose-500/25 shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container hover:text-rose-500'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-rose-500">
                    {isFavorite ? 'favorite' : 'favorite_border'}
                  </span>
                  <span>{togglingFav ? 'Mise à jour...' : isFavorite ? 'Dans mes favoris' : 'Ajouter aux favoris'}</span>
                </button>

                {/* Contact Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowContactForm((prev) => !prev)}
                  className="flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {showContactForm ? 'close' : 'mail'}
                  </span>
                  <span>{showContactForm ? 'Masquer formulaire' : 'Contacter'}</span>
                </button>
              </div>
            </div>

            {/* Contact Form Section */}
            {showContactForm && (
              <div className="p-6 sm:p-7 bg-surface-container-low/70 border border-secondary/30 rounded-3xl space-y-4 shadow-sm animate-fadeIn">
                <div className="flex items-center gap-2.5 pb-2 border-b border-outline-variant/15">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </div>
                  <h3 className="text-base font-bold text-primary font-sans">
                    Envoyer un message officiel à l'académie pour {player.full_name || 'ce joueur'}
                  </h3>
                </div>

                {contactError && (
                  <div className="p-4 bg-error-container border border-error/20 text-on-error-container rounded-2xl text-sm flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-error shrink-0">error</span>
                    <span><strong>Erreur : </strong> {contactError}</span>
                  </div>
                )}

                {contactSuccess && (
                  <div className="p-4 bg-secondary/10 border border-secondary/30 text-secondary rounded-2xl text-sm font-semibold flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-secondary shrink-0">check_circle</span>
                    <span>{contactSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="contactMessage" className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                      Votre message de prise de contact
                    </label>
                    <textarea
                      id="contactMessage"
                      rows={4}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Présentez votre club et la raison de votre prise de contact (ex: proposition d'essai, invitation en stage, demande d'informations complémentaires)..."
                      className="w-full px-5 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl text-on-surface placeholder:text-outline text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="px-5 py-2.5 bg-surface-container-high hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold rounded-full border border-outline-variant/30 transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>

                    <button
                      type="submit"
                      disabled={submittingContact || !contactMessage.trim()}
                      className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      <span>{submittingContact ? 'Envoi en cours...' : 'Transmettre la demande'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-surface-container-low/60 rounded-2xl border border-outline-variant/20">
                <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Âge</div>
                <div className="text-lg font-bold text-primary mt-1">
                  {player.age !== null && player.age !== undefined ? `${player.age} ans` : 'Non renseigné'}
                </div>
              </div>

              <div className="p-4 bg-surface-container-low/60 rounded-2xl border border-outline-variant/20">
                <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Poste principal</div>
                <div className="text-lg font-bold text-primary mt-1">
                  {player.primary_position || 'Non renseigné'}
                </div>
              </div>

              <div className="p-4 bg-surface-container-low/60 rounded-2xl border border-outline-variant/20">
                <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Taille</div>
                <div className="text-lg font-bold text-primary mt-1">
                  {player.height ? `${player.height} cm` : 'Non renseigné'}
                </div>
              </div>

              <div className="p-4 bg-surface-container-low/60 rounded-2xl border border-outline-variant/20">
                <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Pied fort</div>
                <div className="text-lg font-bold text-primary mt-1">
                  {player.strong_foot || 'Non renseigné'}
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-on-surface-variant tracking-wider">
                Biographie &amp; Profil Sportif
              </h3>
              <div className="p-5 bg-surface-container-low/50 rounded-2xl border border-outline-variant/20 text-on-surface text-sm leading-relaxed whitespace-pre-line">
                {player.bio || 'Aucune biographie rédigée pour ce joueur.'}
              </div>
            </div>

            {/* Video Link */}
            {player.video_url && (
              <div className="space-y-3 pt-4 border-t border-outline-variant/15">
                <h3 className="text-xs font-semibold uppercase text-on-surface-variant tracking-wider">
                  Vidéo &amp; Highlights du Joueur
                </h3>
                <div>
                  <a
                    href={player.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/25 rounded-full text-xs font-bold transition-all shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">smart_display</span>
                    <span>Visionner les highlights vidéo</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
