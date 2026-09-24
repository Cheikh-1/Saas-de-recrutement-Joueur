import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Header } from '../../components/Header'
import { PlayerProfileForm } from './PlayerProfileForm'
import { PlayerProfilePreview, type PlayerProfileData } from './PlayerProfilePreview'
import { PlayerContactRequests } from './PlayerContactRequests'

export function PlayerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<PlayerProfileData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [togglingStatus, setTogglingStatus] = useState<boolean>(false)

  // Real contact requests count from Supabase
  const [contactRequestsCount, setContactRequestsCount] = useState<number>(0)
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0)

  // Real profile views and favorites counts from Supabase
  const [profileViewsCount, setProfileViewsCount] = useState<number>(0)
  const [favoritesCount, setFavoritesCount] = useState<number>(0)
  const [viewsTrend, setViewsTrend] = useState<{
    thisWeek: number
    previousWeek: number
    direction: 'up' | 'down' | 'flat'
  } | null>(null)

  // Copy Public Link Feedback State
  const [copiedLink, setCopiedLink] = useState<boolean>(false)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('owner_id', user.id)
        .eq('source', 'self')
        .maybeSingle()

      if (error) {
        console.error("Erreur lors du chargement de l'aperçu joueur:", error)
        setProfile(null)
      } else {
        setProfile(data ?? null)

        // Count real contact requests, views, and favorites if player profile exists
        if (data?.id) {
          const { data: requestsData, error: reqError } = await supabase
            .from('contact_requests')
            .select('id, status')
            .eq('player_id', data.id)

          if (!reqError && requestsData) {
            setContactRequestsCount(requestsData.length)
            setPendingRequestsCount(requestsData.filter((r) => r.status === 'pending').length)
          } else {
            setContactRequestsCount(0)
            setPendingRequestsCount(0)
          }

          // Count profile views and calculate 7-day evolution vs previous 7 days
          const { data: viewsRows, count: viewsCount, error: viewsError } = await supabase
            .from('profile_views')
            .select('*', { count: 'exact' })
            .eq('player_id', data.id)

          if (!viewsError && viewsRows) {
            setProfileViewsCount(viewsCount ?? viewsRows.length)

            const now = Date.now()
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
            const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000

            let thisWeek = 0
            let prevWeek = 0

            viewsRows.forEach((row: any) => {
              const timeStr = row.viewed_at || row.created_at
              if (timeStr) {
                const rowTime = new Date(timeStr).getTime()
                const diffTime = now - rowTime
                if (diffTime >= 0 && diffTime <= sevenDaysMs) {
                  thisWeek++
                } else if (diffTime > sevenDaysMs && diffTime <= fourteenDaysMs) {
                  prevWeek++
                }
              }
            })

            if (thisWeek > 0 || prevWeek > 0) {
              let direction: 'up' | 'down' | 'flat' = 'flat'
              if (thisWeek > prevWeek) direction = 'up'
              else if (thisWeek < prevWeek) direction = 'down'

              setViewsTrend({
                thisWeek,
                previousWeek: prevWeek,
                direction,
              })
            } else {
              setViewsTrend(null)
            }
          } else {
            setProfileViewsCount(0)
            setViewsTrend(null)
          }

          // Count favorites received
          const { count: favsCount, error: favsError } = await supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('player_id', data.id)

          if (!favsError && favsCount !== null && favsCount !== undefined) {
            setFavoritesCount(favsCount)
          } else {
            setFavoritesCount(0)
          }
        } else {
          setContactRequestsCount(0)
          setPendingRequestsCount(0)
          setProfileViewsCount(0)
          setFavoritesCount(0)
          setViewsTrend(null)
        }
      }
    } catch (err) {
      console.error('Erreur inattendue:', err)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleProfileUpdated = (updatedProfile: PlayerProfileData) => {
    setProfile(updatedProfile)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const isPublished = profile?.status === 'published'

  const handleToggleStatus = async () => {
    if (!profile?.id) return

    setTogglingStatus(true)
    const nextStatus = isPublished ? 'draft' : 'published'

    try {
      const { data, error } = await supabase
        .from('players')
        .update({ status: nextStatus })
        .eq('id', profile.id)
        .select('*')
        .single()

      if (!error && data) {
        setProfile(data)
      }
    } catch (err) {
      console.error('Erreur changement de statut:', err)
    } finally {
      setTogglingStatus(false)
    }
  }

  const handleRequestsCountChange = useCallback((total: number, pending: number) => {
    setContactRequestsCount(total)
    setPendingRequestsCount(pending)
  }, [])

  const handleShareProfile = async () => {
    if (!profile?.id) return
    const publicUrl = `${window.location.origin}/players/public/${profile.id}`
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(publicUrl)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = publicUrl
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 3000)
    } catch (err) {
      console.error('Erreur copie lien public:', err)
    }
  }

  // Calcul réel de complétion du profil (5 critères stricts de 20% chacun)
  const hasPhoto = Boolean(profile?.avatar_url && profile.avatar_url.trim())
  const hasBio = Boolean(profile?.bio && profile.bio.trim())
  const hasVideo = Boolean(profile?.video_url && profile.video_url.trim())
  const hasHeight =
    profile?.height !== null &&
    profile?.height !== undefined &&
    Number(profile.height) > 0
  const hasFoot = Boolean(profile?.strong_foot && profile.strong_foot.trim())
  const hasPosition = Boolean(profile?.primary_position && profile.primary_position.trim())
  const hasPhysicalAndPosition = Boolean(hasHeight && hasFoot && hasPosition)
  const hasAvailability = Boolean(profile?.availability_status && profile.availability_status.trim())

  const checklistItems = [
    {
      id: 'photo',
      label: 'Photo de profil',
      weight: '20%',
      completed: hasPhoto,
      fieldId: 'avatar_file',
      actionText: 'Ajouter une photo de profil',
      completedText: 'Photo de profil ajoutée',
    },
    {
      id: 'bio',
      label: 'Biographie & parcours',
      weight: '20%',
      completed: hasBio,
      fieldId: 'bio',
      actionText: 'Rédiger une biographie',
      completedText: 'Biographie renseignée',
    },
    {
      id: 'video',
      label: 'Lien vidéo (highlights / matchs)',
      weight: '20%',
      completed: hasVideo,
      fieldId: 'video_url',
      actionText: 'Ajouter un lien vidéo',
      completedText: 'Lien vidéo ajouté',
    },
    {
      id: 'physical_position',
      label: 'Taille, pied fort & poste',
      weight: '20%',
      completed: hasPhysicalAndPosition,
      fieldId: 'primary_position',
      actionText: 'Renseigner taille, pied fort et poste',
      completedText: 'Taille, pied fort et poste renseignés',
    },
    {
      id: 'availability',
      label: 'Statut de disponibilité',
      weight: '20%',
      completed: hasAvailability,
      fieldId: 'availability_status',
      actionText: 'Définir votre statut de disponibilité',
      completedText: 'Statut de disponibilité renseigné',
    },
  ]

  const completedCount = checklistItems.filter((item) => item.completed).length
  const completionPercentage = completedCount * 20

  const handleScrollToField = (fieldId: string) => {
    const el = document.getElementById(fieldId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col">
      {/* Global Header in Light variant */}
      <Header subtitle="Espace Joueur" variant="light" />

      <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-5xl w-full mx-auto space-y-8 animate-fade-in">
        {/* ========================================================================= */}
        {/* 1. Bloc Hero Joueur Valorisant                                           */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/40 p-6 sm:p-8 shadow-xl transition-all duration-300">
          {/* Lueur d'ambiance en arrière-plan */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          {/* Bouton de déconnexion discret au coin supérieur droit */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-error hover:underline transition-colors font-medium py-1 px-2.5 rounded-lg hover:bg-error/10 cursor-pointer"
              title="Se déconnecter"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>

          <div className="relative z-0 flex flex-col xl:flex-row xl:items-center justify-between gap-6 sm:gap-8 pt-4 sm:pt-2 xl:pt-0">
            {/* CÔTÉ GAUCHE : Photo de profil grand format + Nom, Poste et Statut de disponibilité affichés en grand */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-7 text-center sm:text-left">
              {/* Photo de profil en grand format (cercle, bordure accent lime) */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-primary shadow-[0_0_25px_rgba(168,230,0,0.3)] flex-shrink-0 bg-surface-container flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'Joueur'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[48px] sm:text-[56px] text-primary">
                    sports_soccer
                  </span>
                )}
                {/* Pastille discrète de statut actif */}
                <span
                  className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-4 h-4 bg-primary rounded-full border-2 border-surface-container-lowest"
                  title="En ligne"
                />
              </div>

              {/* Informations du joueur */}
              <div className="flex flex-col">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold tracking-wider uppercase">
                    Fiche Officielle
                  </span>
                  {isPublished ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      Profil Public
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Brouillon
                    </span>
                  )}
                </div>

                {/* Nom affiché en grand */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans">
                  {profile?.full_name || user?.email?.split('@')[0] || 'Joueur'}
                </h1>

                {/* Poste et statut de disponibilité affichés en grand */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-2.5">
                  {/* Poste affiché en grand */}
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-extrabold uppercase tracking-wide shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">sports_soccer</span>
                    {profile?.primary_position ? profile.primary_position.toUpperCase() : 'POSTE NON DÉFINI'}
                  </span>

                  {/* Statut de disponibilité affiché en grand */}
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs sm:text-sm font-semibold text-on-surface shadow-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    <span>{profile?.availability_status || 'Disponible'}</span>
                  </span>

                  {profile?.age && (
                    <span className="text-xs sm:text-sm text-on-surface-variant font-medium">
                      • {profile.age} ans
                    </span>
                  )}
                </div>

                {/* Actions principales : Éditer & Partager mon profil */}
                <div className="mt-3.5 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <a
                    href="#formulaire-profil"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/30 text-xs text-primary hover:text-white transition-all font-semibold group cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px] group-hover:rotate-12 transition-transform">edit</span>
                    <span>Modifier ma fiche</span>
                  </a>

                  {profile?.id && (
                    <button
                      type="button"
                      onClick={handleShareProfile}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer border ${
                        copiedLink
                          ? 'bg-secondary-container text-primary border-primary/40'
                          : 'bg-primary text-on-primary hover:bg-primary-container border-primary'
                      }`}
                      title="Copier le lien public vers votre fiche joueur"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {copiedLink ? 'check_circle' : 'share'}
                      </span>
                      <span>{copiedLink ? 'Lien copié !' : 'Partager mon profil'}</span>
                    </button>
                  )}

                  <span className="text-outline-variant hidden sm:inline">•</span>
                  <span className="text-xs text-on-surface-variant hidden sm:inline truncate max-w-[180px]">
                    {user?.email}
                  </span>
                </div>
              </div>
            </div>

            {/* CÔTÉ DROIT : 3 mini-métriques réelles côte à côte */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 w-full xl:w-auto xl:min-w-[420px] pt-4 xl:pt-0 border-t xl:border-t-0 border-outline-variant/20">
              {/* Métrique 1 : Nombre de vues de profil */}
              <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300 text-center shadow-xs">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1.5 shrink-0">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                  {profileViewsCount}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-on-surface mt-0.5 leading-tight">
                  Vues du profil
                </span>
                {/* Évolution : X vues cette semaine (vs 7 jours précédents) ou Total */}
                {viewsTrend ? (
                  <div
                    className="mt-1 flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-bold"
                    title={`${viewsTrend.thisWeek} vue(s) sur les 7 derniers jours vs ${viewsTrend.previousWeek} les 7 jours précédents`}
                  >
                    <span
                      className={
                        viewsTrend.direction === 'up'
                          ? 'text-primary'
                          : viewsTrend.direction === 'down'
                          ? 'text-amber-400'
                          : 'text-on-surface-variant'
                      }
                    >
                      {viewsTrend.thisWeek} vue{viewsTrend.thisWeek > 1 ? 's' : ''} cette semaine
                    </span>
                    {viewsTrend.direction === 'up' && (
                      <span className="material-symbols-outlined text-primary text-[14px]">
                        arrow_upward
                      </span>
                    )}
                    {viewsTrend.direction === 'down' && (
                      <span className="material-symbols-outlined text-amber-400 text-[14px]">
                        arrow_downward
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-on-surface-variant mt-1">
                    Total : {profileViewsCount}
                  </span>
                )}
              </div>

              {/* Métrique 2 : Nombre de favoris reçus */}
              <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-pink-500/40 hover:-translate-y-0.5 transition-all duration-300 text-center shadow-xs">
                <div className="w-8 h-8 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center mb-1.5 shrink-0">
                  <span className="material-symbols-outlined text-[18px]">favorite</span>
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                  {favoritesCount}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-on-surface mt-0.5 leading-tight">
                  Favoris reçus
                </span>
                <span className="text-[10px] text-on-surface-variant mt-0.5 hidden sm:block">
                  Shortlists
                </span>
              </div>

              {/* Métrique 3 : Nombre de demandes de contact reçues */}
              <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300 text-center shadow-xs">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1.5 shrink-0">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                  {contactRequestsCount}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-on-surface mt-0.5 leading-tight">
                  Demandes contact
                </span>
                <span className="text-[10px] text-on-surface-variant mt-0.5 hidden sm:block">
                  {pendingRequestsCount > 0 ? `${pendingRequestsCount} en attente` : 'Reçues'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. Carte "Complétez votre profil" (ou Message Profil 100% complet)        */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="p-6 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl animate-pulse shadow-sm">
            <div className="h-5 w-48 bg-surface-container-high rounded mb-3" />
            <div className="h-3 w-full bg-surface-container-high rounded-full" />
          </div>
        ) : completionPercentage === 100 ? (
          /* État 100% complet : Message positif de valorisation maximale */
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-container-lowest via-surface-container to-surface-container-lowest border border-primary/40 p-5 sm:p-6 shadow-md">
            {/* Lueur d'ambiance */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/15 text-primary border border-primary/30 flex items-center justify-center shrink-0 shadow-inner">
                  <span className="material-symbols-outlined text-[28px]">verified</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-black uppercase tracking-wider">
                      Score 100%
                    </span>
                    <span className="inline-flex items-center gap-1 text-primary text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      Visibilité Maximale
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                    Profil complet, vous êtes visible au maximum par les recruteurs !
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Toutes les informations clés (photo, bio, vidéo, caractéristiques, disponibilité) sont enregistrées et consultables par les scouts.
                  </p>
                </div>
              </div>

              <a
                href="#formulaire-profil"
                onClick={(e) => {
                  e.preventDefault()
                  handleScrollToField('formulaire-profil')
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface hover:text-primary hover:border-primary/40 transition-all shrink-0 cursor-pointer self-start sm:self-auto shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Revoir ma fiche</span>
              </a>
            </div>
          </div>
        ) : (
          /* État < 100% : Progression en pourcentage réel + Checklist détaillée */
          <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-md space-y-5">
            {/* Lueur subtile en arrière-plan */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            {/* En-tête de la carte */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">assignment_turned_in</span>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-white font-sans flex items-center gap-2 flex-wrap">
                    <span>Complétez votre profil</span>
                    <span className="text-xs font-bold text-on-surface-variant px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/20">
                      {completedCount} / 5 critères validés
                    </span>
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Remplissez l'intégralité de vos informations pour maximiser votre attractivité auprès des recruteurs.
                  </p>
                </div>
              </div>

              {/* Pourcentage réel en grand */}
              <div className="flex items-baseline gap-1.5 self-start sm:self-auto bg-surface-container-low px-4 py-2 rounded-2xl border border-outline-variant/30 shadow-xs">
                <span className="text-2xl sm:text-3xl font-black text-primary font-sans tracking-tight">
                  {completionPercentage}%
                </span>
                <span className="text-xs font-semibold text-on-surface-variant">complété</span>
              </div>
            </div>

            {/* Barre de progression avec pourcentage réel */}
            <div className="relative z-10 space-y-1.5">
              <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden p-0.5 border border-outline-variant/20">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(168,230,0,0.5)]"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-on-surface-variant font-medium">
                <span>Indicateur de visibilité auprès des recruteurs</span>
                <span>{100 - completionPercentage}% restants pour atteindre le profil optimal</span>
              </div>
            </div>

            {/* Checklist avec coche verte ou icône grise + lien direct vers le champ */}
            <div className="relative z-10 pt-2 border-t border-outline-variant/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    item.completed
                      ? 'bg-surface-container-low/60 border-primary/20'
                      : 'bg-surface-container-high/30 border-outline-variant/25 hover:border-primary/30'
                  }`}
                >
                  {item.completed ? (
                    <span
                      className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5"
                      title="Critère complété"
                    >
                      check_circle
                    </span>
                  ) : (
                    <span
                      className="material-symbols-outlined text-[20px] text-on-surface-variant/40 shrink-0 mt-0.5"
                      title="Critère manquant"
                    >
                      radio_button_unchecked
                    </span>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">{item.label}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          item.completed
                            ? 'bg-primary/10 text-primary'
                            : 'bg-surface-container-highest text-on-surface-variant'
                        }`}
                      >
                        {item.completed ? 'Validé' : `+${item.weight}`}
                      </span>
                    </div>

                    {item.completed ? (
                      <p className="text-[11px] text-on-surface-variant mt-1 flex items-center gap-1">
                        <span>{item.completedText}</span>
                      </p>
                    ) : (
                      <a
                        href={`#${item.fieldId}`}
                        onClick={(e) => {
                          e.preventDefault()
                          handleScrollToField(item.fieldId)
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-white font-semibold underline underline-offset-2 mt-1 transition-colors cursor-pointer group"
                      >
                        <span>{item.actionText}</span>
                        <span className="material-symbols-outlined text-[13px] group-hover:translate-x-0.5 transition-transform">
                          arrow_forward
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. Section Statistiques & Visibilité (Métriques)                         */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">insights</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white font-sans">
                Statistiques &amp; Visibilité
              </h2>
            </div>
            <span className="text-xs text-on-surface-variant font-medium hidden sm:inline">
              Mises à jour en direct
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Stat 1 : Inverted Hero Card (Fond vert forêt profond) — Statut réel de publication */}
            <div className="relative overflow-hidden rounded-2xl bg-primary-container text-on-primary p-6 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between border border-primary">
              {/* Décoration d'ambiance floutée */}
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-secondary opacity-15 rounded-full blur-2xl pointer-events-none"></div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-primary-container uppercase tracking-wider font-sans">
                    Statut de publication du profil
                  </span>
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-fixed shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">
                      {isPublished ? 'public' : 'edit_note'}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-2xl sm:text-3xl font-extrabold text-on-primary tracking-tight font-sans">
                    {loading ? 'Chargement...' : isPublished ? 'Profil Publié' : 'Mode Brouillon'}
                  </div>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {isPublished ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-on-secondary text-xs font-bold">
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        Visible par les recruteurs
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-neutral-900 text-xs font-bold">
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        Non visible dans le catalogue
                      </span>
                    )}
                    <span className="text-xs text-on-primary-container">
                      {isPublished ? 'Indexé et consultable' : 'En cours de rédaction'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bouton d'action directe de publication & Partage */}
              {profile?.id && (
                <div className="mt-5 pt-4 border-t border-on-primary/15 flex items-center justify-between flex-wrap gap-2.5">
                  <span className="text-xs text-on-primary-container font-medium">
                    {isPublished
                      ? 'Votre profil est indexé et partageable auprès des recruteurs'
                      : 'Publiez pour rendre votre profil visible et partageable'}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isPublished && (
                      <button
                        onClick={handleShareProfile}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-surface-container-lowest text-primary hover:bg-surface-container transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {copiedLink ? 'check' : 'share'}
                        </span>
                        <span>{copiedLink ? 'Lien copié !' : 'Partager le lien public'}</span>
                      </button>
                    )}
                    <button
                      onClick={handleToggleStatus}
                      disabled={togglingStatus}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
                        isPublished
                          ? 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'
                          : 'bg-secondary-container text-primary hover:bg-primary-container'
                      }`}
                      type="button"
                    >
                      {togglingStatus
                        ? 'Mise à jour...'
                        : isPublished
                        ? 'Passer en brouillon'
                        : 'Publier mon profil'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stat 2 : Carte Demandes de contact réelles (façon Scouts intéressés) */}
            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-300 border border-outline-variant/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-sans">
                    Scouts intéressés &amp; Contacts
                  </span>
                  <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight font-sans">
                      {loading ? '—' : contactRequestsCount}
                    </span>
                    <span className="text-sm font-semibold text-on-surface-variant">
                      demande{contactRequestsCount > 1 ? 's' : ''} reçue
                      {contactRequestsCount > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2 text-xs text-on-surface-variant">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        contactRequestsCount > 0 ? 'bg-secondary' : 'bg-outline-variant'
                      }`}
                    ></span>
                    <span>
                      {contactRequestsCount > 0
                        ? `${pendingRequestsCount} en attente de réponse`
                        : 'Aucune demande pour l’instant'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
                <span>Compteur officiel depuis la base de données</span>
                <span className="font-semibold text-primary">
                  {isPublished ? 'Profil actif' : 'Profil masqué'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. Section "Dernières demandes de contact" (vraies demandes Supabase) */}
        {/* ========================================================================= */}
        {profile?.id && (
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-white font-sans">
                  Demandes de contact
                </h2>
              </div>
              {contactRequestsCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold font-sans">
                  {contactRequestsCount} demande{contactRequestsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <PlayerContactRequests
              playerId={profile.id}
              onRequestsCountChange={handleRequestsCountChange}
            />
          </section>
        )}

        {/* ========================================================================= */}
        {/* 5. Section Aperçu de la fiche joueur                                     */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white font-sans">
                Aperçu de votre profil
              </h2>
            </div>
            <span className="text-xs text-on-surface-variant font-medium hidden sm:inline">
              Fiche vue recruteur
            </span>
          </div>
          <PlayerProfilePreview
            profile={profile}
            loading={loading}
            onProfileUpdated={handleProfileUpdated}
          />
        </section>

        {/* ========================================================================= */}
        {/* 6. Formulaire de modification de profil                                  */}
        {/* ========================================================================= */}
        <main className="space-y-4">
          <PlayerProfileForm onProfileSaved={fetchProfile} />
        </main>
      </div>
    </div>
  )
}
