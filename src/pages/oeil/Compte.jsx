import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { useAuth } from '../../context/AuthContext'
import { toast, Avatar, Stars } from '../../components/ui'
import { authAPI, usersAPI } from '../../api'
import { translateLocation } from '../../constants/villesTranslations'

const JOURS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

const defaultDispo = () => JOURS.map((j, i) => ({
  jour: j,
  actif: i < 5,
  debut: i < 5 ? '08:00' : '09:00',
  fin:   i < 5 ? '20:00' : '14:00',
}))

export default function OeilCompte() {
  const { t, i18n } = useTranslation()
  const { user, updateUser } = useAuth()
  const [saving, setSaving]  = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef(null)

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const { data } = await usersAPI.uploadAvatar(formData)
      updateUser({ avatar_url: data.avatar_url })
      toast(t('oeilCompte.avatarUpdatedToast'), 'success')
    } catch (err) {
      toast(err.response?.data?.error || t('oeilCompte.uploadErrorToast'), 'error')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }
  const [savingDispo, setSavingDispo] = useState(false)
  const [isAvailable, setIsAvailable] = useState(user?.is_available || false)
  const [togglingDispo, setTogglingDispo] = useState(false)
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    phone:      user?.phone      || '',
    city:       user?.city       || '',
    bio:        user?.bio        || '',
  })

  
  const parseDispo = (d) => {
  if (!d) return defaultDispo()
  if (typeof d === 'string') { try { return JSON.parse(d) } catch {} }
  if (Array.isArray(d) && d.length) return d
  return defaultDispo()
}
const [dispo, setDispo] = useState(() => parseDispo(user?.disponibilites))

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleJour = (i) =>
    setDispo((d) => d.map((x, idx) => idx === i ? { ...x, actif: !x.actif } : x))

  const setHeure = (i, key, val) =>
    setDispo((d) => d.map((x, idx) => idx === i ? { ...x, [key]: val } : x))

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await authAPI.update(form)
      updateUser(data.user)
      toast(t('oeilCompte.profileUpdatedToast'), 'success')
    } catch { toast(t('oeilCompte.genericError'), 'error') }
    finally { setSaving(false) }
  }

  const saveDispo = async () => {
    setSavingDispo(true)
    try {
      const { data } = await authAPI.update({ disponibilites: dispo })
      updateUser(data.user)
      toast(t('oeilCompte.availabilitySavedToast'), 'success')
    } catch { toast(t('oeilCompte.genericError'), 'error') }
    finally { setSavingDispo(false) }
  }

  const toggleAvailable = async () => {
  setTogglingDispo(true)
  try {
    const { data } = await usersAPI.toggleAvailable()
    setIsAvailable(data.is_available)
    updateUser({ is_available: data.is_available })
    toast(data.is_available ? t('oeilCompte.nowAvailableToast') : t('oeilCompte.nowOfflineToast'), 'info')
  } catch { toast(t('oeilCompte.genericError'), 'error') }
  finally { setTogglingDispo(false) }
}

  const requestWithdraw = () => toast(t('oeilCompte.withdrawComingSoonToast'), 'info')

  return (
    <AppLayout>
      <Topbar title={t('oeilCompte.title')} />
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Profil */}
          <div className="card">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                <div className="relative">
                  <Avatar name={`${user?.first_name} ${user?.last_name}`} size={52} src={user?.avatar_url} />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -end-1 w-6 h-6 rounded-full bg-[#FF4D00] flex items-center justify-center text-white text-xs disabled:opacity-50"
                    title={t('oeilCompte.changePhotoTitle')}
                  >
                    {uploadingAvatar ? '...' : '📷'}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <div className="font-semibold text-base">{user?.first_name} {user?.last_name}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Stars value={user?.rating_avg || 0} />
                  <span className="text-xs text-[#AAA]">{t('oeilCompte.ratingMissions', { rating: user?.rating_avg || '—', count: user?.total_missions || 0 })}</span>
                </div>
                {user?.is_verified && <span className="badge badge-green mt-1">{t('oeilCompte.verifiedBadge')}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="label">{t('oeilCompte.firstNameLabel')}</label><input className="input" value={form.first_name} onChange={set('first_name')} /></div>
              <div><label className="label">{t('oeilCompte.lastNameLabel')}</label><input className="input" value={form.last_name} onChange={set('last_name')} /></div>
            </div>
            <div className="mt-3"><label className="label">{t('oeilCompte.emailLabel')}</label><input className="input" value={user?.email || ''} disabled /></div>
            <div className="mt-3"><label className="label">{t('oeilCompte.phoneLabel')}</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
            <div className="mt-3">
              <label className="label">{t('oeilCompte.cityLabel')}</label>
              <select className="input" value={form.city} onChange={set('city')}>
                {['Rabat','Casablanca','Salé','Témara','Marrakech','Fès','Tanger','Agadir'].map((c) => (
                  <option key={c} value={c}>{translateLocation(c, i18n.language)}</option>
                ))}
              </select>
            </div>
            <div className="mt-3"><label className="label">{t('oeilCompte.bioLabel')}</label><textarea className="input resize-none h-20" value={form.bio} onChange={set('bio')} placeholder={t('oeilCompte.bioPlaceholder')} /></div>
            <button onClick={save} disabled={saving} className="btn btn-primary w-full justify-center mt-5 disabled:opacity-60">
              {saving ? t('oeilCompte.saving') : t('oeilCompte.save')}
            </button>
          </div>

          {/* Colonne droite */}
          <div className="space-y-4">
            {/* Paiements */}
            <div className="card">
              <h2 className="font-semibold text-sm mb-4">{t('oeilCompte.payments.title')}</h2>
              <div className="flex items-center justify-between bg-[#222] rounded-xl p-4 mb-4">
                <div>
                  <div className="text-sm font-semibold">{t('oeilCompte.payments.balanceLabel')}</div>
                  <div className="text-xs text-[#AAA]">{t('oeilCompte.payments.readyToTransfer')}</div>
                </div>
                <div className="text-xl font-bold text-green-400">{t('oeilCompte.payments.zeroBalance')}</div>
              </div>
              <button onClick={requestWithdraw} className="btn btn-primary w-full justify-center">{t('oeilCompte.payments.withdrawButton')}</button>
            </div>

            {/* Disponibilités */}
            <div className="card">

              <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm">{t('oeilCompte.availability.title')}</h2>
                  <button
                    onClick={toggleAvailable}
                    disabled={togglingDispo}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-60 ${
                      isAvailable ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-[#333] text-[#AAA] border border-white/10'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400' : 'bg-[#666]'}`} />
                    {togglingDispo ? '...' : isAvailable ? t('oeilCompte.availability.available') : t('oeilCompte.availability.offline')}
                  </button>
                </div>

              {dispo.map((d, i) => (
                <div key={d.jour} className={`flex items-center gap-2 py-2 border-b border-white/10 last:border-0 transition-opacity ${!d.actif ? 'opacity-40' : ''}`}>
                  <span className="text-sm font-medium w-9 shrink-0">{t(`joursSemaine.${d.jour}`)}</span>
                  <input
                    type="time"
                    disabled={!d.actif}
                    value={d.debut}
                    onChange={(e) => setHeure(i, 'debut', e.target.value)}
                    className="input py-1 px-2 text-xs w-[82px] shrink-0"
                  />
                  <span className="text-[#AAA] shrink-0">→</span>
                  <input
                    type="time"
                    disabled={!d.actif}
                    value={d.fin}
                    onChange={(e) => setHeure(i, 'fin', e.target.value)}
                    className="input py-1 px-2 text-xs w-[82px] shrink-0"
                  />
                  {/* Toggle on/off */}
                  <button
                    onClick={() => toggleJour(i)}
                    className={`ms-auto w-10 h-5 rounded-full transition-colors shrink-0 relative ${d.actif ? 'bg-[#FF4D00]' : 'bg-[#333]'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${d.actif ? 'end-0.5' : 'start-0.5'}`} />
                  </button>
                </div>
              ))}
              <button onClick={saveDispo} disabled={savingDispo} className="btn btn-primary btn-sm w-full justify-center mt-4 disabled:opacity-60">
                {savingDispo ? t('oeilCompte.saving') : t('oeilCompte.availability.saveButton')}
              </button>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}