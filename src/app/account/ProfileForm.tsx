"use client"

import { useState, type FormEvent } from 'react'

interface ProfileFormProps {
  initialProfile: {
    company: string
    contactName: string
    email: string
    phone: string
  }
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [company, setCompany] = useState(initialProfile.company)
  const [contactName, setContactName] = useState(initialProfile.contactName)
  const [phone, setPhone] = useState(initialProfile.phone)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    setLoading(true)

    const response = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_name: company,
        contact_name: contactName,
        phone,
      }),
    })

    setLoading(false)

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setStatus(data?.error || 'Lỗi khi lưu thông tin. Vui lòng thử lại.')
      return
    }

    setStatus('Thông tin đã được cập nhật thành công.')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Cập nhật thông tin công ty</h2>
        <p className="text-sm text-slate-600">Bạn có thể chỉnh sửa tên công ty, người liên hệ và số điện thoại của bạn.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="block font-medium text-slate-700">Tên công ty</span>
          <input
            type="text"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
            placeholder="Tên công ty"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="block font-medium text-slate-700">Người liên hệ</span>
          <input
            type="text"
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
            placeholder="Tên người liên hệ"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="block font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={initialProfile.email}
            disabled
            className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="block font-medium text-slate-700">Điện thoại</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
            placeholder="Số điện thoại"
          />
        </label>
      </div>

      {status ? (
        <p className={`text-sm ${status.includes('Lỗi') ? 'text-rose-600' : 'text-emerald-600'}`}>{status}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
      </button>
    </form>
  )
}
