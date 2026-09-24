import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Header } from '../../components/Header'

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

export function PublicPlayerDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [player, setPlayer] = useState<PlayerDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [notFound, setNotFound] = useState<boolean>(false)

  useEffect(() => {
    async function fetchPublicPlayer() {
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

          // Enregistrement d'une vue de profil anonyme/publique si possible
          supabase
            .from('profile_views')
            .insert([{ player_id: data.id }])
            .then(
              () => {},
              () => {}
            )
        }
      } catch (err) {
        console.error('Erreur chargement profil public:', err)
        setNotFound(true)
        setPlayer(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPublicPlayer()
  }, [id])

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      <Header subtitle="Fiche Publique Officielle" variant="light" />

      <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-5xl w-full mx-auto space-y-6">
        {/* Navigation & Header Public */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface rounded-full text-xs font-semibold border border-outline-variant/30 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Accueil Teranga Draft</span>
            </Link>
            <div className="hidden sm:block">
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold uppercase tracking-wider">
                Fiche Publique
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-on-surface-variant hidden md:inline">
              Accès recruteur ou club ?
            </span>
            <Link
              to="/login"
              className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold rounded-full transition-all shadow-sm inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Connexion Recruteur</span>
            </Link>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm text-center space-y-3 animate-pulse">
            <div className="text-on-surface-variant font-medium text-sm">
              Chargement de la fiche joueur en cours...
            </div>
          </div>
        ) : notFound || !player ? (
          <div className="p-12 sm:p-16 bg-surface-container-lowest border border-outline-variant/20 rounded-3xl shadow-sm text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline mx-auto shadow-inner">
              <span className="material-symbols-outlined text-[32px]">person_off</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-primary font-sans">
                Ce profil n'est pas disponible
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto mt-2">
                Ce joueur a été placé en mode brouillon par son titulaire ou n'est plus accessible
                au public.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/"
                className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-full shadow-md hover:shadow-lg transition-all text-xs inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">home</span>
                <span>Retour à l'accueil</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 bg-surface-container-lowest border border-outline-variant/20 rounded-3xl shadow-sm space-y-8">
            {/* Player Main Info Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant/15 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-surface-container-high border-2 border-primary/30 flex items-center justify-center shrink-0 shadow-md">
                  {player.avatar_url ? (
                    <img
                      src={player.avatar_url}
                      alt={player.full_name || 'Joueur'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[36px] text-on-surface-variant/50 select-none">
                      sports_soccer
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-3 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 font-bold text-xs inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">sports_soccer</span>
                      {player.primary_position || 'Poste non renseigné'}
                    </span>
                    {player.age !== null && player.age !== undefined && (
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-semibold text-xs">
                        {player.age} ans
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
                    {player.full_name || 'Joueur Teranga'}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                    player.availability_status === 'Disponible'
                      ? 'bg-secondary-container text-on-secondary-container border border-primary/30'
                      : 'bg-surface-container text-on-surface-variant border border-outline-variant/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      player.availability_status === 'Disponible' ? 'bg-primary' : 'bg-outline'
                    }`}
                  />
                  {player.availability_status || 'Disponible'}
                </span>
              </div>
            </div>

            {/* Bandeau d'incitation Recruteur : remplace les boutons favoris/contact */}
            <div className="relative overflow-hidden p-5 sm:p-6 bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low border border-primary/30 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-primary/15 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">badge</span>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Vous êtes recruteur ?
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Connectez-vous pour contacter ce joueur et l'ajouter à vos listes de détection.
                  </p>
                </div>
              </div>

              <Link
                to="/login"
                className="px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs rounded-full shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">lock_open</span>
                <span>Se connecter pour contacter</span>
              </Link>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-surface-container-low/60 rounded-2xl border border-outline-variant/20">
                <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Âge
                </div>
                <div className="text-lg font-bold text-primary mt-1">
                  {player.age !== null && player.age !== undefined
                    ? `${player.age} ans`
                    : 'Non renseigné'}
                </div>
              </div>

              <div className="p-4 bg-surface-container-low/60 rounded-2xl border border-outline-variant/20">
                <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Poste principal
                </div>
                <div className="text-lg font-bold text-primary mt-1">
                  {player.primary_position || 'Non renseigné'}
                </div>
              </div>

              <div className="p-4 bg-surface-container-low/60 rounded-2xl border border-outline-variant/20">
                <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Taille
                </div>
                <div className="text-lg font-bold text-primary mt-1">
                  {player.height ? `${player.height} cm` : 'Non renseigné'}
                </div>
              </div>

              <div className="p-4 bg-surface-container-low/60 rounded-2xl border border-outline-variant/20">
                <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Pied fort
                </div>
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
                    className="inline-flex items-center gap-2 px-6 py-3 bg-secondary-container hover:bg-primary-container text-primary hover:text-on-primary-container border border-primary/30 rounded-full text-xs font-bold transition-all shadow-xs"
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
