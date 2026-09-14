import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui'
import { useNotifications } from '../../hooks/useNotifications'
import NotificationBanner from '../ui/NotificationBanner'
import ConnectionLostBanner from '../ui/ConnectionLostBanner'
import PresenceConfirmationBanner from '../missions/PresenceConfirmationBanner'
import ClientDisabledBanner from '../missions/ClientDisabledBanner'
import ResumeH30Banner from '../missions/ResumeH30Banner'
import { useState, useEffect } from 'react'
import { missionsAPI, adminAPI } from '../../api'
import HoverTooltip from '../ui/HoverTooltip'

const MENUS = {
  client: [
      { to: '/client',           icon: '⊞',  label: 'menu.dashboard'   },
      { to: '/client/missions',  icon: '📋',  label: 'menu.missions'    },
      { to: '/client/messages',  icon: '💬',  label: 'menu.messages'    },
      { to: '/client/mes-signalements', icon: '🚨', label: 'menu.mesSignalements' },
      { to: '/client/tickets',   icon: '🎫',  label: 'menu.mesTickets'  },
      { to: '/client/paiements', icon: '💳',  label: 'menu.paiements'   },
      { to: '/client/compte',    icon: '👤',  label: 'menu.compte'      },
    ],

  oeil: [
      { to: '/oeil',                      icon: '⊞',  label: 'menu.dashboard'        },
      { to: '/oeil/missions',             icon: '🎯',  label: 'menu.missions'         },
      { to: '/oeil/messages',             icon: '💬',  label: 'menu.messages'         },
      { to: '/oeil/mes-signalements',     icon: '🚨',  label: 'menu.mesSignalements' },
      { to: '/oeil/tickets',              icon: '🎫',  label: 'menu.mesTickets'      },
      { to: '/oeil/gains',                icon: '💰',  label: 'menu.mesGains'        },
      { to: '/oeil/compte',               icon: '👤',  label: 'menu.profil'           },
    ],

  admin: [
    { to: '/admin',              icon: '⊞',  label: 'Dashboard',    permission: 'dash'       },
    { to: '/admin/missions',     icon: '📋',  label: 'Missions',     permission: 'missions'   },
    { to: '/admin/oeils',        icon: '👁️',  label: 'Œils',         permission: 'users'      },
    { to: '/admin/clients',      icon: '👥',  label: 'Clients',      permission: 'users'      },
    { to: '/admin/reclamations', icon: '🚨',  label: 'Réclamations', permission: 'claims',  badge: 'claims'  },
    { to: '/admin/messages-suspects', icon: '⚠️', label: 'Messages suspects', permission: 'moderation', badge: 'flagged' },
    { to: '/admin/fraude',       icon: '🛡️',  label: 'Fraude',       permission: 'moderation' },
    { to: '/admin/fiabilite',    icon: '📊',  label: 'Œils suspendus', permission: 'identity' },
    { to: '/admin/problemes',    icon: '🚨',  label: 'Problèmes',    permission: 'moderation', badge: 'problems' },
    { to: '/admin/tickets',      icon: '🎫',  label: 'Tickets',      permission: 'moderation' },
    { to: '/admin/block-appeals', icon: '🔓', label: 'Contestations blocage', permission: 'moderation' },
    { to: '/admin/finance',      icon: '💰',  label: 'Finance',      permission: 'finance' },
    { to: '/admin/wallet-reconciliation', icon: '⚖️', label: 'Réconciliation', permission: 'finance' },
    { to: '/admin/clients-suspendus', icon: '🚫', label: 'Clients suspendus', permission: 'users' },
    { to: '/admin/missions-proches-validation', icon: '⏰', label: 'Missions proches sans validation', permission: 'missions' },
    { to: '/admin/promos',       icon: '🎟️',  label: 'Codes Promo',  permission: 'finance'    },
    { to: '/admin/parametres',   icon: '⚙️',  label: 'Paramètres',   permission: 'settings'   },
    { to: '/admin/admins',       icon: '👑',  label: 'Admins',       superAdminOnly: true     },
  ],
}

// Regroupement du menu admin desktop en 5 groupes dépliables/repliables (Dashboard et
// Paramètres restent hors groupe — cf. MENUS.admin ci-dessus). L'ordre des routes ci-dessous
// est volontairement indépendant de l'ordre dans MENUS.admin : ce dernier doit rester stable
// car il pilote aussi la barre de navigation mobile (non concernée par ce regroupement).
const ADMIN_GROUPS = [
  { label: 'Mission',          routes: ['/admin/missions', '/admin/missions-proches-validation'] },
  { label: 'Compte',           routes: ['/admin/oeils', '/admin/fiabilite', '/admin/clients', '/admin/clients-suspendus', '/admin/admins'] },
  { label: 'Gestion conflits', routes: ['/admin/reclamations', '/admin/messages-suspects', '/admin/fraude', '/admin/problemes', '/admin/tickets', '/admin/block-appeals'] },
  { label: 'Finance',          routes: ['/admin/finance', '/admin/wallet-reconciliation', '/admin/promos'] },
]

const LABELS = {
  client: 'Espace Client',
  oeil:   'Espace Œil',
  admin:  'Administration',
}

// Textes d'aide affichés en infobulle au survol des items du menu admin (validés par BOSS
// le 14/09/2026). Uniquement en français (aide interne admin). Clé = route (item.to) ;
// absent de cette map = pas d'infobulle (menus client/oeil).
const ADMIN_HELP = {
  '/admin': {
    fonction: "Vue d'ensemble chiffrée de toute la plateforme : missions, finances, Œils, clients et alertes, répartis en 12 onglets thématiques sur une période choisie.",
    exemple: "Par exemple, pour vérifier le chiffre d'affaires du mois en cours ou repérer un pic d'annulations avant qu'il ne devienne un problème.",
    actions: [
      'Filtrer par période (avec comparaison à une autre période)',
      'Consulter KPIs, graphiques et classements par onglet',
      'Ajouter ou supprimer une dépense manuelle (onglet Financier)',
      "Générer une URL de campagne marketing (onglet Campagnes)",
      'Résoudre une réclamation (onglet Réclamations)',
    ],
  },
  '/admin/missions': {
    fonction: "Liste et gestion opérationnelle de toutes les missions de la plateforme, avec un onglet dédié aux transferts urgents en attente de réaffectation.",
    exemple: "Par exemple, quand une mission reste sans Œil assigné et qu'il faut en affecter un manuellement après un appel téléphonique.",
    actions: [
      'Rechercher / filtrer par statut, trier par colonne',
      'Affecter manuellement un Œil à une mission',
      'Forcer la réattribution d’une mission en cours',
      'Annuler une mission (faute client ou non)',
    ],
  },
  '/admin/oeils': {
    fonction: "Gestion des comptes Œils : liste complète et validation des demandes de vérification d'identité.",
    exemple: "Par exemple, quand un nouvel Œil envoie sa CIN et un selfie pour faire vérifier son identité avant de pouvoir travailler.",
    actions: [
      'Consulter la liste des Œils (statut, missions, note)',
      'Suspendre ou réactiver un compte',
      "Examiner les pièces d'identité soumises",
      'Approuver ou rejeter une demande (avec motif)',
    ],
  },
  '/admin/clients': {
    fonction: "Liste en lecture seule des comptes clients, avec leur ville, leur nombre de missions et leur statut.",
    exemple: "Par exemple, pour retrouver un client par son nom avant d'ouvrir sa fiche détaillée.",
    actions: [
      'Consulter la liste des clients',
      'Cliquer un client pour ouvrir sa fiche complète',
    ],
  },
  '/admin/reclamations': {
    fonction: "Traitement des litiges ouverts par des clients sur une mission, plus la gestion des commissions cash mises en attente le temps de trancher.",
    exemple: "Par exemple, quand un client conteste qu'une mission ait bien été réalisée et qu'il faut décider en sa faveur ou en faveur de l'Œil.",
    actions: [
      'Consulter le motif du client',
      "Résoudre en faveur de l'Œil ou rembourser le client",
      'Débiter ou libérer une commission cash en attente',
    ],
  },
  '/admin/messages-suspects': {
    fonction: "Liste des messages de chat automatiquement repérés comme suspects (tentative probable de contourner la plateforme).",
    exemple: "Par exemple, quand un Œil et un client s'échangent un numéro de téléphone dans le chat pour éviter de passer par Shoofly.",
    actions: [
      'Consulter le message signalé et son expéditeur',
      'Ouvrir la conversation complète associée',
    ],
  },
  '/admin/fraude': {
    fonction: "Tableau de bord anti-fraude : missions suspectes, messages suspects et règles de détection actives, répartis en 3 onglets.",
    exemple: "Par exemple, quand une mission est marquée complétée en quelques secondes sans aucun média envoyé — un signe possible de fraude.",
    actions: [
      'Consulter le score de risque et les missions / messages suspects',
      'Avertir un utilisateur suspecté (mission ou message)',
      'Ignorer une alerte jugée non fondée',
    ],
  },
  '/admin/fiabilite': {
    fonction: "Gestion des Œils suspendus pour score de fiabilité trop bas, de leurs demandes de réintégration, et classement complet des scores de tous les Œils.",
    exemple: "Par exemple, quand un Œil suspendu pour score de fiabilité trop bas envoie une demande pour être réexaminé et réintégré.",
    actions: [
      'Réactiver directement un Œil suspendu',
      'Examiner une demande de réintégration (avec historique des points)',
      'Consulter le classement des scores par ville / quartier',
    ],
  },
  '/admin/problemes': {
    fonction: "Traitement des signalements de problème remontés en cours de mission par un Œil ou un client (client injoignable, lieu dangereux, etc.).",
    exemple: "Par exemple, quand un Œil signale sur place que le client est injoignable ou que l'adresse indiquée n'existe pas.",
    actions: [
      'Filtrer par type, ville ou rapporteur',
      "Consulter le détail d'un signalement",
      'Marquer en cours / résolu / ignoré (avec message au rapporteur)',
      'Annuler la mission concernée si nécessaire',
    ],
  },
  '/admin/tickets': {
    fonction: "Support client : tous les tickets ouverts par les clients et les Œils, avec conversation intégrée et gestion des urgences.",
    exemple: "Par exemple, quand un Œil ouvre un ticket urgent car il ne peut pas se présenter à une mission et a besoin d'aide immédiate.",
    actions: [
      'Filtrer par statut, catégorie ou urgence',
      'Répondre dans la conversation du ticket',
      'Changer le statut (ouvert / en cours / résolu / ignoré)',
      'Accéder à la mission liée au ticket',
    ],
  },
  '/admin/block-appeals': {
    fonction: "Traitement des contestations envoyées par un compte bloqué (Œil ou client) qui demande à être réactivé.",
    exemple: "Par exemple, quand un Œil bloqué pour absences répétées explique un empêchement légitime et demande à être réactivé.",
    actions: [
      'Consulter le message et le motif du blocage',
      "Réactiver le compte (avec réponse à l'utilisateur)",
      'Refuser la contestation',
    ],
  },
  '/admin/finance': {
    fonction: "Enregistrement des virements bancaires manuels aux Œils — le virement réel se fait hors plateforme, cet écran ne fait qu'enregistrer et déduire le solde.",
    exemple: "Par exemple, en fin de semaine, pour enregistrer qu'un virement bancaire a bien été effectué à un Œil.",
    actions: [
      'Consulter le solde à virer par Œil',
      'Enregistrer un virement (montant modifiable)',
    ],
  },
  '/admin/wallet-reconciliation': {
    fonction: "Détection des écarts entre le solde affiché et l'historique réel des transactions d'un utilisateur, plus les manques à gagner de commission cash.",
    exemple: "Par exemple, quand une alerte automatique détecte qu'un solde ne correspond pas à l'historique des transactions d'un Œil.",
    actions: [
      'Consulter les alertes non résolues / résolues',
      "Ouvrir la fiche financière de l'utilisateur concerné",
      'Marquer une alerte comme résolue une fois l’écart corrigé',
    ],
  },
  '/admin/clients-suspendus': {
    fonction: "Suivi des clients bloqués (ou débloqués) pour cumul d'absences non justifiées (« strikes » no-show).",
    exemple: "Par exemple, quand un client accumule plusieurs absences à ses missions et se retrouve bloqué automatiquement.",
    actions: [
      'Filtrer par statut (bloqués / débloqués / tous)',
      "Consulter l'historique détaillé des strikes d'un client",
      'Débloquer un compte',
    ],
  },
  '/admin/missions-proches-validation': {
    fonction: "Missions bientôt dues où le client a reçu des candidatures mais n'a toujours pas choisi d'Œil — trop urgentes pour une simple relance automatique.",
    exemple: "Par exemple, une mission programmée dans 2 heures dont le client n'a toujours pas sélectionné d'Œil parmi les candidatures reçues.",
    actions: [
      'Consulter le temps restant et le nombre de candidatures',
      'Ouvrir la mission pour agir (contacter le client, relancer)',
    ],
  },
  '/admin/promos': {
    fonction: "Création et gestion des codes de réduction (pourcentage, montant fixe ou mission gratuite).",
    exemple: "Par exemple, pour lancer un code promo -20 % à l'occasion d'une campagne d'acquisition de nouveaux clients.",
    actions: [
      "Créer un code (type, valeur, limites d'utilisation, expiration)",
      'Activer / désactiver un code',
      'Supprimer un code',
    ],
  },
  '/admin/parametres': {
    fonction: "Réglages numériques qui pilotent le comportement automatique de la plateforme (délais, pénalités, seuils anti-fraude, tarification), classés en 8 catégories.",
    exemple: "Par exemple, pour allonger de 12h à 24h le délai laissé au client pour valider une mission avant l'auto-validation.",
    actions: [
      'Rechercher un réglage par nom',
      'Modifier et sauvegarder les valeurs par catégorie',
      "Consulter l'historique des modifications",
      'Réinitialiser un réglage (ou tous) aux valeurs par défaut',
    ],
  },
  '/admin/admins': {
    fonction: "Création et gestion des comptes administrateurs et de leurs permissions — réservé au super-admin.",
    exemple: "Par exemple, pour créer un compte admin dédié à la modération, avec accès uniquement aux sections fraude et réclamations.",
    actions: [
      'Créer un admin (profil rapide ou permissions personnalisées)',
      "Modifier les permissions d'un admin existant",
      'Suspendre, activer ou supprimer un compte admin',
    ],
  },
}

function AdminMenuHelp({ help }) {
  return (
    <div>
      <p className="text-[12px] text-white font-semibold leading-snug">{help.fonction}</p>
      <p className="text-[11px] text-[#AAA] italic leading-snug mt-1.5">{help.exemple}</p>
      <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
        {help.actions.map((a, i) => (
          <div key={i} className="flex items-start gap-1.5 text-[11px] text-[#CCC] leading-snug">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-[#FF4D00] flex-shrink-0" />
            <span>{a}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AppLayout({ children }) {
  const { user, logout, hasPermission, isSuperAdmin } = useAuth()
  const { t, i18n } = useTranslation()
  const navigate               = useNavigate()
  const location = window.location.pathname

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'ar' ? 'fr' : 'ar')

  useEffect(() => {
    if (user?.role === 'oeil' && user?.is_suspended && location !== '/oeil/suspendu') {
      navigate('/oeil/suspendu')
    }
  }, [user?.role, user?.is_suspended, location, navigate])

  const [isAvail, setIsAvail] = useState(true)

  const [unreadCount, setUnreadCount] = useState(0)
const [flaggedCount, setFlaggedCount] = useState(0)
  const [claimsCount, setClaimsCount] = useState(0)

  // Groupes du menu admin repliés/dépliés. Pas de persistance voulue : tout groupe absent de
  // cet état est considéré ouvert (comportement par défaut), donc un rechargement de page
  // rouvre tout — cf. chantier "restructuration menu admin" 2026-09-14.
  const [collapsedGroups, setCollapsedGroups] = useState({})
  const toggleGroup = (label) => setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }))

useEffect(() => {
  if (user?.role !== 'admin') return

    const fetchClaims = () => {
      adminAPI.claims()
        .then(({ data }) => setClaimsCount((data.claims || []).length))
        .catch(() => {})
    }
    const fetchFlagged = () => {
      adminAPI.flaggedMessages()
        .then(({ data }) => setFlaggedCount((data.messages || []).length))
        .catch(() => {})
    }
    fetchClaims()
    fetchFlagged()
    const interval = setInterval(() => { fetchClaims(); fetchFlagged() }, 60000)
    return () => clearInterval(interval)

}, [user])

useEffect(() => {
  if (!user) return
  const fetchUnread = () => {
    missionsAPI.inbox()
      .then(({ data }) => {
        const total = (data.inbox || []).reduce((acc, m) => acc + (m.unread_count || 0), 0)
        setUnreadCount(total)
      })
      .catch(() => {})
  }
  fetchUnread()
  const interval = setInterval(fetchUnread, 30000) // refresh toutes les 30s
  return () => clearInterval(interval)
}, [user])


  useNotifications({ onChatOpen: (missionId) => {
  window.__notifChatMissionId = missionId
  const route = user?.role === 'oeil' ? '/oeil/missions' : '/client/missions'
  navigate(route)
}})

  
  const role  = user?.role || 'client'
  const itemLabel = (item) => (role === 'admin' ? item.label : t(item.label))

  // Filtrer les items selon les permissions
  const items = (MENUS[role] || []).filter(item => {
    if (item.superAdminOnly) return isSuperAdmin
    if (item.permission && role === 'admin') return isSuperAdmin || hasPermission(item.permission)
    return true
  })

  // Accès direct par route pour composer les groupes du menu admin (cf. ADMIN_GROUPS) sans
  // dépendre de l'ordre de MENUS.admin.
  const itemsByRoute = Object.fromEntries(items.map(item => [item.to, item]))

  const renderNavItem = (item) => {
    const link = (
      <NavLink
        to={item.to}
        end={item.to === '/client' || item.to === '/oeil' || item.to === '/admin'}
        className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
      >
        <span className="w-4 text-center text-base">{item.icon}</span>
        <span className="flex-1">{itemLabel(item)}</span>

        {item.to.includes('/messages') && unreadCount > 0 && (
          <span className="bg-[#FF4D00] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {item.badge === 'claims' && claimsCount > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {claimsCount > 9 ? '9+' : claimsCount}
          </span>
        )}
        {item.badge === 'flagged' && flaggedCount > 0 && (
          <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {flaggedCount > 9 ? '9+' : flaggedCount}
          </span>
        )}
      </NavLink>
    )
    const help = role === 'admin' ? ADMIN_HELP[item.to] : null
    if (!help) return <div key={item.to}>{link}</div>
    return (
      <HoverTooltip key={item.to} content={<AdminMenuHelp help={help} />}>
        {link}
      </HoverTooltip>
    )
  }

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex min-h-screen">

      {/* SIDEBAR — desktop uniquement */}
      <aside className="hidden md:flex w-[220px] flex-shrink-0 bg-[#181818] border-e border-white/20 flex-col fixed top-0 start-0 h-screen z-50">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/20 bg-[#222] flex items-start justify-between gap-2">
          <div>
            <div className="font-display font-bold text-xl tracking-tight">
              SHOOF<span className="text-[#FF4D00]">LY</span>
            </div>
            <div className="text-[11px] uppercase tracking-widest text-[#AAA] mt-0.5">
              {LABELS[role]}
            </div>
          </div>
          <button
            onClick={toggleLang}
            className="text-[#AAA] hover:text-white text-xs font-semibold px-2 py-1 rounded border border-white/12 hover:border-white/22 transition-all"
            title={i18n.language === 'ar' ? 'Français' : 'العربية'}
          >
            {i18n.language === 'ar' ? 'FR' : 'AR'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {role === 'admin' ? (
            <>
              {itemsByRoute['/admin'] && renderNavItem(itemsByRoute['/admin'])}

              {ADMIN_GROUPS.map(({ label, routes }) => {
                const groupItems = routes.map(r => itemsByRoute[r]).filter(Boolean)
                if (groupItems.length === 0) return null
                const collapsed = !!collapsedGroups[label]
                return (
                  <div key={label}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(label)}
                      className="w-full flex items-center justify-between px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-[#777] hover:text-white border-t border-white/10 mt-1 transition-colors"
                    >
                      <span>{label}</span>
                      <span className="text-[9px]">{collapsed ? '▴' : '▾'}</span>
                    </button>
                    {!collapsed && groupItems.map(renderNavItem)}
                  </div>
                )
              })}

              {itemsByRoute['/admin/parametres'] && renderNavItem(itemsByRoute['/admin/parametres'])}
            </>
          ) : (
            items.map(renderNavItem)
          )}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/20 bg-[#222]">
          {role === 'oeil' && (
            <button
              onClick={() => setIsAvail((v) => !v)}
              className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold mb-2 transition-all border ${
                isAvail
                  ? 'bg-green-500/10 text-green-400 border-green-500/30'
                  : 'bg-white/5 text-[#AAA] border-white/12'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAvail ? 'bg-green-400' : 'bg-[#777]'}`} />
              {isAvail ? t('appLayout.available') : t('appLayout.unavailable')}
            </button>
          )}
          <div className="flex items-center gap-2">
            <Avatar name={`${user?.first_name || ''} ${user?.last_name || ''}`} size={30} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{user?.first_name} {user?.last_name}</div>
              <div className="text-[11px] text-[#AAA]">{LABELS[role]}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-[#AAA] hover:text-white text-xs px-1.5 py-1 rounded border border-white/12 hover:border-white/22 transition-all"
              title={t('appLayout.logout')}
              aria-label={t('appLayout.logout')}
            >✕</button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="md:ms-[220px] flex-1 min-w-0 flex flex-col min-h-screen pb-[64px] md:pb-0">
        {/* Header mobile */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#181818] border-b border-white/12 sticky top-0 z-40">
          <div className="font-display font-bold text-lg">
            SHOOF<span className="text-[#FF4D00]">LY</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#AAA]">{user?.first_name}</span>
            <button
              onClick={toggleLang}
              className="text-[#AAA] hover:text-white text-xs font-semibold px-2 py-1 rounded border border-white/12 hover:border-white/22 transition-all"
              title={i18n.language === 'ar' ? 'Français' : 'العربية'}
            >
              {i18n.language === 'ar' ? 'FR' : 'AR'}
            </button>
            <button onClick={handleLogout} aria-label={t('appLayout.logout')} className="text-[#AAA] text-xs px-2 py-1 rounded border border-white/12">✕</button>
          </div>
        </div>

        {children}
      </main>

      {/* BOTTOM NAV — mobile uniquement */}
      <nav className="mobile-nav">

          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/client' || item.to === '/oeil' || item.to === '/admin'}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon" style={{ position: 'relative', display: 'inline-block' }}>
                {item.icon}
                {item.to.includes('/messages') && unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -6,
                    background: '#FF4D00', color: 'white',
                    fontSize: 9, fontWeight: 700, borderRadius: '50%',
                    width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              <span>{itemLabel(item)}</span>
            </NavLink>
          ))}
        <button
          onClick={handleLogout}
          style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'6px 4px', color:'#777', fontSize:10, fontWeight:500, background:'none', border:'none', cursor:'pointer' }}
        >
          <span style={{ fontSize:20 }}>↩</span>
          <span>{t('appLayout.logout')}</span>
        </button>
      </nav>

      <NotificationBanner />

      {/* Pile unique des bannières globales. Chaque bannière rend `null` quand sa garde échoue
          (rôle / état) et ne consomme alors aucun espace : le conteneur en flux normal gère seul
          le positionnement (plus de `top` codés en dur par bannière) et empêche tout chevauchement.
          Ordre = hiérarchie d'alerte : les 3 bannières Œil, puis l'alerte système de connexion. */}
      <div className="fixed top-[64px] md:top-4 inset-x-0 z-[70] px-4 flex flex-col items-center gap-3 pointer-events-none">
        <PresenceConfirmationBanner />
        <ClientDisabledBanner />
        <ResumeH30Banner />
        <ConnectionLostBanner />
      </div>
    </div>
  )
}