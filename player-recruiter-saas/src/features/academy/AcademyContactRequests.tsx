import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export interface AcademyContactRequestItem {
  id: string
  recruiter_id: string | null
  player_id: string
  message: string
  status: string | null
  created_at: string
  player_name?: string
}

interface AcademyContactRequestsProps {
  academyId: string | null
  onCountChange?: (count: number) => void
}

export const AcademyContactRequests: React.FC<AcademyContactRequestsProps> = ({ academyId, onCountChange }) => {
  const [requests, setRequests] = useState<AcademyContactRequestItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContactRequests = useCallback(async () => {
    if (!academyId) {
      setRequests([])
      setLoading(false)
      onCountChange?.(0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Récupérer tous les IDs des joueurs appartenant à cette académie
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('id, full_name')
        .eq('academy_id', academyId)

      if (playersError) {
        console.error('Erreur lors du chargement des joueurs de l\'académie pour contact_requests:', playersError)
        setError(playersError.message)
        setRequests([])
        onCountChange?.(0)
        return
      }

      if (!playersData || playersData.length === 0) {
        setRequests([])
        onCountChange?.(0)
        return
      }

      const playerIds = playersData.map((p) => p.id)
      const playerNamesMap: Record<string, string> = {}
      playersData.forEach((p) => {
        playerNamesMap[p.id] = p.full_name || 'Joueur sans nom'
      })

      // 2. Récupérer toutes les demandes de contact ciblant ces joueurs
      const { data: requestsData, error: requestsError } = await supabase
        .from('contact_requests')
        .select('*')
        .in('player_id', playerIds)
        .order('created_at', { ascending: false })

      if (requestsError) {
        console.error('Erreur récupération demandes de contact académie:', requestsError)
        setError(requestsError.message)
        setRequests([])
        onCountChange?.(0)
      } else {
        const enriched = (requestsData || []).map((req: any) => ({
          ...req,
          player_name: playerNamesMap[req.player_id] || 'Joueur inconnu',
        }))
        setRequests(enriched)
        onCountChange?.(enriched.length)
      }
    } catch (err: any) {
      console.error('Erreur inattendue demandes de contact académie:', err)
      setError(err.message || 'Erreur lors de la récupération des demandes de contact.')
      setRequests([])
      onCountChange?.(0)
    } finally {
      setLoading(false)
    }
  }, [academyId, onCountChange])

  useEffect(() => {
    fetchContactRequests()
  }, [fetchContactRequests])

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return (
          <span className="text-[11px] font-semibold px-3 py-0.5 bg-amber-500/10 text-amber-800 border border-amber-500/25 rounded-full inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            En attente
          </span>
        )
      case 'accepted':
        return (
          <span className="text-[11px] font-semibold px-3 py-0.5 bg-secondary/10 text-secondary border border-secondary/25 rounded-full inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">check</span>
            Acceptée
          </span>
        )
      case 'rejected':
        return (
          <span className="text-[11px] font-semibold px-3 py-0.5 bg-error-container text-on-error-container border border-error/20 rounded-full inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">close</span>
            Refusée
          </span>
        )
      default:
        return (
          <span className="text-[11px] font-semibold px-3 py-0.5 bg-surface-container text-on-surface-variant border border-outline-variant/30 rounded-full">
            {status || 'Inconnu'}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">contact_mail</span>
          </div>
          <h3 className="text-lg font-bold text-primary font-sans">
            Demandes de contact reçues
          </h3>
        </div>
        <div className="text-sm text-on-surface-variant animate-pulse p-4 bg-surface-container-low rounded-xl text-center">
          Chargement des demandes de contact reçues...
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">contact_mail</span>
          </div>
          <h3 className="text-lg font-bold text-primary font-sans">
            Demandes de contact reçues
          </h3>
        </div>

        {requests.length > 0 && (
          <span className="text-xs font-bold px-3 py-1 bg-secondary/10 text-secondary border border-secondary/25 rounded-full">
            {requests.length} demande{requests.length > 1 ? 's' : ''} reçue{requests.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {error && (
        <div className="p-4 bg-error-container text-on-error-container border border-error/20 rounded-2xl text-sm flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-error shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="p-8 bg-surface-container-low/50 border border-outline-variant/20 rounded-2xl text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline mx-auto mb-1">
            <span className="material-symbols-outlined text-[24px]">mark_email_unread</span>
          </div>
          <h4 className="text-sm font-bold text-on-surface">Aucune demande de contact reçue pour l'instant</h4>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Les recruteurs et scouts intéressés par vos talents pourront vous envoyer des messages de prise de contact directement ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-5 bg-surface-container-low/60 border border-outline-variant/25 rounded-2xl shadow-xs space-y-3 hover:border-primary/40 hover:bg-surface-container-low transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant font-medium">Talent ciblé :</span>
                  <span className="text-xs font-bold text-primary bg-surface-container-lowest px-3 py-1 rounded-full border border-outline-variant/30 shadow-xs inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-secondary">person</span>
                    {req.player_name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {formatDate(req.created_at)}
                  </span>
                  {getStatusBadge(req.status)}
                </div>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/15 text-sm text-on-surface leading-relaxed whitespace-pre-line shadow-xs">
                "{req.message}"
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

