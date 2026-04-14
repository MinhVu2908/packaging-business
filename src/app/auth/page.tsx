'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra email hoặc mật khẩu.')
      } else {
        router.push('/account')
      }
    } catch {
      setError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!companyName.trim() || !phone.trim()) {
      setError('Vui lòng nhập đầy đủ Tên công ty và Số điện thoại.')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: companyName.trim(),
            phone: phone.trim(),
          },
        },
      })

      if (error) {
        if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
          setError('Email này đã được sử dụng. Vui lòng dùng email khác.')
        } else {
          setError(`Đăng ký thất bại: ${error.message}`)
        }
      } else {
        const emailAlreadyUsed =
          !!data.user &&
          !data.session &&
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0

        if (emailAlreadyUsed) {
          setError('Email này đã được sử dụng. Vui lòng dùng email khác.')
          return
        }

        setError('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.')
      }
    } catch {
      setError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-8">
      <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Xác thực</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Đăng nhập / Đăng ký</h1>
          </div>
          <p className="max-w-md text-sm text-slate-600">
            Tạo tài khoản hoặc đăng nhập để quản lý đơn hàng và thông tin doanh nghiệp.
          </p>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError('')
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              mode === 'login'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-100'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError('')
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              mode === 'signup'
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-100'
            }`}
          >
            Đăng ký
          </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleSignUp} className="mt-6 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-slate-700">
                  Tên công ty <span className="text-red-600">*</span>
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                  Số điện thoại <span className="text-red-600">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading
                ? mode === 'login'
                  ? 'Đang đăng nhập...'
                  : 'Đang đăng ký...'
                : mode === 'login'
                  ? 'Đăng nhập'
                  : 'Đăng ký'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}