import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'

export interface PlayerProfileData {
  id: string
  full_name: string | null
  age: number | null
  primary_position: string | null
  availability_status: string | null
  status?: string | null
  height?: number | null
  strong_foot?: string | null
  bio?: string | null
  video_url?: string | null
  avatar_url?: string | null
}

interface PlayerProfilePreviewProps {
  profile: PlayerProfileData | null
  loading?: boolean
  onProfileUpdated?: (updatedProfile: PlayerProfileData) => void
}

export const PlayerProfilePreview: React.FC<PlayerProfilePreviewProps> = ({
  profile,
  loading,
  onProfileUpdated,
}) => {
  const [toggling, setToggling] = useState<boolean>(false)
  const [toggleError, setToggleError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="p-6 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm text-center text-on-surface-variant animate-pulse font-medium">
        Chargement de l'aperçu du profil...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-8 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-[36px] text-outline mb-2">person_off</span>
        <p className="font-semibold text-primary">Aucun profil créé pour l'instant</p>
        <p className="text-xs text-on-surface-variant mt-1">
          Remplissez le formulaire ci-dessous pour créer votre profil joueur.
        </p>
      </div>
    )
  }

  const isPublished = profile.status === 'published'

  const handleToggleStatus = async () => {
    if (!profile.id) return

    setToggling(true)
    setToggleError(null)

    const nextStatus = isPublished ? 'draft' : 'published'

    try {
      const { data, error } = await supabase
        .from('players')
        .update({ status: nextStatus })
        .eq('id', profile.id)
        .select('*')
        .single()

      if (error) {
        setToggleError(error.message)
      } else if (data && onProfileUpdated) {
        onProfileUpdated(data)
      }
    } catch (err: any) {
      setToggleError(err.message || 'Erreur lors du changement de statut.')
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="p-6 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm space-y-5 text-on-surface">
      {toggleError && (
        <div className="p-3 bg-error-container border border-error/30 text-on-error-container rounded-xl text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>
            <strong>Erreur : </strong> {toggleError}
          </span>
        </div>
      )}

      {/* Header section with profile name, avatar and status pill */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container-high border-2 border-primary/20 flex items-center justify-center shrink-0 shadow-inner">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'Joueur'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-[28px] text-on-surface-variant/50 select-none">
                person
              </span>
            )}
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-on-surface-variant tracking-wider flex items-center gap-1 font-sans">
              <span className="material-symbols-outlined text-[16px] text-primary">person</span>
              Aperçu de la fiche
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-primary font-sans mt-0.5">
              {profile.full_name || 'Nom non renseigné'}
            </h3>
          </div>
        </div>

        {/* Status Badge + Toggle Pill Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant font-medium">Statut :</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                isPublished
                  ? 'bg-secondary-container text-on-secondary-container border border-secondary/20'
                  : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {isPublished ? 'verified' : 'draft'}
              </span>
              {isPublished ? 'Publié' : 'Brouillon'}
            </span>
          </div>

          <button
            onClick={handleToggleStatus}
            disabled={toggling}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-sm ${
              isPublished
                ? 'bg-surface-container-low text-error hover:bg-error-container hover:text-on-error-container border-outline-variant/30'
                : 'bg-primary text-on-primary hover:bg-primary-container border-primary shadow-primary/20'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isPublished ? 'visibility_off' : 'publish'}
            </span>
            <span>
              {toggling
                ? 'Mise à jour...'
                : isPublished
                ? 'Retirer de la publication'
                : 'Publier mon profil'}
            </span>
          </button>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
          <div className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">calendar_today</span>
            Âge
          </div>
          <div className="text-base font-bold text-primary mt-1">
            {profile.age !== null && profile.age !== undefined ? `${profile.age} ans` : 'Non renseigné'}
          </div>
        </div>

        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
          <div className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">sports_soccer</span>
            Poste principal
          </div>
          <div className="text-base font-bold text-primary mt-1">
            {profile.primary_position || 'Non renseigné'}
          </div>
        </div>

        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
          <div className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">straighten</span>
            Taille &amp; Pied fort
          </div>
          <div className="text-base font-bold text-primary mt-1">
            {profile.height ? `${profile.height} cm` : '—'} · {profile.strong_foot || 'Non spécifié'}
          </div>
        </div>

        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
          <div className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">how_to_reg</span>
            Disponibilité
          </div>
          <div className="text-base font-bold text-secondary mt-1">
            {profile.availability_status || 'Non renseigné'}
          </div>
        </div>
      </div>

      {/* Bio and video preview if available */}
      {profile.bio && (
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 space-y-1">
          <div className="text-xs font-semibold text-on-surface-variant">Bio / Présentation</div>
          <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">{profile.bio}</p>
        </div>
      )}

      {profile.video_url && (
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-primary font-semibold">
            <span className="material-symbols-outlined text-[20px] text-secondary">smart_display</span>
            <span>Vidéo de match / Highlights enregistrée</span>
          </div>
          <a
            href={profile.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-surface-container-lowest text-primary border border-outline-variant/40 text-xs font-bold hover:bg-surface-container-high transition-colors"
          >
            <span>Visionner le lien</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </div>
      )}
    </div>
  )
}
