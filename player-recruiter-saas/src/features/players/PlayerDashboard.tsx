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

        // Count real contact requests if player profile exists
        if (data?.id) {
          const { data: requestsData, error: reqError } = await supabase
            .from('contact_requests')
            .select('id, status')
            .eq('player_id', data.id)

          if (!reqError && requestsData) {
            setContactRequestsCount(requestsData.length)
            setPendingRequestsCount(requestsData.filter((r) => r.status === 'pending').length)
          }
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

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col">
      {/* Global Header in Light variant */}
      <Header subtitle="Espace Joueur" variant="light" />

      <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-5xl w-full mx-auto space-y-6">
        {/* ========================================================================= */}
        {/* 1. En-tête personnalisé (façon En-tête Joueur Personnalisé de la maquette) */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
          <div className="flex items-center gap-4">
            {/* Avatar / Badge de profil avec pastille active */}
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0 shadow-sm font-bold text-xl border border-primary/20">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Joueur'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-[32px] text-primary-fixed">
                  sports_soccer
                </span>
              )}
              <span
                className="absolute bottom-0 right-0 w-4 h-4 bg-secondary rounded-full border-2 border-surface-container-lowest"
                title="Connecté"
              ></span>
            </div>

            {/* Identité du joueur connecté */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-sans">
                  Bonjour, <span className="text-primary">{profile?.full_name || user?.email?.split('@')[0] || 'Joueur'}</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold font-sans">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  {profile?.primary_position ? profile.primary_position.toUpperCase() : 'TALENT'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="font-semibold text-primary">{user?.email}</span>
                {profile?.availability_status && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-secondary font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      {profile.availability_status}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Boutons d'action dans l'en-tête */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href="#formulaire-profil"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container-low text-primary font-bold text-xs hover:bg-surface-container-high transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Modifier ma fiche</span>
            </a>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-error/10 hover:bg-error/20 text-error font-bold text-xs transition-all shadow-xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2 & 3. Cartes de statistiques RÉELLES */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Stat 1 : Inverted Hero Card (Fond vert forêt profond) — Statut réel de publication */}
          <div className="relative overflow-hidden rounded-2xl bg-primary-container text-on-primary p-6 shadow-md flex flex-col justify-between border border-primary">
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

            {/* Bouton d'action directe de publication */}
            {profile?.id && (
              <div className="mt-5 pt-4 border-t border-on-primary/15 flex items-center justify-between">
                <span className="text-xs text-on-primary-container font-medium">
                  {isPublished
                    ? 'Vous pouvez masquer votre fiche à tout moment'
                    : 'Publiez pour apparaître dans les recherches'}
                </span>
                <button
                  onClick={handleToggleStatus}
                  disabled={togglingStatus}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
                    isPublished
                      ? 'bg-surface-container-lowest text-primary hover:bg-surface-container-high'
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
            )}
          </div>

          {/* Stat 2 : Carte Demandes de contact réelles (façon Scouts intéressés) */}
          <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-sans">
                  Scouts intéressés &amp; Contacts
                </span>
                <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">mark_email_unread</span>
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

        {/* ========================================================================= */}
        {/* 4. Section "Dernières demandes de contact" (vraies demandes Supabase) */}
        {/* ========================================================================= */}
        {profile?.id && (
          <section>
            <PlayerContactRequests
              playerId={profile.id}
              onRequestsCountChange={handleRequestsCountChange}
            />
          </section>
        )}

        {/* ========================================================================= */}
        {/* 5. Aperçu du profil joueur (restylé) */}
        {/* ========================================================================= */}
        <section>
          <PlayerProfilePreview
            profile={profile}
            loading={loading}
            onProfileUpdated={handleProfileUpdated}
          />
        </section>

        {/* ========================================================================= */}
        {/* 5 (suite). Formulaire de profil joueur (restylé) */}
        {/* ========================================================================= */}
        <main>
          <PlayerProfileForm onProfileSaved={fetchProfile} />
        </main>
      </div>
    </div>
  )
}
