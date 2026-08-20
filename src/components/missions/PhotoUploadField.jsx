import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { mediaAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { toast } from '../ui'

// Widget réutilisable "photos obligatoires" (PROMPT 4, 2026-08-18) — réutilise le pipeline
// d'upload existant (mediaAPI -> POST /api/media/:missionId, validations MIME/taille déjà
// en place côté serveur) plutôt que d'en construire un nouveau. Utilisé (a) en ligne dans
// AirbnbReport.jsx/AuditReport.jsx (minRequired=10, remplace l'ancienne notice déclarative)
// et (b) dans MissionPhotosModal.jsx pour les missions standard (minRequired=1).
export default function PhotoUploadField({ missionId, minRequired = 1, disabled = false, onCountChange }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  // Ne compte que les photos envoyées par l'Œil lui-même — cohérent avec le filtre
  // uploader_id des 2 gardes backend (reports.js + missions.js) : une photo envoyée par le
  // client via le chat ne prouve pas le déplacement/travail de l'Œil.
  const load = useCallback(() => {
    mediaAPI.list(missionId)
      .then(({ data }) => {
        const mine = (data.media || []).filter(m => m.type === 'photo' && m.uploader_id === user.id)
        setPhotos(mine)
        onCountChange?.(mine.length)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId, user.id])

  useEffect(() => { load() }, [load])

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || [])
    if (files.length === 0) return
    setUploading(true)
    try {
      // media.js plafonne à 10 fichiers par requête (upload.array('files', 10)) — on
      // découpe en lots pour rester correct même si l'utilisateur sélectionne plus de 10
      // photos d'un coup.
      for (let i = 0; i < files.length; i += 10) {
        const chunk = files.slice(i, i + 10)
        const formData = new FormData()
        chunk.forEach(f => formData.append('files', f))
        await mediaAPI.upload(missionId, formData)
      }
      load()
    } catch {
      toast(t('photoUpload.uploadError'), 'error')
    } finally {
      setUploading(false)
    }
  }

  const count = photos.length
  const met = count >= minRequired

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <span className={`text-xs font-semibold ${met ? 'text-green-400' : 'text-[#FF4D00]'}`}>
          {met ? t('photoUpload.requirementMet') : t('photoUpload.counter', { count, min: minRequired })}
        </span>
        {!disabled && (
          <label className="btn btn-ghost btn-sm cursor-pointer">
            {uploading ? t('photoUpload.uploading') : t('photoUpload.addButton')}
            <input
              type="file" accept="image/*" multiple className="hidden" disabled={uploading}
              onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
            />
          </label>
        )}
      </div>
      {loading ? (
        <div className="text-xs text-[#666]">…</div>
      ) : photos.length === 0 ? (
        <div className="text-xs text-[#666]">{t('photoUpload.empty')}</div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {photos.map(p => (
            <img key={p.id} src={p.url} alt="" className="w-full aspect-square object-cover rounded-lg border border-white/10" />
          ))}
        </div>
      )}
    </div>
  )
}
