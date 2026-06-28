import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { toast } from '../../components/ui'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'

export default function VerificationIdentite() {
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
      toast('Veuillez fournir les 3 documents', 'error')
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
      toast('Documents soumis avec succès ✓', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur lors de l\'envoi', 'error')
    } finally {
      setUploading(false)
    }
  }

  if (step === 'success') {
    return (
      <AppLayout>
        <Topbar title="Vérification identité" />
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="font-bold text-xl mb-2">Documents soumis !</h2>
          <p className="text-[#AAA] text-sm max-w-xs">Votre demande est en cours d'examen. Vous recevrez une notification dès que votre identité sera vérifiée.</p>
          <button onClick={() => navigate('/oeil/dashboard')} className="btn btn-primary mt-6">Retour au tableau de bord</button>
        </div>
      </AppLayout>
    )
  }

  const DOCS = [
    { key: 'cin_recto', label: 'CIN Recto', icon: '🪪', hint: 'Face avant de votre carte d\'identité nationale' },
    { key: 'cin_verso', label: 'CIN Verso', icon: '🪪', hint: 'Face arrière de votre carte d\'identité nationale' },
    { key: 'selfie',    label: 'Selfie',    icon: '🤳', hint: 'Photo de vous tenant votre CIN visible' },
  ]

  return (
    <AppLayout>
      <Topbar title="Vérification identité" />
      <div className="p-4 md:p-6 max-w-lg mx-auto">

        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl">🛡️</div>
            <div>
              <p className="font-semibold text-sm">Vérification requise</p>
              <p className="text-xs text-[#AAA]">Pour accepter des missions, votre identité doit être vérifiée.</p>
            </div>
          </div>
          <div className="text-xs text-[#555] border-t border-white/10 pt-3 mt-1">
            Vos documents sont stockés de manière sécurisée et ne sont accessibles qu'à l'équipe Shoofly.
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
                {files[key] && <span className="ml-auto text-green-400 text-xs font-semibold">✓ Prêt</span>}
              </div>
              {previews[key] ? (
                <div className="relative">
                  <img src={previews[key]} alt={label} className="w-full h-36 object-cover rounded-xl" />
                  <button
                    onClick={() => { setFiles((f) => ({ ...f, [key]: null })); setPreviews((p) => ({ ...p, [key]: null })) }}
                    className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-[#FF4D00]/50 transition-colors">
                  <span className="text-2xl mb-1">📁</span>
                  <span className="text-xs text-[#AAA]">Cliquer pour choisir</span>
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
          {uploading ? 'Envoi en cours...' : 'Soumettre mes documents →'}
        </button>
      </div>
    </AppLayout>
  )
}