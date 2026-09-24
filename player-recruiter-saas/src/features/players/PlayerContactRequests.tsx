import React, { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { getFrenchErrorMessage } from '../../lib/errorUtils'

export interface ContactRequestItem {
  id: string
  recruiter_id: string | null
  player_id: string
  message: string
  status: string | null
  created_at: string
}

export interface ContactMessageItem {
  id: string
  contact_request_id: string
  sender_id: string
  sender_role: string
  message: string
  created_at: string
}

interface PlayerContactRequestsProps {
  playerId: string | null
  onRequestsCountChange?: (total: number, pending: number) => void
}

export const PlayerContactRequests: React.FC<PlayerContactRequestsProps> = ({
  playerId,
  onRequestsCountChange,
}) => {
  const { user } = useAuth()

  const [requests, setRequests] = useState<ContactRequestItem[]>([])
  const [recruiterNames, setRecruiterNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Modal & discussion states
  const [selectedRequest, setSelectedRequest] = useState<ContactRequestItem | null>(null)
  const [messages, setMessages] = useState<ContactMessageItem[]>([])
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false)
  const [messagesError, setMessagesError] = useState<string | null>(null)

  // Reply state
  const [replyText, setReplyText] = useState<string>('')
  const [sending, setSending] = useState<boolean>(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (selectedRequest && messages.length > 0) {
      scrollToBottom()
    }
  }, [messages, selectedRequest])

  const fetchContactRequests = useCallback(async () => {
    if (!playerId) {
      setRequests([])
      setLoading(false)
      if (onRequestsCountChange) onRequestsCountChange(0, 0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('contact_requests')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur récupération demandes de contact:', error)
        setError(getFrenchErrorMessage(error))
        setRequests([])
        if (onRequestsCountChange) onRequestsCountChange(0, 0)
      } else {
        const items = data || []
        setRequests(items)

        const total = items.length
        const pending = items.filter((r) => r.status === 'pending').length
        if (onRequestsCountChange) {
          onRequestsCountChange(total, pending)
        }

        // Tente de récupérer les noms réels des recruteurs si profiles est accessible
        const recruiterIds = Array.from(
          new Set(items.map((r) => r.recruiter_id).filter((id): id is string => Boolean(id)))
        )

        if (recruiterIds.length > 0) {
          try {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', recruiterIds)

            if (profilesData) {
              const map: Record<string, string> = {}
              profilesData.forEach((p) => {
                map[p.id] = p.full_name || p.email || 'Recruteur'
              })
              setRecruiterNames(map)
            }
          } catch {
            // Ignorer si la table profiles n'est pas accessible
          }
        }
      }
    } catch (err: any) {
      console.error('Erreur inattendue demandes de contact:', err)
      setError(getFrenchErrorMessage(err))
      setRequests([])
      if (onRequestsCountChange) onRequestsCountChange(0, 0)
    } finally {
      setLoading(false)
    }
  }, [playerId, onRequestsCountChange])

  useEffect(() => {
    fetchContactRequests()
  }, [fetchContactRequests])

  // Chargement des messages d'une demande
  const fetchMessages = async (requestId: string) => {
    setLoadingMessages(true)
    setMessagesError(null)

    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .eq('contact_request_id', requestId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erreur chargement messages:', error)
        setMessagesError(getFrenchErrorMessage(error))
        setMessages([])
      } else {
        setMessages(data || [])
      }
    } catch (err: any) {
      console.error('Erreur inattendue chargement messages:', err)
      setMessagesError(getFrenchErrorMessage(err))
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  // Ouverture du détail d'une demande
  const handleOpenRequest = async (req: ContactRequestItem) => {
    setSelectedRequest(req)
    setReplyText('')
    setSendError(null)
    setMessages([])

    // Quand le joueur ouvre une demande dont le status est 'pending', update automatiquement status = 'seen'
    if (req.status === 'pending') {
      const updatedStatus = 'seen'
      const updatedReq = { ...req, status: updatedStatus }
      setSelectedRequest(updatedReq)
      setRequests((prev) => prev.map((r) => (r.id === req.id ? updatedReq : r)))

      if (onRequestsCountChange) {
        const updatedList = requests.map((r) => (r.id === req.id ? updatedReq : r))
        const pendingCount = updatedList.filter((r) => r.status === 'pending').length
        onRequestsCountChange(updatedList.length, pendingCount)
      }

      try {
        await supabase.from('contact_requests').update({ status: updatedStatus }).eq('id', req.id)
      } catch (err) {
        console.error('Erreur mise à jour statut vu:', err)
      }
    }

    // Charger le fil des messages réels
    fetchMessages(req.id)
  }

  const handleCloseModal = () => {
    setSelectedRequest(null)
    setMessages([])
    setReplyText('')
    setSendError(null)
  }

  // Envoi d'une réponse
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = replyText.trim()
    if (!trimmed || !user || !selectedRequest || sending) return

    setSending(true)
    setSendError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('contact_messages')
        .insert([
          {
            contact_request_id: selectedRequest.id,
            sender_id: user.id,
            sender_role: 'player',
            message: trimmed,
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error('Erreur envoi message:', insertError)
        setSendError(getFrenchErrorMessage(insertError))
        return
      }

      // Affiche le nouveau message immédiatement après confirmation réelle de l'insert Supabase (pas avant)
      if (data) {
        setMessages((prev) => [...prev, data])
        setReplyText('')

        // update contact_requests.status = 'responded' si ce n'est pas déjà le cas
        if (selectedRequest.status !== 'responded') {
          const updatedStatus = 'responded'
          const updatedReq = { ...selectedRequest, status: updatedStatus }
          setSelectedRequest(updatedReq)
          setRequests((prev) =>
            prev.map((r) => (r.id === selectedRequest.id ? updatedReq : r))
          )

          try {
            await supabase
              .from('contact_requests')
              .update({ status: updatedStatus })
              .eq('id', selectedRequest.id)
          } catch (err) {
            console.error('Erreur mise à jour statut responded:', err)
          }
        }
      }
    } catch (err: any) {
      console.error('Erreur inattendue envoi message:', err)
      setSendError(getFrenchErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-amber-500/10 text-amber-800 border border-amber-500/25 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            En attente
          </span>
        )
      case 'seen':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/25 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            Consultée
          </span>
        )
      case 'responded':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 bg-secondary-container text-on-secondary-container border border-secondary/25 rounded-full">
            <span className="material-symbols-outlined text-[14px]">reply</span>
            Répondue
          </span>
        )
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 bg-secondary-container text-on-secondary-container border border-secondary/25 rounded-full">
            <span className="material-symbols-outlined text-[14px]">check</span>
            Acceptée
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 bg-error-container text-on-error-container border border-error/25 rounded-full">
            <span className="material-symbols-outlined text-[14px]">close</span>
            Refusée
          </span>
        )
      default:
        return (
          <span className="text-xs font-semibold px-3 py-1 bg-surface-container-high text-on-surface-variant border border-outline-variant/30 rounded-full">
            {status || 'Statut inconnu'}
          </span>
        )
    }
  }

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

  if (loading) {
    return (
      <div className="p-6 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm space-y-3">
        <h3 className="text-lg font-bold text-primary font-sans">Dernières demandes de contact</h3>
        <div className="text-sm text-on-surface-variant animate-pulse font-medium">
          Chargement des sollicitations en cours...
        </div>
      </div>
    )
  }

  if (!playerId) {
    return null
  }

  return (
    <div className="p-6 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm space-y-4 text-on-surface">
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
        <div>
          <h3 className="text-lg font-bold text-primary font-sans flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-primary">
              mail
            </span>
            <span>Dernières demandes de contact</span>
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Cliquez sur une demande pour consulter le message et dialoguer avec le recruteur
          </p>
        </div>

        {requests.length > 0 && (
          <span className="text-xs font-bold px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full">
            {requests.length} demande{requests.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-error-container border border-error/30 text-on-error-container rounded-xl text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>
            <strong>Erreur : </strong> {error}
          </span>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="p-8 bg-surface-container-low border border-outline-variant/20 rounded-xl text-center text-on-surface-variant space-y-1">
          <span className="material-symbols-outlined text-[32px] text-outline">mail</span>
          <p className="font-semibold text-primary">Aucune demande de contact pour l'instant</p>
          <p className="text-xs text-on-surface-variant">
            Dès qu'un recruteur s'intéresse à votre profil dans le catalogue, son message apparaîtra
            ici.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              role="button"
              tabIndex={0}
              onClick={() => handleOpenRequest(req)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleOpenRequest(req)
                }
              }}
              className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/50 hover:bg-surface-container/60 transition-all shadow-xs cursor-pointer group"
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold shadow-xs group-hover:scale-105 transition-transform border border-primary/20">
                  <span className="material-symbols-outlined text-[22px]">badge</span>
                </div>
                <div className="flex flex-col min-w-0 space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-primary text-sm group-hover:text-primary-fixed-dim transition-colors">
                      {req.recruiter_id && recruiterNames[req.recruiter_id]
                        ? recruiterNames[req.recruiter_id]
                        : 'Recruteur / Scout'}
                    </span>
                    <span className="text-xs text-on-surface-variant font-normal">
                      · Reçue le {formatDate(req.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-on-surface leading-relaxed line-clamp-2 bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/20 italic">
                    "{req.message}"
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                {getStatusBadge(req.status)}
                <div className="w-8 h-8 rounded-full bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center text-outline group-hover:text-primary group-hover:border-primary/40 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal Détail / Discussion avec le recruteur */}
      {/* ========================================================================= */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-2xl bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-outline-variant/20 flex items-center justify-between gap-3 bg-surface-container-low/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold shrink-0 border border-primary/20">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-white truncate font-sans">
                    {selectedRequest.recruiter_id && recruiterNames[selectedRequest.recruiter_id]
                      ? recruiterNames[selectedRequest.recruiter_id]
                      : 'Recruteur / Scout'}
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    Demande reçue le {formatDate(selectedRequest.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {getStatusBadge(selectedRequest.status)}
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-outline-variant/30 ml-1"
                  title="Fermer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Corps scrollable des messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Message initial du recruteur */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-primary/25 space-y-2 shadow-xs">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-primary font-sans uppercase tracking-wider text-[11px]">
                    <span className="material-symbols-outlined text-[15px]">mail</span>
                    Message initial du recruteur
                  </span>
                  <span className="text-on-surface-variant text-[11px]">
                    {formatDate(selectedRequest.created_at)}
                  </span>
                </div>
                <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line bg-surface-container-lowest/60 p-3 rounded-xl border border-outline-variant/15">
                  {selectedRequest.message}
                </p>
              </div>

              {/* Fil de discussion */}
              {loadingMessages && (
                <div className="text-center py-4 text-xs text-on-surface-variant animate-pulse flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Chargement des échanges...</span>
                </div>
              )}

              {messagesError && (
                <div className="text-xs text-error p-3 bg-error-container/30 border border-error/20 rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{messagesError}</span>
                </div>
              )}

              {/* Messages échangés */}
              {messages.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 my-2">
                    <div className="h-px bg-outline-variant/20 flex-1"></div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Échanges
                    </span>
                    <div className="h-px bg-outline-variant/20 flex-1"></div>
                  </div>

                  {messages.map((msg) => {
                    const isPlayer = msg.sender_role === 'player'
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col space-y-1 max-w-[85%] sm:max-w-[75%] ${
                          isPlayer ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant px-1">
                          <span className={`font-semibold ${isPlayer ? 'text-primary' : 'text-secondary'}`}>
                            {isPlayer
                              ? 'Vous (Joueur)'
                              : selectedRequest.recruiter_id && recruiterNames[selectedRequest.recruiter_id]
                              ? recruiterNames[selectedRequest.recruiter_id]
                              : 'Recruteur'}
                          </span>
                          <span>· {formatDate(msg.created_at)}</span>
                        </div>
                        <div
                          className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                            isPlayer
                              ? 'bg-primary text-on-primary rounded-tr-xs font-medium'
                              : 'bg-surface-container-high border border-outline-variant/30 text-on-surface rounded-tl-xs'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Champ de réponse en bas */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant/20">
              <form onSubmit={handleSendMessage} className="space-y-2">
                {sendError && (
                  <div className="text-xs text-error p-2.5 bg-error-container/40 border border-error/20 rounded-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{sendError}</span>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Écrivez votre réponse au recruteur..."
                    disabled={sending}
                    className="flex-1 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="px-5 py-3 rounded-full bg-primary hover:bg-primary-container text-on-primary font-bold text-xs tracking-wide transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    {sending ? (
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    )}
                    <span>{sending ? 'Envoi...' : 'Envoyer'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
