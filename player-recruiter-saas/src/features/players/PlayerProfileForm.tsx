import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { getFrenchErrorMessage } from '../../lib/errorUtils'

interface PlayerFormData {
  full_name: string
  age: string | number
  primary_position: string
  height: string | number
  strong_foot: string
  availability_status: string
  bio: string
  video_url: string
  avatar_url: string
}

interface PlayerProfileFormProps {
  onProfileSaved?: () => void
}

export function PlayerProfileForm({ onProfileSaved }: PlayerProfileFormProps) {
  const { user } = useAuth()

  const [existingId, setExistingId] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState<PlayerFormData>({
    full_name: '',
    age: '',
    primary_position: 'Milieu',
    height: '',
    strong_foot: 'Droit',
    availability_status: 'Disponible',
    bio: '',
    video_url: '',
    avatar_url: '',
  })

  useEffect(() => {
    async function fetchExistingProfile() {
      if (!user) {
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage(null)

      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('owner_id', user.id)
          .eq('source', 'self')
          .maybeSingle()

        if (error) {
          console.error('Erreur lors du chargement de la fiche joueur:', error)
          setErrorMessage(getFrenchErrorMessage(error))
        } else if (data) {
          setExistingId(data.id)
          setFormData({
            full_name: data.full_name ?? '',
            age: data.age !== null && data.age !== undefined ? data.age : '',
            primary_position: data.primary_position ?? 'Milieu',
            height: data.height !== null && data.height !== undefined ? data.height : '',
            strong_foot: data.strong_foot ?? 'Droit',
            availability_status: data.availability_status ?? 'Disponible',
            bio: data.bio ?? '',
            video_url: data.video_url ?? '',
            avatar_url: data.avatar_url ?? '',
          })
        }
      } catch (err: any) {
        console.error('Erreur inattendue:', err)
        setErrorMessage(getFrenchErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    fetchExistingProfile()
  }, [user])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarError(null)

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Format non supporté. Veuillez sélectionner une image au format JPEG, PNG ou WebP.')
      e.target.value = ''
      return
    }

    const maxSizeInBytes = 5 * 1024 * 1024 // 5 Mo
    if (file.size > maxSizeInBytes) {
      setAvatarError("La taille de l'image dépasse la limite autorisée de 5 Mo.")
      e.target.value = ''
      return
    }

    if (!user) {
      setAvatarError('Vous devez être connecté pour télécharger une photo.')
      return
    }

    try {
      setUploadingAvatar(true)
      const fileExt = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
      const filePath = `${user.id}/avatar.${fileExt}`

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        })

      // If bucket doesn't exist, attempt creation
      if (uploadError && (uploadError.message?.includes('Bucket not found') || (uploadError as any)?.statusCode === '404')) {
        try {
          await supabase.storage.createBucket('avatars', { public: true })
          const retry = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
              upsert: true,
              contentType: file.type,
            })
          uploadError = retry.error
        } catch {
          // ignore auto-create error and proceed to display user-friendly message
        }
      }

      if (uploadError) {
        console.error('Erreur upload avatar:', uploadError)
        setAvatarError(getFrenchErrorMessage(uploadError))
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Add timestamp to bust browser cache on reload
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`

      setFormData((prev) => ({
        ...prev,
        avatar_url: cacheBustedUrl,
      }))
    } catch (err: any) {
      console.error('Erreur inattendue upload avatar:', err)
      setAvatarError(getFrenchErrorMessage(err))
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setErrorMessage('Vous devez être connecté pour sauvegarder votre profil.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    const payload = {
      full_name: formData.full_name,
      age: formData.age === '' ? null : Number(formData.age),
      primary_position: formData.primary_position,
      height: formData.height === '' ? null : Number(formData.height),
      strong_foot: formData.strong_foot,
      availability_status: formData.availability_status,
      bio: formData.bio,
      video_url: formData.video_url,
      avatar_url: formData.avatar_url ? formData.avatar_url.split('?')[0] : null,
    }

    try {
      if (existingId) {
        // Update existing record
        const { error } = await supabase.from('players').update(payload).eq('id', existingId)

        if (error) {
          setErrorMessage(getFrenchErrorMessage(error))
        } else {
          setSuccessMessage('Profil joueur mis à jour avec succès !')
          if (onProfileSaved) {
            onProfileSaved()
          }
        }
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('players')
          .insert([
            {
              ...payload,
              owner_id: user.id,
              source: 'self',
            },
          ])
          .select()
          .single()

        if (error) {
          setErrorMessage(getFrenchErrorMessage(error))
        } else {
          if (data?.id) {
            setExistingId(data.id)
          }
          setSuccessMessage('Profil joueur créé avec succès !')
          if (onProfileSaved) {
            onProfileSaved()
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(getFrenchErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm text-center">
        <div className="text-on-surface-variant animate-pulse font-medium">
          Chargement du formulaire de profil...
        </div>
      </div>
    )
  }

  return (
    <div
      id="formulaire-profil"
      className="p-6 sm:p-8 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm text-on-surface"
    >
      <div className="border-b border-outline-variant/20 pb-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-primary font-sans flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[24px] text-secondary">edit_note</span>
          <span>{existingId ? 'Modifier ma fiche joueur' : 'Créer ma fiche joueur'}</span>
        </h2>
        <p className="text-xs text-on-surface-variant mt-1">
          Renseignez vos coordonnées sportives exactes pour optimiser vos opportunités auprès des
          recruteurs.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-5 p-4 bg-error-container border border-error/30 text-on-error-container rounded-2xl text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>
            <strong>Erreur : </strong> {errorMessage}
          </span>
        </div>
      )}

      {successMessage && (
        <div className="mb-5 p-4 bg-secondary-container/30 border border-secondary/30 text-primary rounded-2xl text-sm font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-secondary">check_circle</span>
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo de profil (Avatar Upload) */}
        <div className="p-4 sm:p-5 bg-surface-container-low rounded-2xl border border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Aperçu circulaire */}
          <div className="relative w-20 h-20 rounded-full shrink-0 overflow-hidden bg-surface-container-high border-2 border-primary/25 flex items-center justify-center shadow-inner">
            {formData.avatar_url ? (
              <img
                src={formData.avatar_url}
                alt="Photo de profil"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50 select-none">
                person
              </span>
            )}

            {/* Indicateur de chargement pendant l'upload */}
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center text-primary">
                <span className="material-symbols-outlined animate-spin text-[26px]">
                  progress_activity
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <label
                htmlFor="avatar_file"
                className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 font-sans"
              >
                Photo de profil
              </label>
              <p className="text-xs text-on-surface-variant">
                Formats acceptés : JPEG, PNG, WebP (max. 5 Mo).
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="file"
                id="avatar_file"
                name="avatar_file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar || submitting}
                className="text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary file:text-on-primary hover:file:bg-primary-container file:cursor-pointer file:transition-all cursor-pointer disabled:opacity-50"
              />
              {uploadingAvatar && (
                <span className="text-xs text-primary font-medium flex items-center gap-1.5 animate-pulse">
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  Téléchargement en cours...
                </span>
              )}
            </div>

            {avatarError && (
              <div className="text-xs text-error font-medium flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{avatarError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label
            htmlFor="full_name"
            className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans"
          >
            Nom complet
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            required
            value={formData.full_name}
            onChange={handleChange}
            placeholder="ex: Mamadou Sarr"
            className="w-full px-5 py-3 bg-surface-container-low border border-outline-variant/40 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-on-surface placeholder:text-outline text-sm transition-all shadow-xs"
          />
        </div>

        {/* Age & Height Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="age"
              className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans"
            >
              Âge
            </label>
            <input
              type="number"
              id="age"
              name="age"
              min="1"
              max="100"
              value={formData.age}
              onChange={handleChange}
              placeholder="ex: 19"
              className="w-full px-5 py-3 bg-surface-container-low border border-outline-variant/40 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-on-surface placeholder:text-outline text-sm transition-all shadow-xs"
            />
          </div>

          <div>
            <label
              htmlFor="height"
              className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans"
            >
              Taille (cm)
            </label>
            <input
              type="number"
              id="height"
              name="height"
              min="50"
              max="250"
              value={formData.height}
              onChange={handleChange}
              placeholder="ex: 182"
              className="w-full px-5 py-3 bg-surface-container-low border border-outline-variant/40 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-on-surface placeholder:text-outline text-sm transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Primary Position & Strong Foot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="primary_position"
              className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans"
            >
              Poste principal
            </label>
            <select
              id="primary_position"
              name="primary_position"
              value={formData.primary_position}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-surface-container-low border border-outline-variant/40 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-on-surface text-sm transition-all shadow-xs cursor-pointer"
            >
              <option value="Gardien">Gardien</option>
              <option value="Défenseur">Défenseur</option>
              <option value="Milieu">Milieu</option>
              <option value="Attaquant">Attaquant</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="strong_foot"
              className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans"
            >
              Pied fort
            </label>
            <select
              id="strong_foot"
              name="strong_foot"
              value={formData.strong_foot}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-surface-container-low border border-outline-variant/40 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-on-surface text-sm transition-all shadow-xs cursor-pointer"
            >
              <option value="Droit">Droit</option>
              <option value="Gauche">Gauche</option>
              <option value="Ambidextre">Ambidextre</option>
            </select>
          </div>
        </div>

        {/* Availability Status */}
        <div>
          <label
            htmlFor="availability_status"
            className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans"
          >
            Statut de disponibilité
          </label>
          <select
            id="availability_status"
            name="availability_status"
            value={formData.availability_status}
            onChange={handleChange}
            className="w-full px-5 py-3 bg-surface-container-low border border-outline-variant/40 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-on-surface text-sm transition-all shadow-xs cursor-pointer"
          >
            <option value="Disponible">Disponible pour détection / transfert</option>
            <option value="En club">Sous contrat en club / académie</option>
            <option value="Non disponible">Non disponible actuellement</option>
          </select>
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="bio"
            className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans"
          >
            Biographie &amp; Parcours
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={handleChange}
            placeholder="Décrivez votre parcours, vos clubs formateurs, vos qualités fortes et vos objectifs..."
            className="w-full px-5 py-3.5 bg-surface-container-low border border-outline-variant/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-on-surface placeholder:text-outline text-sm transition-all shadow-xs"
          />
        </div>

        {/* Video URL */}
        <div>
          <label
            htmlFor="video_url"
            className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 font-sans"
          >
            Lien vidéo (YouTube / Highlights / Match complet)
          </label>
          <input
            type="url"
            id="video_url"
            name="video_url"
            value={formData.video_url}
            onChange={handleChange}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-5 py-3 bg-surface-container-low border border-outline-variant/40 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-on-surface placeholder:text-outline text-sm transition-all shadow-xs"
          />
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-full shadow-md shadow-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              {existingId ? 'save' : 'add_circle'}
            </span>
            <span>
              {submitting
                ? 'Enregistrement en cours...'
                : existingId
                ? 'Mettre à jour ma fiche joueur'
                : 'Enregistrer ma fiche joueur'}
            </span>
          </button>
        </div>
      </form>
    </div>
  )
}
