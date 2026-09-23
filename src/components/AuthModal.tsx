import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Mail, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Language = 'en' | 'pt'
type Mode = 'login' | 'signup' | 'forgot' | 'reset'

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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const pt = language === 'pt'

  const passwordStrength = useMemo(() => {
    if (mode !== 'signup' || !password) return { score: 0, label: '', tone: '' }
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    if (password.length < 8) return { score, label: pt ? 'Fraca — use pelo menos 8 caracteres.' : 'Weak — use at least 8 characters.', tone: 'weak' }
    if (score <= 2) return { score, label: pt ? 'Fraca' : 'Weak', tone: 'weak' }
    if (score <= 3) return { score, label: pt ? 'Média' : 'Fair', tone: 'fair' }
    return { score, label: pt ? 'Forte' : 'Strong', tone: 'strong' }
  }, [mode, password, pt])

  const suggestPassword = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?'
    const values = new Uint32Array(16)
    crypto.getRandomValues(values)
    let suggestion = ''
    for (const value of values) suggestion += alphabet[value % alphabet.length]
    setPassword(suggestion)
    setShowPassword(true)
    setError('')
    setSuccess('')
  }

  const title = mode === 'login' ? (pt ? 'Entrar no LifeDue' : 'Sign in to LifeDue')
    : mode === 'signup' ? (pt ? 'Criar sua conta' : 'Create your account')
    : mode === 'forgot' ? (pt ? 'Esqueci minha senha' : 'Forgot your password?') : (pt ? 'Redefinir senha' : 'Reset your password')
  const submitLabel = mode === 'login' ? (pt ? 'Entrar' : 'Sign in')
    : mode === 'signup' ? (pt ? 'Criar conta' : 'Create account')
    : mode === 'forgot' ? (pt ? 'Enviar link' : 'Send reset link') : (pt ? 'Guardar nova senha' : 'Save new password')

  const friendlyAuthError = (authError: unknown) => {
    const message = authError instanceof Error ? authError.message.toLowerCase() : ''
    if (message.includes('invalid login credentials')) return pt ? 'Email ou senha incorretos. Verifique os dados e tente novamente.' : 'Incorrect email or password. Check your details and try again.'
    if (message.includes('email not confirmed')) return pt ? 'Confirme seu email antes de entrar. Verifique também a pasta de spam.' : 'Confirm your email before signing in. Check your spam folder too.'
    if (message.includes('user already registered')) return pt ? 'Este email já tem uma conta. Entre em vez de criar outra.' : 'This email already has an account. Sign in instead of creating another one.'
    if (message.includes('password should be at least')) return pt ? 'A senha precisa ter pelo menos 8 caracteres.' : 'Your password must be at least 8 characters.'
    return pt ? 'Não foi possível concluir agora. Verifique os dados e tente novamente.' : 'We could not complete this right now. Check your details and try again.'
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return
    setError('')
    setSuccess('')

    const cleanEmail = email.trim()
    if (mode !== 'reset' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(pt ? 'Digite um email válido.' : 'Enter a valid email address.')
      return
    }

    if ((mode === 'signup' || mode === 'reset') && password !== confirmPassword) {
      setError(pt ? 'As senhas não coincidem.' : 'Passwords do not match.')
      return
    }

    if ((mode === 'signup' || mode === 'reset') && (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password))) {
      setError(pt ? 'Escolha uma senha forte: use 8+ caracteres, maiúsculas, minúsculas, número e símbolo.' : 'Choose a strong password: use 8+ characters, upper/lowercase letters, a number, and a symbol.')
      return
    }

    if (mode === 'signup' && (password.length < 8 || passwordStrength.tone === 'weak')) {
      setError(pt ? 'Escolha uma senha mais forte: use 8+ caracteres, maiúsculas, minúsculas, número e símbolo.' : 'Choose a stronger password: use 8+ characters, upper/lowercase letters, a number, and a symbol.')
      return
    }

    if (!supabase) {
      setError(pt ? 'O Supabase ainda não está configurado.' : 'Supabase is not configured yet.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })
        if (authError) throw authError
        onAuthenticated()
        return
      }

      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
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

      if (mode === 'forgot') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin,
        })
        if (authError) throw authError
        setSuccess(pt ? 'Enviamos um link seguro para redefinir sua senha. Verifique também a pasta de spam.' : 'We sent a secure password reset link. Check your spam folder too.')
        return
      }

      const cleanPassword = password.trim()
      if (cleanPassword.length < 8) {
        setError(pt ? 'A nova senha precisa ter pelo menos 8 caracteres.' : 'Your new password must have at least 8 characters.')
        return
      }
      const { error: authError } = await supabase.auth.updateUser({ password: cleanPassword })
      if (authError) throw authError
      await supabase.auth.signOut()
      setPassword('')
      setConfirmPassword('')
      setMode('login')
      setSuccess(pt ? 'Senha redefinida com sucesso. Agora entre com a nova senha.' : 'Password reset successfully. Now sign in with your new password.')
      return
    } catch (authError) {
      console.error('LifeDue authentication failed:', authError)
      setError(friendlyAuthError(authError))
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
      console.error('LifeDue Google authentication failed:', authError)
      setError(friendlyAuthError(authError))
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
          <div className="auth-icon">{mode === 'forgot' || mode === 'reset' ? <Mail size={20} /> : <CheckCircle2 size={20} />}</div>
          <div>
            <h2 id="auth-title">{title}</h2>
            <p>
              {mode === 'forgot'
                ? (pt ? 'Receba um link seguro para redefinir sua senha.' : 'Get a secure link to reset your password.')
                : mode === 'reset'
                ? (pt ? 'Escolha uma nova senha para sua conta.' : 'Choose a new password for your account.')
                : (pt ? 'Seu espaço de trabalho, sincronizado com segurança.' : 'Your workspace, securely synced.')}
            </p>
          </div>
        </div>

        {success && <div className="auth-success">{success}</div>}
        {error && <div className="auth-error">{error}</div>}

        {(mode === 'login' || mode === 'signup') && (
          <>
            <button
              type="button"
              className="google-button google-primary"
              onClick={google}
              disabled={loading}
              aria-busy={loading}
            >
              <span className="google-mark" aria-hidden="true">G</span>
              {loading ? <Loader2 size={17} className="spin" /> : null}
              {pt ? 'Continuar com Google' : 'Continue with Google'}
            </button>
            <div className="auth-divider"><span>{pt ? 'ou use email e senha' : 'or use email and password'}</span></div>
          </>
        )}
        {mode === 'forgot' && (
          <div className="auth-email-only-note">
            {pt ? 'Introduza o email associado à sua conta. Enviaremos o link de redefinição para esse endereço.' : 'Enter the email associated with your account. We will send the reset link to that address.'}
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          {(mode !== 'reset') && (
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete={mode === 'login' ? 'username' : 'email'}
                autoFocus
                required
              />
            </label>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
            <label>
              {pt ? (mode === 'reset' ? 'Nova senha' : 'Senha') : (mode === 'reset' ? 'New password' : 'Password')}
              <span className="auth-password">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  minLength={8}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={showPassword ? (pt ? 'Ocultar senha' : 'Hide password') : (pt ? 'Mostrar senha' : 'Show password')}
                  title={showPassword ? (pt ? 'Ocultar senha' : 'Hide password') : (pt ? 'Mostrar senha' : 'Show password')}
                >
                  {showPassword ? <Eye size={17} /> : <EyeOff size={17} />}
                </button>
              </span>
              {mode === 'reset' && (
                <span className="auth-password">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={event => setConfirmPassword(event.target.value)}
                    minLength={8}
                    autoComplete="new-password"
                    placeholder={pt ? 'Confirme a nova senha' : 'Confirm new password'}
                    required
                  />
                </span>
              )}
              {mode === 'signup' && (
                <>
                  <div className={`password-strength ${passwordStrength.tone}`} aria-live="polite">
                    <div className="password-strength-track">
                      <span style={{ width: `${Math.min(100, passwordStrength.score * 20)}%` }} />
                    </div>
                    <span>{passwordStrength.label || (pt ? 'Use uma senha forte' : 'Use a strong password')}</span>
                  </div>
                  <div className="password-requirements">
                    <span className={password.length >= 8 ? 'met' : ''}>{pt ? '8+ caracteres' : '8+ characters'}</span>
                    <span className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'met' : ''}>{pt ? 'Maiúscula + minúscula' : 'Upper + lowercase'}</span>
                    <span className={/\d/.test(password) ? 'met' : ''}>{pt ? 'Número' : 'Number'}</span>
                    <span className={/[^A-Za-z0-9]/.test(password) ? 'met' : ''}>{pt ? 'Símbolo' : 'Symbol'}</span>
                  </div>
                  <button type="button" className="password-suggestion" onClick={suggestPassword}>
                    {pt ? 'Sugerir uma senha forte' : 'Suggest a strong password'}
                  </button>
                </>
              )}
            </label>
          )}

          {mode === 'signup' && (
            <label>
              {pt ? 'Confirmar senha' : 'Confirm password'}
              <span className="auth-password">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </span>
            </label>
          )}

          <button className="primary-button auth-submit" disabled={loading} aria-busy={loading}>
            {loading ? <Loader2 size={17} className="spin" /> : null}
            {submitLabel}
          </button>
        </form>

        <div className="auth-links">
          {(mode === 'reset' || mode === 'forgot') && (
            <button onClick={() => { setMode('login'); setPassword(''); setError(''); setSuccess('') }}>
              <ArrowLeft size={14} /> {pt ? 'Voltar para entrar' : 'Back to sign in'}
            </button>
          )}
          {mode === 'login' && (
            <>
              <button onClick={() => { setMode('forgot'); setPassword(''); setError(''); setSuccess('') }}>
                {pt ? 'Esqueci minha senha' : 'Forgot my password'}
              </button>
              <button onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>
                {pt ? 'Criar uma conta' : 'Create an account'}
              </button>
            </>
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
