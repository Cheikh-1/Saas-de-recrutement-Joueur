import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { getFrenchErrorMessage } from '../../lib/errorUtils'

export interface RecruiterContactRequestItem {
  id: string
  recruiter_id: string | null
  player_id: string
  message: string
  status: string | null
  created_at: string
}

export interface PlayerInfo {
  id: string
  full_name: string | null
  primary_position: string | null
  age: number | null
  avatar_url?: string | null
}

export interface ContactMessageItem {
  id: string
  contact_request_id: string
  sender_id: string
  sender_role: string
  message: string
  created_at: string
}

interface RecruiterContactRequestsProps {
  onCountChange?: (count: number) => void
}

export const RecruiterContactRequests: React.FC<RecruiterContactRequestsProps> = ({
  onCountChange,
}) => {
  const { user } = useAuth()

  const [requests, setRequests] = useState<RecruiterContactRequestItem[]>([])
  const [playersMap, setPlayersMap] = useState<Record<string, PlayerInfo>>({})
  const [latestMessagesMap, setLatestMessagesMap] = useState<Record<string, ContactMessageItem>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Discussion Modal state
  const [selectedRequest, setSelectedRequest] = useState<RecruiterContactRequestItem | null>(null)
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

  const fetchRequests = useCallback(async () => {
    if (!user) {
      setRequests([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Fetch contact requests sent by this recruiter
      const { data, error: reqError } = await supabase
        .from('contact_requests')
        .select('*')
        .eq('recruiter_id', user.id)
        .order('created_at', { ascending: false })

      if (reqError) {
        console.error('Erreur chargement demandes recruteur:', reqError)
        setError(getFrenchErrorMessage(reqError))
        setRequests([])
        if (onCountChange) onCountChange(0)
        return
      }

      const items: RecruiterContactRequestItem[] = data || []
      setRequests(items)
      if (onCountChange) onCountChange(items.length)

      if (items.length > 0) {
        // 2. Fetch players info
        const playerIds = Array.from(new Set(items.map((r) => r.player_id).filter(Boolean)))
        if (playerIds.length > 0) {
          const { data: playersData } = await supabase
            .from('players')
            .select('id, full_name, primary_position, age, avatar_url')
            .in('id', playerIds)

          if (playersData) {
            const pMap: Record<string, PlayerInfo> = {}
            playersData.forEach((p) => {
              pMap[p.id] = p
            })
            setPlayersMap(pMap)
          }
        }

        // 3. Fetch latest messages for each request to show preview
        const requestIds = items.map((r) => r.id)
        const { data: msgsData } = await supabase
          .from('contact_messages')
          .select('*')
          .in('contact_request_id', requestIds)
          .order('created_at', { ascending: true })

        if (msgsData) {
          const lMap: Record<string, ContactMessageItem> = {}
          msgsData.forEach((m) => {
            // Keep latest message per request
            lMap[m.contact_request_id] = m
          })
          setLatestMessagesMap(lMap)
        }
      }
    } catch (err: any) {
      console.error('Erreur inattendue demandes recruteur:', err)
      setError(getFrenchErrorMessage(err))
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [user, onCountChange])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // Open discussion modal
  const handleOpenDiscussion = async (req: RecruiterContactRequestItem) => {
    setSelectedRequest(req)
    setReplyText('')
    setSendError(null)
    setMessages([])
    fetchMessages(req.id)
  }

  const fetchMessages = async (requestId: string) => {
    setLoadingMessages(true)
    setMessagesError(null)

    try {
      const { data, error: msgErr } = await supabase
        .from('contact_messages')
        .select('*')
        .eq('contact_request_id', requestId)
        .order('created_at', { ascending: true })

      if (msgErr) {
        console.error('Erreur récupération fil discussion:', msgErr)
        setMessagesError(getFrenchErrorMessage(msgErr))
        setMessages([])
      } else {
        setMessages(data || [])
      }
    } catch (err: any) {
      console.error('Erreur inattendue messages:', err)
      setMessagesError(getFrenchErrorMessage(err))
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedRequest(null)
    setMessages([])
    setReplyText('')
    setSendError(null)
  }

  // Send a reply to the player
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
            sender_role: 'recruiter',
            message: trimmed,
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error('Erreur envoi message recruteur:', insertError)
        setSendError(getFrenchErrorMessage(insertError))
        return
      }

      if (data) {
        setMessages((prev) => [...prev, data])
        setReplyText('')
        setLatestMessagesMap((prev) => ({
          ...prev,
          [selectedRequest.id]: data,
        }))
      }
    } catch (err: any) {
      console.error('Erreur inattendue réponse recruteur:', err)
      setSendError(getFrenchErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'responded':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-secondary-container text-on-secondary-container border border-secondary/25 rounded-full shadow-xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Réponse reçue
          </span>
        )
      case 'seen':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/25 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            Vu par le joueur
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-amber-500/10 text-amber-800 border border-amber-500/25 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            En attente de lecture
          </span>
        )
      default:
        return (
          <span className="text-xs font-semibold px-3 py-1 bg-surface-container-high text-on-surface-variant border border-outline-variant/30 rounded-full">
            {status || 'Transmis'}
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

  const respondedCount = requests.filter((r) => r.status === 'responded').length

  if (loading) {
    return (
      <div className="p-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm space-y-3">
        <h3 className="text-lg font-bold text-primary font-sans flex items-center gap-2">
          <span className="material-symbols-outlined text-[22px] text-secondary">forum</span>
          <span>Mes Prises de Contact &amp; Réponses</span>
        </h3>
        <div className="text-sm text-on-surface-variant animate-pulse font-medium">
          Chargement de vos échanges avec les joueurs...
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="p-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-primary font-sans flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[24px] text-secondary">forum</span>
              <span>Discussions &amp; Réponses des Joueurs</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Retrouvez l'historique de vos prises de contact et les réponses en direct envoyées par les joueurs
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {respondedCount > 0 && (
              <span className="text-xs font-bold px-3.5 py-1.5 bg-secondary-container text-on-secondary-container border border-secondary/25 rounded-full inline-flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                <span>{respondedCount} réponse{respondedCount > 1 ? 's' : ''} reçue{respondedCount > 1 ? 's' : ''}</span>
              </span>
            )}
            <span className="text-xs font-semibold px-3 py-1.5 bg-surface-container text-on-surface-variant border border-outline-variant/30 rounded-full">
              {requests.length} demande{requests.length !== 1 ? 's' : ''} au total
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-error-container border border-error/30 text-on-error-container rounded-xl text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="mt-6 p-8 bg-surface-container-low border border-outline-variant/20 rounded-2xl text-center space-y-2">
            <span className="material-symbols-outlined text-[36px] text-outline">mark_chat_unread</span>
            <p className="font-semibold text-primary">Aucune demande envoyée pour l'instant</p>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Consultez le catalogue ci-dessous pour découvrir les talents disponibles et leur transmettre votre première prise de contact.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => {
              const player = playersMap[req.player_id]
              const latestMsg = latestMessagesMap[req.id]
              const hasResponse = req.status === 'responded' || (latestMsg && latestMsg.sender_role === 'player')

              return (
                <div
                  key={req.id}
                  onClick={() => handleOpenDiscussion(req)}
                  className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 group shadow-xs hover:shadow-md ${
                    hasResponse
                      ? 'bg-surface-container-low border-primary/40 hover:border-primary'
                      : 'bg-surface-container-lowest border-outline-variant/25 hover:border-outline-variant/50'
                  }`}
                >
                  {/* Top card info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high border border-primary/25 flex items-center justify-center shrink-0 shadow-xs">
                        {player?.avatar_url ? (
                          <img
                            src={player.avatar_url}
                            alt={player.full_name || 'Joueur'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-[26px] text-on-surface-variant/50 select-none">
                            person
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-bold text-white group-hover:text-primary transition-colors truncate font-sans">
                          {player?.full_name || 'Talent Teranga'}
                        </h4>
                        <p className="text-xs text-primary font-semibold">
                          {player?.primary_position || 'Poste non renseigné'}
                          {player?.age !== null && player?.age !== undefined ? ` • ${player.age} ans` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {getStatusBadge(req.status)}
                    </div>
                  </div>

                  {/* Message Preview */}
                  <div className="space-y-1">
                    {latestMsg && latestMsg.sender_role === 'player' ? (
                      <div className="p-3 bg-secondary-container/20 border border-secondary/25 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-secondary text-[11px]">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">reply</span>
                            Dernière réponse du joueur :
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-normal">
                            {formatDate(latestMsg.created_at)}
                          </span>
                        </div>
                        <p className="text-on-surface font-medium line-clamp-2 italic">
                          "{latestMsg.message}"
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-surface-container-low/80 border border-outline-variant/15 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between text-outline text-[11px] font-semibold">
                          <span>Votre message initial :</span>
                          <span className="text-[10px] text-on-surface-variant">
                            {formatDate(req.created_at)}
                          </span>
                        </div>
                        <p className="text-on-surface-variant line-clamp-2 italic">
                          "{req.message}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-2 border-t border-outline-variant/15 flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant text-[11px]">
                      Contact initié le {formatDate(req.created_at)}
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                      <span>Ouvrir la discussion</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* Modal de Discussion entre Recruteur et Joueur */}
      {/* ========================================================================= */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-2xl bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-outline-variant/20 flex items-center justify-between gap-3 bg-surface-container-low/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high border border-primary/25 flex items-center justify-center shrink-0 shadow-xs">
                  {playersMap[selectedRequest.player_id]?.avatar_url ? (
                    <img
                      src={playersMap[selectedRequest.player_id]?.avatar_url || ''}
                      alt={playersMap[selectedRequest.player_id]?.full_name || 'Joueur'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[26px] text-on-surface-variant/50 select-none">
                      person
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-white truncate font-sans">
                    {playersMap[selectedRequest.player_id]?.full_name || 'Talent'}
                  </h4>
                  <p className="text-xs text-primary font-semibold">
                    {playersMap[selectedRequest.player_id]?.primary_position || 'Poste non renseigné'}
                    {playersMap[selectedRequest.player_id]?.age
                      ? ` • ${playersMap[selectedRequest.player_id]?.age} ans`
                      : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/recruiter/players/${selectedRequest.player_id}`}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  <span>Voir la fiche</span>
                </Link>
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
              {/* Message initial envoyé par le recruteur */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2 shadow-xs">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-on-surface-variant font-sans uppercase tracking-wider text-[11px]">
                    <span className="material-symbols-outlined text-[15px] text-primary">outbox</span>
                    Votre message initial transmis au joueur
                  </span>
                  <span className="text-on-surface-variant text-[11px]">
                    {formatDate(selectedRequest.created_at)}
                  </span>
                </div>
                <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line bg-surface-container-lowest/70 p-3 rounded-xl border border-outline-variant/15 italic">
                  "{selectedRequest.message}"
                </p>
              </div>

              {/* Indicateur de chargement */}
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

              {/* Fil des messages échangés */}
              {messages.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 my-2">
                    <div className="h-px bg-outline-variant/20 flex-1"></div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Fil des échanges
                    </span>
                    <div className="h-px bg-outline-variant/20 flex-1"></div>
                  </div>

                  {messages.map((msg) => {
                    const isRecruiter = msg.sender_role === 'recruiter'
                    const player = playersMap[selectedRequest.player_id]

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col space-y-1 max-w-[85%] sm:max-w-[75%] ${
                          isRecruiter ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant px-1">
                          <span className={`font-semibold ${isRecruiter ? 'text-primary' : 'text-secondary'}`}>
                            {isRecruiter ? 'Vous (Recruteur)' : player?.full_name || 'Joueur'}
                          </span>
                          <span>· {formatDate(msg.created_at)}</span>
                        </div>
                        <div
                          className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                            isRecruiter
                              ? 'bg-primary text-on-primary rounded-tr-xs font-medium'
                              : 'bg-secondary-container/30 border border-secondary/25 text-white rounded-tl-xs'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Si aucun échange en dehors du message initial */}
              {!loadingMessages && messages.length === 0 && (
                <div className="text-center py-6 px-4 bg-surface-container-low/50 rounded-2xl border border-outline-variant/15 text-xs text-on-surface-variant space-y-1">
                  <span className="material-symbols-outlined text-[24px] text-outline">hourglass_empty</span>
                  <p className="font-semibold text-on-surface">En attente de réponse du joueur</p>
                  <p>Le joueur a été notifié de votre prise de contact sur son tableau de bord.</p>
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
                    placeholder="Écrire un message au joueur..."
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
    </section>
  )
}
