import { useRef, useState } from 'react'
import { useRepo } from '../../lib/repo/useRepo'

// Owner-facing upload control. Validates type/size client-side, uploads to the
// private quarantine, and runs the scan gate. Calls onUploaded(url) only when
// the scan APPROVES the asset (fail closed). If scanning is unavailable the
// upload stays private/pending and onUploaded is NOT called.
const ERR = {
  type: 'Unsupported file type.',
  size: 'File is too large.',
  auth: 'Sign in to upload.',
  invalid_bucket: 'Upload not allowed here.',
  scanning_unavailable: 'Uploaded — pending safety review. It appears once approved.',
  scan_failed: 'Upload could not be scanned. Try again later.',
}

export function UploadButton({ bucket, label = 'Upload', accept = 'image/*', onUploaded }) {
  const repo = useRepo()
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const onChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setMsg('Uploading…')
    const res = await repo.storage.upload({ bucket, file })
    setBusy(false)
    e.target.value = ''
    if (res.error) { setMsg(ERR[res.error] || res.error); return }
    if (res.status === 'approved' && res.url) { setMsg('Uploaded ✓'); onUploaded?.(res.url) }
    else { setMsg(ERR.scanning_unavailable) }   // pending — fail closed
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <input ref={ref} type="file" accept={accept} onChange={onChange} style={{ display: 'none' }} />
      <button
        onClick={() => ref.current?.click()}
        disabled={busy}
        style={{ padding: '5px 10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 'bold', background: 'var(--color-accent)', color: '#000', opacity: busy ? 0.6 : 1 }}
      >
        {busy ? '…' : label}
      </button>
      {msg && <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{msg}</span>}
    </span>
  )
}
