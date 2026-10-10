import { useState } from 'react'

type Props = { text: string; label: string; className?: string }

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Trình duyệt cũ / không phải https: dùng cách cũ
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  }
}

export default function CopyButton({ text, label, className = 'btn btn-ghost btn-sm' }: Props) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }
      }}
    >
      {copied ? '✅ Đã chép!' : label}
    </button>
  )
}
