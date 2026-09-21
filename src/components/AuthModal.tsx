import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Mail, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Language = 'en' | 'pt'
type Mode = 'login' | 'signup' | 'reset'

export function AuthModal({
  language,
  initialMode = 'login',
  onClose,
  onAuthenticated,
}: {
  language: Language
  initialMode?: Mode
  onClose: () => void
  onAuthenticated: () => void
}) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const pt = language === 'pt'
  const title = mode === 'login' ? (pt ? 'Entrar no LifeDue' : 'Sign in to LifeDue')
    : mode === 'signup' ? (pt ? 'Criar sua conta' : 'Create your account')
    : (pt ? 'Redefinir senha' : 'Reset your password')
  const submitLabel = mode === 'login' ? (pt ? 'Entrar' : 'Sign in')
    : mode === 'signup' ? (pt ? 'Criar conta' : 'Create account')
    : (pt ? 'Enviar link' : 'Send reset link')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return
    setError('')
    setSuccess('')

    if (!supabase) {
      setError(pt ? 'O Supabase ainda não está configurado.' : 'Supabase is not configured yet.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (authError) throw authError
        onAuthenticated()
        return
      }

      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })
        if (authError) throw authError

        if (data.session) {
          onAuthenticated()
        } else {
          setSuccess(pt ? 'Conta criada. Verifique seu email para confirmar o acesso.' : 'Account created. Check your email to confirm access.')
          setMode('login')
        }
        return
      }

      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      })
      if (authError) throw authError
      setSuccess(pt ? 'Enviamos um link de redefinição para seu email.' : 'We sent a password reset link to your email.')
    } catch (authError) {
      setError(authError instanceof Error
        ? authError.message
        : (pt ? 'Não foi possível concluir. Tente novamente.' : 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const google = async () => {
    if (loading) return

    setError('')
    setSuccess('')

    if (!supabase) {
      setError(pt ? 'O Supabase ainda não está configurado.' : 'Supabase is not configured yet.')
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    }
    // On success Supabase redirects immediately. Keep the button locked so
    // users cannot start a second OAuth request during the redirect.
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}
    >
      <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth-close" onClick={onClose} aria-label={pt ? 'Fechar' : 'Close'}>
          <X size={18} />
        </button>

        <div className="auth-brand"><span className="brand-mark">L</span><span>LifeDue</span></div>

        <div className="auth-head">
          <div className="auth-icon">{mode === 'reset' ? <Mail size={20} /> : <CheckCircle2 size={20} />}</div>
          <div>
            <h2 id="auth-title">{title}</h2>
            <p>
              {mode === 'reset'
                ? (pt ? 'Receba um link seguro para criar uma nova senha.' : 'Get a secure link to create a new password.')
                : (pt ? 'Seu espaço de trabalho, sincronizado com segurança.' : 'Your workspace, securely synced.')}
            </p>
          </div>
        </div>

        {success && <div className="auth-success">{success}</div>}
        {error && <div className="auth-error">{error}</div>}

        {mode !== 'reset' && (
          <>
            <button
              type="button"
              className="google-button google-primary"
              onClick={google}
              disabled={loading}
              aria-busy={loading}
            >
              <span className="google-logo" aria-hidden="true">G</span>
              {loading ? <Loader2 size={17} className="spin" /> : null}
              {pt ? 'Continuar com Google' : 'Continue with Google'}
            </button>
            <div className="auth-divider"><span>{pt ? 'ou use email e senha' : 'or use email and password'}</span></div>
          </>
        )}

        <form onSubmit={submit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          {mode !== 'reset' && (
            <label>
              {pt ? 'Senha' : 'Password'}
              <span className="auth-password">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
          )}

          <button className="primary-button auth-submit" disabled={loading} aria-busy={loading}>
            {loading ? <Loader2 size={17} className="spin" /> : null}
            {submitLabel}
          </button>
        </form>

        <div className="auth-links">
          {mode === 'login' && (
            <button onClick={() => { setMode('reset'); setError(''); setSuccess('') }}>
              {pt ? 'Esqueci minha senha' : 'Forgot password?'}
            </button>
          )}
          {mode === 'reset' && (
            <button onClick={() => { setMode('login'); setError(''); setSuccess('') }}>
              <ArrowLeft size={14} /> {pt ? 'Voltar para entrar' : 'Back to sign in'}
            </button>
          )}
          {mode === 'login' && (
            <button onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>
              {pt ? 'Criar uma conta' : 'Create an account'}
            </button>
          )}
          {mode === 'signup' && (
            <button onClick={() => { setMode('login'); setError(''); setSuccess('') }}>
              {pt ? 'Já tenho uma conta' : 'I already have an account'}
            </button>
          )}
        </div>

        <p className="auth-note">
          {pt
            ? 'Ao continuar, seus dados ficam associados à sua conta e protegidos pelas regras de acesso do LifeDue.'
            : 'Your data is associated with your account and protected by LifeDue access controls.'}
        </p>
      </div>
    </div>
  )
}
