import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { getFrenchErrorMessage } from '../../lib/errorUtils'

export interface PlayerFormData {
  id?: string
  full_name: string
  age: string | number
  primary_position: string
  height: string | number
  strong_foot: string
  availability_status: string
  bio: string
  video_url: string
}

export interface PlayerRecord {
  id: string
  full_name: string | null
  age: number | null
  primary_position: string | null
  height: number | null
  strong_foot: string | null
  availability_status: string | null
  bio: string | null
  video_url: string | null
  status: string | null
  source: string | null
  academy_id: string | null
  avatar_url?: string | null
}

interface AddPlayerFormProps {
  initialData?: PlayerRecord | null
  onPlayerAdded?: () => void
  onCancel?: () => void
}

export function AddPlayerForm({ initialData, onPlayerAdded, onCancel }: AddPlayerFormProps) {
  const { user } = useAuth()

  const [submitting, setSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const isEditing = Boolean(initialData?.id)

  const [formData, setFormData] = useState<PlayerFormData>({
    full_name: '',
    age: '',
    primary_position: 'Milieu',
    height: '',
    strong_foot: 'Droit',
    availability_status: 'Disponible',
    bio: '',
    video_url: '',
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        full_name: initialData.full_name ?? '',
        age: initialData.age !== null && initialData.age !== undefined ? initialData.age : '',
        primary_position: initialData.primary_position ?? 'Milieu',
        height: initialData.height !== null && initialData.height !== undefined ? initialData.height : '',
        strong_foot: initialData.strong_foot ?? 'Droit',
        availability_status: initialData.availability_status ?? 'Disponible',
        bio: initialData.bio ?? '',
        video_url: initialData.video_url ?? '',
      })
    }
  }, [initialData])

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
      setErrorMessage('Vous devez être connecté pour sauvegarder ce joueur.')
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
    }

    try {
      if (isEditing && initialData?.id) {
        // UPDATE d'un joueur existant
        const { data, error } = await supabase
          .from('players')
          .update(payload)
          .eq('id', initialData.id)
          .eq('academy_id', user.id)
          .select()
          .single()

        if (error) {
          console.error('Erreur Supabase lors de la mise à jour:', error)
          setErrorMessage(getFrenchErrorMessage(error))
        } else if (data) {
          setSuccessMessage(`Le joueur "${data.full_name || 'Sans nom'}" a été mis à jour avec succès !`)
          if (onPlayerAdded) {
            onPlayerAdded()
          }
        }
      } else {
        // INSERT d'un nouveau joueur
        const { data, error } = await supabase
          .from('players')
          .insert([
            {
              ...payload,
              academy_id: user.id,
              owner_id: user.id,
              source: 'academy',
              status: 'draft',
            },
          ])
          .select()
          .single()

        if (error) {
          console.error('Erreur Supabase lors de l\'ajout du joueur:', error)
          setErrorMessage(getFrenchErrorMessage(error))
        } else if (data) {
          setSuccessMessage(`Le joueur "${data.full_name || 'Sans nom'}" a été créé avec succès en statut brouillon (draft) !`)
          
          setFormData({
            full_name: '',
            age: '',
            primary_position: 'Milieu',
            height: '',
            strong_foot: 'Droit',
            availability_status: 'Disponible',
            bio: '',
            video_url: '',
          })

          if (onPlayerAdded) {
            onPlayerAdded()
          }
        }
      }
    } catch (err: any) {
      console.error('Erreur inattendue:', err)
      setErrorMessage(getFrenchErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-8 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-sm text-on-surface">
      <div className="flex items-center justify-between pb-5 mb-6 border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-container flex items-center justify-center text-primary-fixed shadow-sm">
            <span className="material-symbols-outlined text-[22px]">
              {isEditing ? 'edit_note' : 'person_add'}
            </span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary font-sans tracking-tight">
              {isEditing ? `Modifier le profil de ${formData.full_name || 'Joueur'}` : 'Ajouter un nouveau joueur'}
            </h2>
            <p className="text-xs text-on-surface-variant">
              Renseignez les détails sportifs et l'état civil de votre talent
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-on-surface-variant hover:text-on-surface text-xs font-semibold px-4 py-2 rounded-full border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            <span>Fermer</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mb-5 p-4 bg-error-container text-on-error-container rounded-2xl text-sm font-medium border border-error/20 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-error shrink-0">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-5 p-4 bg-secondary/10 border border-secondary/25 text-secondary rounded-2xl text-sm font-medium flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-secondary shrink-0">check_circle</span>
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label htmlFor="full_name" className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Nom complet <span className="text-error">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="full_name"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              placeholder="ex: Sadio Mané"
              className="w-full px-5 py-3 rounded-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Age & Height Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="age" className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
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
              placeholder="ex: 18"
              className="w-full px-5 py-3 rounded-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label htmlFor="height" className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
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
              placeholder="ex: 178"
              className="w-full px-5 py-3 rounded-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Primary Position & Strong Foot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="primary_position" className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Poste principal
            </label>
            <select
              id="primary_position"
              name="primary_position"
              value={formData.primary_position}
              onChange={handleChange}
              className="w-full px-5 py-3 rounded-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              <option value="Gardien">Gardien</option>
              <option value="Défenseur">Défenseur</option>
              <option value="Milieu">Milieu</option>
              <option value="Attaquant">Attaquant</option>
            </select>
          </div>

          <div>
            <label htmlFor="strong_foot" className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Pied fort
            </label>
            <select
              id="strong_foot"
              name="strong_foot"
              value={formData.strong_foot}
              onChange={handleChange}
              className="w-full px-5 py-3 rounded-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              <option value="Droit">Droit</option>
              <option value="Gauche">Gauche</option>
              <option value="Ambidextre">Ambidextre</option>
            </select>
          </div>
        </div>

        {/* Availability Status */}
        <div>
          <label htmlFor="availability_status" className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Statut de disponibilité
          </label>
          <select
            id="availability_status"
            name="availability_status"
            value={formData.availability_status}
            onChange={handleChange}
            className="w-full px-5 py-3 rounded-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
          >
            <option value="Disponible">Disponible</option>
            <option value="En club">En club</option>
            <option value="Non disponible">Non disponible</option>
          </select>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Biographie / Description
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={handleChange}
            placeholder="Présentez le parcours, qualités physiques et points forts du joueur..."
            className="w-full px-5 py-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Video URL */}
        <div>
          <label htmlFor="video_url" className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Lien vidéo (YouTube / Highlights)
          </label>
          <input
            type="url"
            id="video_url"
            name="video_url"
            value={formData.video_url}
            onChange={handleChange}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-5 py-3 rounded-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Buttons */}
        <div className="pt-3 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="py-3 px-6 bg-surface-container-high hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-semibold rounded-full border border-outline-variant/30 transition-colors text-xs cursor-pointer flex items-center gap-1.5"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="py-3 px-6 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-full shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              {submitting ? 'sync' : isEditing ? 'check' : 'person_add'}
            </span>
            <span>
              {submitting
                ? 'Enregistrement en cours...'
                : isEditing
                ? 'Mettre à jour le joueur'
                : 'Enregistrer le joueur (brouillon)'}
            </span>
          </button>
        </div>
      </form>
    </div>
  )
}
