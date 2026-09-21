import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { AdminNav } from './AdminNav'
import { getFrenchErrorMessage } from '../../lib/errorUtils'

export interface AcademyItem {
  id: string
  name?: string | null
  academy_name?: string | null
  certification_status?: string | null
  email?: string | null
  [key: string]: any
}

export function AcademyManagement() {
  const [academies, setAcademies] = useState<AcademyItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchAcademies = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: academiesData, error: academiesError } = await supabase
        .from('academy_profiles')
        .select('*')

      if (academiesError) {
        console.error('Erreur lors du chargement de academy_profiles:', academiesError)
        setError(getFrenchErrorMessage(academiesError))
        setAcademies([])
        return
      }

      if (!academiesData || academiesData.length === 0) {
        setAcademies([])
        return
      }

      const profileIds = academiesData.map((a: any) => a.id || a.user_id).filter(Boolean)
      let emailMap: Record<string, string> = {}

      if (profileIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', profileIds)

        if (profilesData) {
          profilesData.forEach((p: any) => {
            if (p.id && p.email) {
              emailMap[p.id] = p.email
            }
          })
        }
      }

      const merged = academiesData.map((acad: any) => {
        const key = acad.id || acad.user_id
        return {
          ...acad,
          email: acad.email || emailMap[key] || 'Email non renseigné',
        }
      })

      setAcademies(merged)
    } catch (err: any) {
      console.error('Erreur inattendue:', err)
      setError(getFrenchErrorMessage(err))
      setAcademies([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAcademies()
  }, [fetchAcademies])

  const handleToggleCertification = async (academy: AcademyItem) => {
    if (!academy.id) return

    setTogglingId(academy.id)

    const isCertified = academy.certification_status === 'certified'
    const nextStatus = isCertified ? 'uncertified' : 'certified'

    try {
      const { data, error } = await supabase
        .from('academy_profiles')
        .update({ certification_status: nextStatus })
        .eq('id', academy.id)
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de la mise à jour de la certification:', error)
      } else if (data) {
        setAcademies((prev) =>
          prev.map((item) =>
            item.id === academy.id
              ? { ...item, certification_status: data.certification_status }
              : item
          )
        )
      }
    } catch (err) {
      console.error('Erreur toggle certification:', err)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans pb-16">
      {/* Top Command Navigation Bar */}
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] uppercase tracking-wider font-bold">
                Homologation Officielle FSF
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">school</span>
              Gestion des Académies
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Validez ou révoquez l'accréditation des centres de formation sénégalais partenaires
            </p>
          </div>

          {!loading && !error && (
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                {academies.length} académie{academies.length > 1 ? 's' : ''} répertoriée{academies.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 bg-error-container/60 border border-error/30 text-on-error-container rounded-2xl text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-[22px]">error</span>
            <div>
              <strong className="font-semibold">Erreur de chargement :</strong> {error}
            </div>
          </div>
        )}

        {/* Table / Cards Container */}
        {loading ? (
          <div className="p-12 bg-surface-container-lowest border border-outline-variant/20 rounded-3xl text-center space-y-3 shadow-sm">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-on-surface-variant font-medium">Chargement des académies partenaires...</p>
          </div>
        ) : academies.length === 0 ? (
          <div className="p-12 bg-surface-container-lowest border border-outline-variant/20 rounded-3xl text-center space-y-2 shadow-sm">
            <span className="material-symbols-outlined text-outline text-[40px]">domain_disabled</span>
            <h3 className="text-base font-bold text-on-surface">Aucune académie trouvée</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Aucun profil d'académie n'est actuellement inscrit dans le système.
            </p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low text-xs uppercase text-on-surface-variant font-bold border-b border-outline-variant/20 tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Centre / Académie</th>
                    <th className="py-4 px-6">Email du compte</th>
                    <th className="py-4 px-6">Statut d'homologation</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {academies.map((acad) => {
                    const isCertified = acad.certification_status === 'certified'
                    const isToggling = togglingId === acad.id
                    const displayName = acad.name || acad.academy_name || 'Académie sans nom'
                    const initials = displayName
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w: string) => w[0]?.toUpperCase())
                      .join('') || 'AC'

                    return (
                      <tr key={acad.id} className="hover:bg-surface-container-low/50 transition-colors">
                        {/* Academy Name & Initials Badge */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-container text-primary-fixed flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {initials}
                            </div>
                            <div>
                              <span className="font-bold text-primary block leading-tight">
                                {displayName}
                              </span>
                              <span className="text-[11px] text-on-surface-variant">
                                Réf: {acad.id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-6 text-on-surface-variant font-medium">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-outline">mail</span>
                            <span>{acad.email}</span>
                          </div>
                        </td>

                        {/* Certification Status Badge */}
                        <td className="py-4 px-6">
                          {isCertified ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-secondary-container/30 text-on-secondary-container border border-secondary/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                              ✓ Homologuée & Certifiée
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                              Non certifiée
                            </span>
                          )}
                        </td>

                        {/* Action Pill Button */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleToggleCertification(acad)}
                            disabled={isToggling}
                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                              isCertified
                                ? 'border border-error/30 text-error hover:bg-error/10 shadow-xs'
                                : 'bg-primary hover:bg-primary-container text-on-primary shadow-sm'
                            }`}
                          >
                            {isToggling ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                <span>Traitement...</span>
                              </>
                            ) : isCertified ? (
                              <>
                                <span className="material-symbols-outlined text-[16px]">close</span>
                                <span>Révoquer certification</span>
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[16px]">verified</span>
                                <span>Certifier l'académie</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

