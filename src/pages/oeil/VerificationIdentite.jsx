import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { toast } from '../../components/ui'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'

export default function VerificationIdentite() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [files, setFiles] = useState({ cin_recto: null, cin_verso: null, selfie: null })
  const [previews, setPreviews] = useState({ cin_recto: null, cin_verso: null, selfie: null })
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState('upload')

  const handleFile = (key) => (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFiles((f) => ({ ...f, [key]: file }))
    setPreviews((p) => ({ ...p, [key]: URL.createObjectURL(file) }))
  }

  const submit = async () => {
    if (!files.cin_recto || !files.cin_verso || !files.selfie) {
      toast(t('verificationIdentite.missingDocsError'), 'error')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('cin_recto', files.cin_recto)
      fd.append('cin_verso', files.cin_verso)
      fd.append('selfie',    files.selfie)
      await api.post('/api/users/oeil/identity', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setStep('success')
      toast(t('verificationIdentite.submittedToast'), 'success')
    } catch (err) {
      toast(err.response?.data?.error || t('verificationIdentite.uploadErrorToast'), 'error')
    } finally {
      setUploading(false)
    }
  }

  if (step === 'success') {
    return (
      <AppLayout>
        <Topbar title={t('verificationIdentite.title')} />
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="font-bold text-xl mb-2">{t('verificationIdentite.successTitle')}</h2>
          <p className="text-[#AAA] text-sm max-w-xs">{t('verificationIdentite.successDesc')}</p>
          <button onClick={() => navigate('/oeil/dashboard')} className="btn btn-primary mt-6">{t('verificationIdentite.backToDashboard')}</button>
        </div>
      </AppLayout>
    )
  }

  const DOCS = [
    { key: 'cin_recto', label: t('verificationIdentite.docs.cinRecto.label'), icon: '🪪', hint: t('verificationIdentite.docs.cinRecto.hint') },
    { key: 'cin_verso', label: t('verificationIdentite.docs.cinVerso.label'), icon: '🪪', hint: t('verificationIdentite.docs.cinVerso.hint') },
    { key: 'selfie',    label: t('verificationIdentite.docs.selfie.label'),   icon: '🤳', hint: t('verificationIdentite.docs.selfie.hint') },
  ]

  return (
    <AppLayout>
      <Topbar title={t('verificationIdentite.title')} />
      <div className="p-4 md:p-6 max-w-lg mx-auto">

        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl">🛡️</div>
            <div>
              <p className="font-semibold text-sm">{t('verificationIdentite.requiredTitle')}</p>
              <p className="text-xs text-[#AAA]">{t('verificationIdentite.requiredDesc')}</p>
            </div>
          </div>
          <div className="text-xs text-[#555] border-t border-white/10 pt-3 mt-1">
            {t('verificationIdentite.securityNotice')}
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {DOCS.map(({ key, label, icon, hint }) => (
            <div key={key} className="card">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-[#AAA]">{hint}</p>
                </div>
                {files[key] && <span className="ml-auto text-green-400 text-xs font-semibold">{t('verificationIdentite.readyBadge')}</span>}
              </div>
              {previews[key] ? (
                <div className="relative">
                  <img src={previews[key]} alt={label} className="w-full h-36 object-cover rounded-xl" />
                  <button
                    onClick={() => { setFiles((f) => ({ ...f, [key]: null })); setPreviews((p) => ({ ...p, [key]: null })) }}
                    className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg"
                  >
                    {t('verificationIdentite.changeButton')}
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-[#FF4D00]/50 transition-colors">
                  <span className="text-2xl mb-1">📁</span>
                  <span className="text-xs text-[#AAA]">{t('verificationIdentite.clickToChoose')}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFile(key)} />
                </label>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={submit}
          disabled={uploading || !files.cin_recto || !files.cin_verso || !files.selfie}
          className="btn btn-primary w-full justify-center disabled:opacity-50"
        >
          {uploading ? t('verificationIdentite.uploading') : t('verificationIdentite.submitButton')}
        </button>
      </div>
    </AppLayout>
  )
}