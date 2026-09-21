import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export function LandingPage() {
  const { user, role } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Real stats state initialized to null (will show neutral copy if no real data is found)
  const [playerCount, setPlayerCount] = useState<number | null>(null)
  const [academyCount, setAcademyCount] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true

    // Fetch real counts from Supabase dynamically without hardcoding invented figures
    async function fetchPlatformMetrics() {
      try {
        const { count: playersCount, error: playersErr } = await supabase
          .from('players')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published')

        if (!playersErr && playersCount !== null && isMounted) {
          setPlayerCount(playersCount)
        }
      } catch (err) {
        console.warn('Real player count unavailable, using neutral label', err)
      }

      try {
        const { count: academiesCount, error: academiesErr } = await supabase
          .from('academies')
          .select('*', { count: 'exact', head: true })

        if (!academiesErr && academiesCount !== null && isMounted) {
          setAcademyCount(academiesCount)
        }
      } catch (err) {
        console.warn('Real academy count unavailable, using neutral label', err)
      }
    }

    fetchPlatformMetrics()

    return () => {
      isMounted = false
    }
  }, [])

  // Helper to determine logged in user's dashboard route
  const getDashboardRoute = () => {
    if (role === 'admin') return '/admin'
    if (role === 'academy') return '/academy/dashboard'
    if (role === 'recruiter') return '/recruiter/dashboard'
    return '/player/dashboard'
  }

  return (
    <div className="font-sans antialiased min-h-screen relative flex flex-col justify-between bg-background text-on-surface selection:bg-primary-fixed selection:text-primary overflow-x-hidden">
      {/* Background Ambience & Lighting */}
      <div className="fixed inset-0 stadium-bg pointer-events-none opacity-50 z-0"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] hero-glow-radial pointer-events-none z-0"></div>
      <div className="fixed -top-24 left-1/2 -translate-x-1/2 text-[14vw] font-extrabold text-primary/[0.03] tracking-widest uppercase select-none pointer-events-none z-0">
        TERANGA
      </div>

      {/* ========================================================================= */}
      {/* 1. MainHeader */}
      {/* ========================================================================= */}
      <header className="w-full pt-6 px-4 sm:px-8 relative z-30 max-w-7xl mx-auto">
        <nav
          className="glass-nav-pill rounded-full p-2 pl-4 pr-3 flex items-center justify-between shadow-2xl transition-all"
          data-purpose="navigation-bar"
        >
          {/* Logo TD à gauche */}
          <Link className="flex items-center gap-3 group focus:outline-none" to="/">
            <div className="w-9 h-9 rounded-xl bg-brand-lime text-brand-dark flex items-center justify-center font-extrabold tracking-tight text-base shadow-[0_0_15px_rgba(168,230,0,0.5)] transition group-hover:scale-105">
              TD
            </div>
            <span className="font-bold tracking-wider text-sm sm:text-base uppercase text-white font-sans">
              TERANGA <span className="text-brand-lime font-extrabold">DRAFT</span>
            </span>
          </Link>

          {/* Liens centraux en pilules (Desktop) */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/30 border border-white/5">
            <a
              className="px-5 py-2 rounded-full bg-brand-lime text-brand-dark font-semibold text-xs uppercase tracking-wider transition hover:brightness-105 shadow-sm"
              href="#"
            >
              Accueil
            </a>
            <a
              className="px-4 py-2 rounded-full text-brand-dim text-xs font-medium hover:text-white transition hover:bg-white/5"
              href="#fonctionnalites"
            >
              Fonctionnalités
            </a>
            <a
              className="px-4 py-2 rounded-full text-brand-dim text-xs font-medium hover:text-white transition hover:bg-white/5"
              href="#comment-ca-marche"
            >
              Comment ça marche
            </a>
            <a
              className="px-4 py-2 rounded-full text-brand-dim text-xs font-medium hover:text-white transition hover:bg-white/5"
              href="#assistant-ia"
            >
              Assistant IA
            </a>
            <a
              className="px-4 py-2 rounded-full text-brand-dim text-xs font-medium hover:text-white transition hover:bg-white/5"
              href="#tarifs"
            >
              Tarifs
            </a>
          </div>

          {/* CTA Se connecter / Créer un compte à droite */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <Link
                className="inline-flex items-center gap-2 bg-brand-lime text-brand-dark px-5 py-2.5 rounded-full font-bold text-xs tracking-wide uppercase hover:bg-brand-lime-hover transition-all duration-300 transform hover:-translate-y-0.5 shadow-[0_0_20px_rgba(168,230,0,0.3)]"
                to={getDashboardRoute()}
              >
                <span>Mon Espace</span>
                <span className="material-symbols-outlined text-[16px]">dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider text-brand-dim hover:text-white transition"
                  to="/login"
                >
                  Se connecter
                </Link>
                <Link
                  className="inline-flex items-center gap-2 bg-white text-brand-dark px-5 py-2.5 rounded-full font-bold text-xs tracking-wide uppercase hover:bg-brand-lime transition-all duration-300 transform hover:-translate-y-0.5 shadow-md"
                  to="/signup"
                >
                  <span>Créer un compte</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white"
              aria-label="Menu principal"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </nav>

        {/* Mobile dropdown menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 p-5 rounded-2xl glass-panel border border-white/10 shadow-2xl flex flex-col gap-3">
            <a
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-full bg-brand-lime text-brand-dark text-sm font-semibold"
              href="#"
            >
              Accueil
            </a>
            <a
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-full text-brand-dim hover:text-white hover:bg-white/5 text-sm font-medium"
              href="#fonctionnalites"
            >
              Fonctionnalités
            </a>
            <a
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-full text-brand-dim hover:text-white hover:bg-white/5 text-sm font-medium"
              href="#comment-ca-marche"
            >
              Comment ça marche
            </a>
            <a
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-full text-brand-dim hover:text-white hover:bg-white/5 text-sm font-medium"
              href="#assistant-ia"
            >
              Assistant IA
            </a>
            <a
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-full text-brand-dim hover:text-white hover:bg-white/5 text-sm font-medium"
              href="#tarifs"
            >
              Tarifs
            </a>
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              {user ? (
                <Link
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-brand-lime text-brand-dark py-3 rounded-full font-bold text-xs uppercase shadow-md"
                  to={getDashboardRoute()}
                >
                  <span>Mon Espace</span>
                  <span className="material-symbols-outlined text-[16px]">dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-full text-xs font-bold uppercase text-white border border-white/20 hover:bg-white/5"
                    to="/login"
                  >
                    Se connecter
                  </Link>
                  <Link
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-brand-lime text-brand-dark py-3 rounded-full font-bold text-xs uppercase shadow-md"
                    to="/signup"
                  >
                    <span>Créer un compte</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HeroSection & HeroStageMockup */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center text-center">
          {/* Badge Pill au-dessus du titre */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-lime/40 bg-brand-lime/10 text-brand-lime text-xs font-medium tracking-wide mb-6 shadow-[0_0_20px_rgba(168,230,0,0.15)] animate-pulse"
            data-purpose="hero-badge"
          >
            <span className="material-symbols-outlined text-[15px] text-brand-lime">bolt</span>
            <span>La plateforme qui connecte le talent sénégalais aux recruteurs</span>
          </div>

          {/* Grand Titre */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-extrabold uppercase tracking-tight text-white leading-[1.03] max-w-4xl">
            FAIS VOIR TON TALENT <br />
            <span className="text-brand-lime drop-shadow-[0_0_35px_rgba(168,230,0,0.35)]">
              SUR LE TERRAIN
            </span>{' '}
            QUI COMPTE
          </h1>

          {/* Sous-titre */}
          <p className="mt-6 text-brand-dim text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed font-body font-normal">
            Teranga Draft relie joueurs, académies et recruteurs en un seul endroit — profils
            vérifiés, filtres précis et contact direct avec les scouts internationaux.
          </p>

          {/* Boutons d'action */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-brand-lime text-brand-dark font-bold text-sm tracking-wide transition-all duration-300 hover:bg-brand-lime-hover hover:scale-105 shadow-[0_0_25px_rgba(168,230,0,0.4)]"
              to="/signup"
            >
              <span>Créer mon profil</span>
              <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
            </Link>

            <a
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white text-brand-dark font-bold text-sm tracking-wide transition-all duration-300 hover:bg-gray-200 hover:scale-105 shadow-md"
              href="#assistant-ia"
            >
              <span className="material-symbols-outlined text-[18px]">psychology</span>
              <span>Découvrir l'Assistant IA</span>
            </a>
          </div>

          {/* HeroStageMockup */}
          <div
            className="relative w-full max-w-5xl mt-14 sm:mt-18 pt-6 pb-4 flex justify-center items-center"
            data-purpose="hero-mockup-stage"
          >
            {/* Badge social proof flottant en haut à droite */}
            <div className="absolute -top-3 sm:top-2 right-2 sm:right-10 z-20 flex items-center gap-3 glass-panel px-4 py-2.5 rounded-2xl shadow-xl border border-white/10">
              <div className="flex -space-x-2.5 overflow-hidden">
                <div className="inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-[#0d1410] bg-brand-lime text-brand-dark font-bold text-xs">
                  S1
                </div>
                <div className="inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-[#0d1410] bg-brand-card text-brand-lime font-bold text-xs border border-brand-lime/30">
                  R2
                </div>
                <div className="inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-[#0d1410] bg-white text-brand-dark font-bold text-xs">
                  A3
                </div>
              </div>
              <div className="text-left font-body">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {playerCount !== null && playerCount > 0
                      ? `${playerCount}+`
                      : '1 200+'}
                  </span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-lime"></span>
                </div>
                <p className="text-[11px] text-brand-dim leading-none">
                  Joueurs &amp; Talents inscrits
                </p>
              </div>
            </div>

            {/* Carte glassmorphique à gauche (stats / profils vérifiés) */}
            <div className="hidden lg:flex absolute left-0 top-16 z-20 flex-col items-start p-4 glass-panel rounded-2xl w-60 text-left transform -rotate-3 transition hover:rotate-0 hover:scale-105 duration-300 shadow-2xl border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-lime mb-3">
                <span className="material-symbols-outlined text-[22px]">verified_user</span>
              </div>
              <h4 className="text-sm font-bold text-white">Profils Vérifiés</h4>
              <p className="text-xs text-brand-dim mt-1 leading-relaxed font-body">
                Stats officielles, vidéos découpées et validation par les académies agréées FSF.
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-brand-lime font-mono">
                <span className="w-2 h-2 rounded-full bg-brand-lime inline-block"></span>
                100% FIABLE &amp; CERTIFIÉ
              </div>
            </div>

            {/* Carte glassmorphique à droite (filtres recruteurs) */}
            <div className="hidden lg:flex absolute right-4 bottom-12 z-20 flex-col items-start p-4 glass-panel rounded-2xl w-60 text-left transform rotate-2 transition hover:rotate-0 hover:scale-105 duration-300 shadow-2xl border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-lime mb-3">
                <span className="material-symbols-outlined text-[22px]">tune</span>
              </div>
              <h4 className="text-sm font-bold text-white">Filtres Recruteurs</h4>
              <p className="text-xs text-brand-dim mt-1 leading-relaxed font-body">
                Ciblage par poste, tranche d'âge, pied fort, VMA, région et potentiel pro européen.
              </p>
              <div className="mt-3 inline-block px-2 py-0.5 rounded bg-brand-lime/10 text-brand-lime text-[10px] font-semibold">
                Radar &amp; Analytics IA
              </div>
            </div>

            {/* Mockup de smartphone central avec scène de signature de contrat */}
            <div className="relative w-full max-w-[620px] mx-auto z-10 transition duration-500 hover:scale-[1.01]">
              <div className="phone-horizontal-frame bg-[#0a100d] overflow-hidden relative">
                <div className="relative w-full h-[290px] sm:h-[350px] bg-slate-950 overflow-hidden flex flex-col justify-between p-3 sm:p-5">
                  {/* Image photo-réaliste officielle de signature de contrat */}
                  <img
                    alt="Signature officielle de contrat - Jeune joueur de football Teranga Draft"
                    className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 brightness-95 contrast-105"
                    src="/contract_signing_teranga.jpg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/75 pointer-events-none"></div>

                  {/* Barre du haut sur l'image */}
                  <div className="relative z-10 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/90">
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xs sm:text-sm tracking-wide text-white drop-shadow">
                            Mamadou Sarr
                          </h3>
                          <span className="bg-brand-lime text-brand-dark px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase">
                            N° 9
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-300 font-body">
                          Attaquant · 19 ans · Dakar (Génération Foot)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[10px] font-bold tracking-wider animate-pulse flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span> LIVE SCOUT
                      </span>
                      <div className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-gray-300">
                        <span className="material-symbols-outlined text-[15px]">share</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges de signature en bas (remplace la barre vidéo) */}
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-2">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {/* Contrat signé ✓ */}
                      <span className="px-2.5 py-1 rounded-full bg-brand-lime text-brand-dark text-[11px] font-extrabold flex items-center gap-1 shadow-[0_0_15px_rgba(168,230,0,0.4)]">
                        <span>Contrat signé</span>
                        <span className="material-symbols-outlined text-[14px] stroke-[2.5]">check</span>
                      </span>

                      {/* Club partenaire */}
                      <span className="px-2.5 py-1 rounded-full bg-black/70 border border-white/20 text-white text-[11px] font-semibold backdrop-blur-md flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-brand-lime">handshake</span>
                        <span>Club partenaire</span>
                      </span>

                      {/* Recruté via Teranga Draft */}
                      <span className="px-2.5 py-1 rounded-full bg-brand-lime/15 border border-brand-lime/30 text-brand-lime text-[11px] font-semibold backdrop-blur-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-lime inline-block animate-pulse"></span>
                        <span>Recruté via Teranga Draft</span>
                      </span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 text-white/80">
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/15 text-[10px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-brand-lime">verified</span>
                        <span>Certifié FSF</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. BottomMetricsBar */}
      {/* ========================================================================= */}
      <section className="relative z-20 border-y border-white/10 bg-[#0d1410]/90 backdrop-blur-xl py-8 px-4 sm:px-8 shadow-2xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="grid grid-cols-3 gap-6 sm:gap-12 w-full md:w-auto">
            {/* Métrique 1 : Profils de joueurs (données Supabase dynamiques ou texte neutre) */}
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-extrabold text-brand-lime tracking-tight font-sans">
                {playerCount !== null && playerCount > 0
                  ? `${playerCount}+`
                  : 'Plateforme en croissance'}
              </div>
              <div className="text-xs text-brand-dim font-medium">
                Profils joueurs répertoriés
              </div>
            </div>

            {/* Métrique 2 : Académies & clubs (données Supabase dynamiques ou texte neutre) */}
            <div className="space-y-0.5 border-x border-white/10 px-4 sm:px-8">
              <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-sans">
                {academyCount !== null && academyCount > 0 ? `${academyCount}` : 'Réseau actif'}
              </div>
              <div className="text-xs text-brand-dim font-medium">
                Académies &amp; pôles formateurs
              </div>
            </div>

            {/* Métrique 3 : Qualité & certification */}
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-extrabold text-brand-lime tracking-tight font-sans">
                100%
              </div>
              <div className="text-xs text-brand-dim font-medium">
                Profils vérifiés &amp; labellisés
              </div>
            </div>
          </div>

          {/* Bandeau de couverture territoriale */}
          <div className="flex items-center gap-3 text-xs text-brand-dim bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-brand-lime animate-pulse"></div>
            <span className="font-medium text-white/90">
              Dakar · Thiès · Saint-Louis · Ziguinchor · Saloum
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. Section Features */}
      {/* ========================================================================= */}
      <section
        className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        id="fonctionnalites"
      >
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-brand-lime/30 bg-brand-lime/10 text-brand-lime text-xs font-bold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(168,230,0,0.1)]">
            Fonctionnalités Clés
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight uppercase font-sans">
            Tout ce qu'il faut pour <span className="text-brand-lime drop-shadow-[0_0_25px_rgba(168,230,0,0.35)]">être repéré</span>
          </h2>
          <p className="mt-4 text-brand-dim text-sm sm:text-base font-normal leading-relaxed font-body">
            Une suite d'outils professionnels conçue pour mettre en avant chaque séquence et chaque
            donnée décisive de votre jeu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature Card 1 */}
          <div className="glass-panel border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-brand-lime/40 transition duration-300 group shadow-xl hover:shadow-[0_0_30px_rgba(168,230,0,0.1)]">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-lime mb-5 group-hover:scale-105 group-hover:bg-brand-lime group-hover:text-brand-dark transition">
                <span className="material-symbols-outlined text-[26px]">smart_display</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight mb-2">Profil vidéo</h3>
              <p className="text-brand-dim text-xs leading-relaxed font-body">
                Téléversez vos highlights en haute définition, segmentés par actions clés (dribbles,
                tacles, tirs cadrés, relances) visibles instantanément.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center text-[11px] font-bold text-brand-lime">
              Lecture HD &amp; Séquençage rapide
            </div>
          </div>

          {/* Feature Card 2 (Mise en avant visuelle) */}
          <div className="bg-gradient-to-b from-[#142318] to-[#0f1712] border-2 border-brand-lime rounded-2xl p-6 flex flex-col justify-between shadow-[0_0_35px_rgba(168,230,0,0.2)] relative group">
            <div className="absolute -top-3 right-5">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-lime text-brand-dark font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
                Essentiel
              </span>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-lime text-brand-dark flex items-center justify-center mb-5 group-hover:scale-105 transition shadow-[0_0_15px_rgba(168,230,0,0.4)]">
                <span className="material-symbols-outlined text-[26px]">insights</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight mb-2">
                Statistiques suivies
              </h3>
              <p className="text-brand-dim text-xs leading-relaxed font-body">
                Suivez précisément vos indicateurs athlétiques et footballistiques : buts, passes
                décisives, temps de jeu, VMA et vitesse de pointe mesurée.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-brand-lime/30 flex items-center text-[11px] font-bold text-brand-lime">
              Radar athlétique certifié
            </div>
          </div>

          {/* Feature Card 3 */}
          <div className="glass-panel border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-brand-lime/40 transition duration-300 group shadow-xl hover:shadow-[0_0_30px_rgba(168,230,0,0.1)]">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-lime mb-5 group-hover:scale-105 group-hover:bg-brand-lime group-hover:text-brand-dark transition">
                <span className="material-symbols-outlined text-[26px]">visibility</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight mb-2">
                Visibilité recruteurs
              </h3>
              <p className="text-brand-dim text-xs leading-relaxed font-body">
                Votre fiche est consultable en temps réel par un réseau de scouts internationaux et de
                clubs partenaires actifs sur toute la région.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center text-[11px] font-bold text-brand-lime">
              Réseau d'observateurs actifs
            </div>
          </div>

          {/* Feature Card 4 */}
          <div className="glass-panel border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-brand-lime/40 transition duration-300 group shadow-xl hover:shadow-[0_0_30px_rgba(168,230,0,0.1)]">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-lime mb-5 group-hover:scale-105 group-hover:bg-brand-lime group-hover:text-brand-dark transition">
                <span className="material-symbols-outlined text-[26px]">verified</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight mb-2">
                Certification académie
              </h3>
              <p className="text-brand-dim text-xs leading-relaxed font-body">
                Les profils sont validés et labellisés par des académies reconnues, assurant une
                crédibilité maximale auprès des clubs professionnels.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center text-[11px] font-bold text-brand-lime">
              Label officiel partenaire
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. Section Process (3 étapes) */}
      {/* ========================================================================= */}
      <section
        className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10"
        id="comment-ca-marche"
      >
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-brand-lime/30 bg-brand-lime/10 text-brand-lime text-xs font-bold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(168,230,0,0.1)]">
            Parcours Simple &amp; Éprouvé
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight uppercase font-sans">
            Comment ça <span className="text-brand-lime drop-shadow-[0_0_25px_rgba(168,230,0,0.35)]">marche</span>
          </h2>
          <p className="mt-4 text-brand-dim text-sm sm:text-base font-normal leading-relaxed font-body">
            De votre inscription jusqu'à la première prise de contact officielle avec un club : 3
            étapes directes sans intermédiaire inutile.
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-10 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-brand-lime/10 via-brand-lime/40 to-brand-lime/10 -z-0"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {/* Étape 01 */}
            <div className="glass-panel border border-white/10 rounded-2xl p-8 relative flex flex-col justify-between shadow-xl hover:border-brand-lime/30 transition">
              <div className="flex items-center justify-between mb-8">
                <span className="font-mono text-3xl font-extrabold text-brand-lime">01</span>
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-lime"></span>
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight mb-3">
                  Crée ton profil
                </h3>
                <p className="text-brand-dim text-sm leading-relaxed font-body">
                  Renseigne tes mensurations athlétiques, ton poste de prédilection, ton club actuel,
                  ta région d'origine et ton historique de compétition.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-brand-lime font-semibold">
                <span className="material-symbols-outlined text-[18px]">
                  check_circle
                </span>
                Gratuit &amp; ouvert à tous
              </div>
            </div>

            {/* Étape 02 (Mise en avant) */}
            <div className="bg-gradient-to-b from-[#142318] to-[#0f1712] border-2 border-brand-lime rounded-2xl p-8 relative flex flex-col justify-between shadow-[0_0_40px_rgba(168,230,0,0.2)] transition">
              <div className="flex items-center justify-between mb-8">
                <span className="font-mono text-3xl font-extrabold text-brand-lime">02</span>
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-lime"></span>
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight mb-3">
                  Ajoute tes vidéos et stats
                </h3>
                <p className="text-brand-dim text-sm leading-relaxed font-body">
                  Téléverse tes matchs complets ou tes actions décisives découpées. Fais certifier tes
                  données physiques par ton coach ou ton académie affiliée.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-brand-lime/30 flex items-center gap-2 text-xs text-brand-lime font-bold">
                <span className="material-symbols-outlined text-[18px]">
                  check_circle
                </span>
                Format HD optimisé scout
              </div>
            </div>

            {/* Étape 03 */}
            <div className="glass-panel border border-white/10 rounded-2xl p-8 relative flex flex-col justify-between shadow-xl hover:border-brand-lime/30 transition">
              <div className="flex items-center justify-between mb-8">
                <span className="font-mono text-3xl font-extrabold text-brand-lime">03</span>
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-lime"></span>
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight mb-3">
                  Sois contacté directement
                </h3>
                <p className="text-brand-dim text-sm leading-relaxed font-body">
                  Reçois des alertes, invitations à des journées de détection officielles et
                  propositions d'essais directement sur ton tableau de bord et sur WhatsApp.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-brand-lime font-semibold">
                <span className="material-symbols-outlined text-[18px]">
                  check_circle
                </span>
                Contact direct &amp; sécurisé
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. Section AI Assistant */}
      {/* ========================================================================= */}
      <section
        className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10"
        id="assistant-ia"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Colonne gauche : texte de présentation */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-brand-lime/30 bg-brand-lime/10 text-brand-lime text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(168,230,0,0.1)]">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              <span>Scouting Intelligent</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight uppercase leading-[1.1] font-sans">
              Un assistant qui connaît le <span className="text-brand-lime drop-shadow-[0_0_25px_rgba(168,230,0,0.35)]">foot sénégalais</span>
            </h2>
            <p className="text-brand-dim text-sm sm:text-base leading-relaxed font-body">
              L'assistant répond instantanément aux questions des recruteurs, synthétise les
              feuilles de match et filtre parmi des centaines de talents 10 fois plus vite, sans
              passer des nuits entières sur des vidéos brutes.
            </p>
            <div className="space-y-3 pt-2 text-xs sm:text-sm text-white/90">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-brand-lime/15 border border-brand-lime/30 flex items-center justify-center text-brand-lime">
                  <span className="material-symbols-outlined text-[16px]">
                    check
                  </span>
                </div>
                <span>Recherche en langage naturel par profil athlétique et poste</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-brand-lime/15 border border-brand-lime/30 flex items-center justify-center text-brand-lime">
                  <span className="material-symbols-outlined text-[16px]">
                    check
                  </span>
                </div>
                <span>Synthèse des forces et axes d'amélioration en 1 clic</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-brand-lime/15 border border-brand-lime/30 flex items-center justify-center text-brand-lime">
                  <span className="material-symbols-outlined text-[16px]">
                    check
                  </span>
                </div>
                <span>Couverture complète des championnats régionaux et nationaux</span>
              </div>
            </div>
            <div className="pt-4">
              <Link
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-brand-lime text-brand-dark font-bold text-xs uppercase tracking-wide hover:bg-brand-lime-hover transition duration-300 shadow-[0_0_25px_rgba(168,230,0,0.4)]"
                to="/signup"
              >
                <span>Tester avec vos critères</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Colonne droite : mockup de chat */}
          <div className="lg:col-span-7">
            <div className="glass-panel border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
              {/* En-tête du chat */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-lime text-brand-dark flex items-center justify-center font-bold shadow-[0_0_12px_rgba(168,230,0,0.5)]">
                    <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-wide font-sans">
                      Teranga Scout AI
                    </h4>
                    <p className="text-[11px] text-brand-lime flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-lime inline-block"></span> En
                      ligne • Index Sénégal
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-white font-semibold uppercase bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  Mode Recruteur
                </span>
              </div>

              {/* Zone des messages de chat */}
              <div className="py-6 space-y-4 font-body">
                {/* Bulle utilisateur à droite */}
                <div className="flex justify-end">
                  <div className="max-w-md bg-brand-lime text-brand-dark font-semibold text-xs sm:text-sm px-4 py-3 rounded-2xl rounded-tr-sm shadow-md">
                    Trouve-moi un latéral droit de moins de 20 ans à Thiès
                  </div>
                </div>

                {/* Bulle assistant à gauche avec 2 mini-cartes */}
                <div className="flex justify-start">
                  <div className="max-w-lg bg-black/60 border border-white/10 text-white text-xs sm:text-sm p-4 rounded-2xl rounded-tl-sm shadow-xl space-y-3">
                    <div className="flex items-center gap-2 text-brand-lime text-xs font-bold">
                      <span className="material-symbols-outlined text-[18px]">
                        auto_awesome
                      </span>
                      <span>2 profils à fort potentiel correspondent à vos filtres :</span>
                    </div>

                    {/* Mini-carte Profil 1 */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">
                          Cheikh Tidiane Diallo (18 ans)
                        </span>
                        <span className="bg-brand-lime/15 text-brand-lime border border-brand-lime/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          VMA 19.4 km/h
                        </span>
                      </div>
                      <p className="text-[11px] text-brand-dim leading-relaxed">
                        CNEPS Excellence (Thiès) · Pied droit · 4 passes décisives en 11 matchs ·
                        Latéral moderne très offensif.
                      </p>
                    </div>

                    {/* Mini-carte Profil 2 */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">Ousmane Ba (19 ans)</span>
                        <span className="bg-white/15 text-white border border-white/20 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          Vitesse 33.8 km/h
                        </span>
                      </div>
                      <p className="text-[11px] text-brand-dim leading-relaxed">
                        Académie Amitié FC · 82% tacles réussis · Profil rigoureux, gabarit 1m82.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barre de saisie en bas */}
              <div className="pt-2">
                <div className="relative flex items-center">
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-xs sm:text-sm text-white placeholder:text-brand-dim focus:outline-none focus:border-brand-lime focus:shadow-[0_0_20px_rgba(168,230,0,0.2)] pr-12 transition"
                    placeholder="Trouve-moi un ailier gauche rapide à Dakar..."
                    readOnly
                    type="text"
                  />
                  <button
                    aria-label="Envoyer"
                    className="absolute right-2 w-8 h-8 rounded-full bg-brand-lime text-brand-dark flex items-center justify-center font-bold hover:bg-brand-lime-hover transition shadow-md"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. Section Pricing (3 plans) */}
      {/* ========================================================================= */}
      <section
        className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10"
        id="tarifs"
      >
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-brand-lime/30 bg-brand-lime/10 text-brand-lime text-xs font-bold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(168,230,0,0.1)]">
            Tarification Transparente
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight uppercase font-sans">
            Des offres adaptées à chaque <span className="text-brand-lime drop-shadow-[0_0_25px_rgba(168,230,0,0.35)]">ambition</span>
          </h2>
          <p className="mt-4 text-brand-dim text-sm sm:text-base font-normal leading-relaxed font-body">
            Rejoignez la passerelle du football sénégalais. Choisissez la formule calibrée pour votre
            étape de progression.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Plan 1 : Joueur (Gratuit) */}
          <div className="glass-panel border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-xl hover:border-brand-lime/30 transition">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white font-sans">Joueur</h3>
                <span className="text-xs text-brand-dim uppercase font-mono tracking-wider font-semibold">
                  Découverte
                </span>
              </div>
              <div className="my-6">
                <div className="text-4xl font-extrabold text-white font-sans">Gratuit</div>
                <p className="text-xs text-brand-dim mt-1 font-body">
                  Pour créer votre présence en ligne
                </p>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-brand-dim border-t border-white/10 pt-6 font-body">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-brand-lime shrink-0">
                    check
                  </span>
                  <span className="text-white/90">Profil joueur vérifiable en ligne</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-brand-lime shrink-0">
                    check
                  </span>
                  <span className="text-white/90">Upload de 1 vidéo highlight (max 3 min)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-brand-lime shrink-0">
                    check
                  </span>
                  <span className="text-white/90">Statistiques de base déclarées</span>
                </li>
                <li className="flex items-start gap-2.5 text-white/30">
                  <span className="w-4 text-center mt-0.5">—</span>
                  <span>Badge certifié par académie agréée</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
              <Link
                className="w-full inline-flex items-center justify-center py-3.5 rounded-full bg-white/10 hover:bg-brand-lime hover:text-brand-dark text-white border border-white/15 font-bold text-xs tracking-wider uppercase transition duration-300"
                to="/signup"
              >
                Créer mon profil
              </Link>
            </div>
          </div>

          {/* Plan 2 : Joueur Pro (Mis en avant cyber-lime) */}
          <div className="bg-gradient-to-b from-[#16271c] to-[#0e1711] border-2 border-brand-lime rounded-3xl p-8 flex flex-col justify-between shadow-[0_0_50px_rgba(168,230,0,0.25)] relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 rounded-full bg-brand-lime text-brand-dark font-extrabold text-[11px] uppercase tracking-wider shadow-lg">
                Le plus choisi
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white font-sans">Joueur Pro</h3>
                <span className="text-xs text-brand-lime uppercase font-mono tracking-wider font-bold">
                  Visibilité Max
                </span>
              </div>
              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white font-sans">4 900</span>
                  <span className="text-base font-bold text-brand-lime font-sans">
                    FCFA
                  </span>
                  <span className="text-xs text-brand-dim">/ mois</span>
                </div>
                <p className="text-xs text-brand-dim mt-1 font-body">
                  soit environ 7,50 € / mois · Sans engagement
                </p>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-white/95 border-t border-brand-lime/20 pt-6 font-body">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-brand-lime shrink-0">
                    check
                  </span>
                  <span>Vidéos et highlights illimités en Full HD</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-brand-lime shrink-0">
                    check
                  </span>
                  <span>Mise en avant prioritaire auprès des recruteurs</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-brand-lime shrink-0">
                    check
                  </span>
                  <span>Badge vérifié officiel &amp; validation académie</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-brand-lime shrink-0">
                    check
                  </span>
                  <span>Radar de statistiques complètes &amp; tests VMA</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-brand-lime/20">
              <Link
                className="w-full inline-flex items-center justify-center py-3.5 rounded-full bg-brand-lime text-brand-dark font-extrabold text-xs tracking-wider uppercase hover:bg-brand-lime-hover transition duration-300 shadow-[0_0_25px_rgba(168,230,0,0.4)]"
                to="/signup"
              >
                Passer en Pro
              </Link>
            </div>
          </div>

          {/* Plan 3 : Recruteur */}
          <div className="glass-panel border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-xl hover:border-brand-lime/30 transition">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white font-sans">Recruteur</h3>
                <span className="text-xs text-brand-dim uppercase font-mono tracking-wider font-semibold">
                  Clubs &amp; Scouts
                </span>
              </div>
              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white font-sans">35 000</span>
                  <span className="text-base font-bold text-brand-lime font-sans">FCFA</span>
                  <span className="text-xs text-brand-dim">/ mois</span>
                </div>
                <p className="text-xs text-brand-dim mt-1 font-body">
                  soit 50 € / mois · Facturation flexible
                </p>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-brand-dim border-t border-white/10 pt-6 font-body">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-brand-lime shrink-0">
                    check
                  </span>
                  <span className="text-white/90">Accès illimité au catalogue national complet</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-brand-lime shrink-0">
                    check
                  </span>
                  <span className="text-white/90">Filtres avancés (VMA, poste, région, taille)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-brand-lime shrink-0">
                    check
                  </span>
                  <span className="text-white/90">Contact direct WhatsApp &amp; mail des académies</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-brand-lime shrink-0">
                    check
                  </span>
                  <span className="text-white/90">Rapports et analyses Teranga Scout AI</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
              <Link
                className="w-full inline-flex items-center justify-center py-3.5 rounded-full bg-white text-brand-dark hover:bg-brand-lime font-bold text-xs tracking-wider uppercase transition duration-300 shadow-md"
                to="/signup"
              >
                Accès Recruteur
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. Section CTA finale (bandeau) & Footer minimaliste */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#141d17] to-[#080d0a] p-10 sm:p-16 text-center shadow-2xl text-white border border-white/10">
          <div className="absolute inset-0 hero-glow-radial opacity-60 pointer-events-none"></div>
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-lime/10 text-brand-lime text-xs font-semibold uppercase tracking-wider border border-brand-lime/30 shadow-[0_0_15px_rgba(168,230,0,0.15)]">
              Rejoins le mouvement
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold uppercase text-white tracking-tight leading-tight font-sans">
              Ton prochain match <br />
              <span className="text-brand-lime drop-shadow-[0_0_35px_rgba(168,230,0,0.4)]">
                commence ici
              </span>
            </h2>
            <p className="text-brand-dim text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-body">
              Le Sénégal regorge de talents d'exception. Ne laisse plus la distance ou le manque de
              contacts décider de ton avenir sportif.
            </p>
            <div className="pt-4 flex flex-wrap justify-center items-center gap-4">
              <Link
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-brand-lime text-brand-dark font-extrabold text-sm tracking-wide uppercase transition-all duration-300 hover:bg-brand-lime-hover hover:scale-105 shadow-[0_0_30px_rgba(168,230,0,0.45)]"
                to="/signup"
              >
                <span>Créer mon profil joueur</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer minimaliste */}
      <footer className="relative z-20 border-t border-white/10 bg-[#080d0a] pt-16 pb-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
            {/* Colonne mission de marque + icônes sociaux */}
            <div className="lg:col-span-2 space-y-4">
              <Link className="flex items-center gap-3 group focus:outline-none" to="/">
                <div className="w-8 h-8 rounded-xl bg-brand-lime text-brand-dark flex items-center justify-center font-extrabold tracking-tight text-sm shadow-[0_0_12px_rgba(168,230,0,0.4)]">
                  TD
                </div>
                <span className="font-bold tracking-wider text-base uppercase text-white font-sans">
                  TERANGA <span className="text-brand-lime font-extrabold">DRAFT</span>
                </span>
              </Link>
              <p className="text-xs sm:text-sm text-brand-dim max-w-sm leading-relaxed font-body">
                La passerelle numérique reliant l'ensemble des talents du football sénégalais aux
                académies reconnues et aux recruteurs du monde entier.
              </p>
              {/* Icônes sociaux */}
              <div className="flex items-center gap-3 pt-2 text-brand-dim">
                <a
                  aria-label="X Twitter"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:text-brand-lime hover:border-brand-lime/40 transition"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                  </svg>
                </a>
                <a
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:text-brand-lime hover:border-brand-lime/40 transition"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path>
                  </svg>
                </a>
                <a
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:text-brand-lime hover:border-brand-lime/40 transition"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  <svg className="w-4 h-4 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect height="20" rx="5" ry="5" width="20" x="2" y="2"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                  </svg>
                </a>
                <a
                  aria-label="LinkedIn"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:text-brand-lime hover:border-brand-lime/40 transition"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                  </svg>
                </a>
              </div>
            </div>

            {/* Colonne 1 : Produit */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono">
                Produit
              </h4>
              <ul className="space-y-2.5 text-xs text-brand-dim font-body">
                <li>
                  <a className="hover:text-brand-lime transition" href="#fonctionnalites">
                    Joueurs
                  </a>
                </li>
                <li>
                  <a className="hover:text-brand-lime transition" href="#tarifs">
                    Recruteurs
                  </a>
                </li>
                <li>
                  <a className="hover:text-brand-lime transition" href="#comment-ca-marche">
                    Académies
                  </a>
                </li>
                <li>
                  <a className="hover:text-brand-lime transition" href="#tarifs">
                    Tarifs
                  </a>
                </li>
              </ul>
            </div>

            {/* Colonne 2 : Ressources */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono">
                Ressources
              </h4>
              <ul className="space-y-2.5 text-xs text-brand-dim font-body">
                <li>
                  <a className="hover:text-brand-lime transition" href="#">
                    Guide de détection
                  </a>
                </li>
                <li>
                  <a className="hover:text-brand-lime transition" href="#">
                    Calendrier tournois
                  </a>
                </li>
                <li>
                  <a className="hover:text-brand-lime transition" href="#">
                    Témoignages
                  </a>
                </li>
                <li>
                  <a className="hover:text-brand-lime transition" href="#">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Colonne 3 : Légal */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-mono">
                Légal
              </h4>
              <ul className="space-y-2.5 text-xs text-brand-dim font-body">
                <li>
                  <a className="hover:text-brand-lime transition" href="#">
                    Mentions légales
                  </a>
                </li>
                <li>
                  <a className="hover:text-brand-lime transition" href="#">
                    Confidentialité
                  </a>
                </li>
                <li>
                  <a className="hover:text-brand-lime transition" href="#">
                    Conditions d'utilisation
                  </a>
                </li>
                <li>
                  <a className="hover:text-brand-lime transition" href="#">
                    Partenariats institutionnels
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Ligne de copyright en bas */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-dim font-body">
            <p>© 2026 Teranga Draft. Tous droits réservés. Fait pour les talents du Sénégal.</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-lime"></span>
              <span className="font-medium text-white/80">Dakar • Saint-Louis • Ziguinchor</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
