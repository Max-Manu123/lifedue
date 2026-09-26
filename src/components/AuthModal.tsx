import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Mail, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { authI18n, authExtraI18n } from '../lib/i18n'

type Language = 'en' | 'pt'
type Mode = 'login' | 'signup' | 'forgot' | 'reset' | 'verify'

export function AuthModal({
  language,
  initialMode = 'login',
  onClose,
  onAuthenticated,
  onPasswordReset,
  lockClose = false,
}: {
  language: Language
  initialMode?: Mode
  onClose: () => void
  onAuthenticated: () => void
  onPasswordReset?: () => void
  lockClose?: boolean
}) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)
  const [forgotCooldown, setForgotCooldown] = useState(0)
  const pt = language === 'pt'
  const t = authI18n[language]
  const confirmationEmailKey = 'lifedue-confirmation-email'
  const passwordRequirements = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
  const passwordIsStrong = Object.values(passwordRequirements).every(Boolean)

  const passwordStrength = useMemo(() => {
    if ((mode !== 'signup' && mode !== 'reset') || !password) return { score: 0, label: '', tone: '' }
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    if (password.length < 8) return { score, label: t.weakUseAtLeast8Characters, tone: 'weak' }
    if (score <= 2) return { score, label: t.weak, tone: 'weak' }
    if (score <= 3) return { score, label: t.fair, tone: 'fair' }
    return { score, label: t.strong, tone: 'strong' }
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

  useEffect(() => {
    if (mode !== 'reset' || email || !supabase) return
    let cancelled = false
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled && data.user?.email) setEmail(data.user.email)
    })
    return () => { cancelled = true }
  }, [mode, email])

  useEffect(() => {
    if (mode !== 'verify' || email) return
    const savedEmail = localStorage.getItem(confirmationEmailKey)
    if (savedEmail) setEmail(savedEmail)
  }, [mode, email])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = window.setInterval(() => setResendCooldown(value => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  useEffect(() => {
    if (forgotCooldown <= 0) return
    const timer = window.setInterval(() => setForgotCooldown(value => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [forgotCooldown])

  const verificationTitle = t.confirmYourEmail
  const title = mode === 'login' ? (t.signInToLifedue)
    : mode === 'signup' ? (t.createYourAccount)
    : mode === 'forgot' ? (t.forgotYourPassword)
    : mode === 'verify' ? verificationTitle
    : (t.resetYourPassword)
  const submitLabel = mode === 'login' ? (t.signIn)
    : mode === 'signup' ? (t.createAccount)
    : mode === 'forgot' ? (forgotCooldown > 0 ? (authExtraI18n[language].waitForgot.replace('{n}', String(forgotCooldown))) : (t.sendResetLink)) : mode === 'verify' ? (t.resendEmail) : (t.saveNewPassword)

  const friendlyAuthError = (authError: unknown) => {
    const message = authError instanceof Error ? authError.message.toLowerCase() : ''
    if (message.includes('invalid login credentials')) return t.incorrectEmailOrPasswordCheckYourDetailsAndTryAgain
    if (message.includes('email not confirmed')) return t.confirmYourEmailBeforeSigningInCheckYourSpamFolderToo
    if (message.includes('user already registered')) return t.thisEmailAlreadyHasAnAccountSignInInsteadOfCreatingAnotherOne
    if (message.includes('password should be at least')) return t.yourPasswordMustBeAtLeast8Characters
    if (message.includes('rate limit') || message.includes('too many requests') || message.includes('429')) return t.theEmailServiceHasTemporarilyReachedItsRequestLimitWaitAFewMinutesBeforeRequestingAnotherLink
    if (message.includes('failed to fetch') || message.includes('network') || message.includes('cors')) return t.theAuthenticationServiceIsTemporarilyUnavailableWaitAMomentAndTryAgain
    if (message.includes('expired') || message.includes('invalid') && message.includes('token')) return t.thisResetLinkHasExpiredOrWasAlreadyUsedRequestANewLink
    return t.weCouldNotCompleteThisRightNowCheckYourDetailsAndTryAgain
  }

  const resendConfirmation = async () => {
    if (!supabase || resending || resendCooldown > 0) return
    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setError(t.enterYourEmailToResendTheConfirmation)
      return
    }

    setError('')
    setSuccess('')
    localStorage.setItem(confirmationEmailKey, cleanEmail)
    setResending(true)
    try {
      const { error: authError } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: { emailRedirectTo: window.location.origin },
      })
      if (authError) throw authError
      setSuccess(t.aNewConfirmationEmailWasSentCheckYourInboxAndSpamFolder)
      setResendCooldown(30)
    } catch (authError) {
      console.error('LifeDue confirmation resend failed:', authError)
      setError(friendlyAuthError(authError))
    } finally {
      setResending(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return
    setError('')
    setSuccess('')

    const cleanEmail = email.trim()
    if (mode !== 'reset' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(t.enterAValidEmailAddress)
      return
    }

    if ((mode === 'signup' || mode === 'reset') && password !== confirmPassword) {
      setError(t.passwordsDoNotMatch)
      return
    }

    if ((mode === 'signup' || mode === 'reset') && !passwordIsStrong) {
      setError(t.chooseAStrongPasswordUse8CharactersUpperLowercaseLettersANumberAndASymbol)
      return
    }

    if (mode === 'signup' && (password.length < 8 || passwordStrength.tone === 'weak')) {
      setError(t.chooseAStrongerPasswordUse8CharactersUpperLowercaseLettersANumberAndASymbol)
      return
    }

    if (!supabase) {
      setError(t.supabaseIsNotConfiguredYet)
      return
    }

    setLoading(true)
    try {
      if (mode === 'verify') {
        await resendConfirmation()
        return
      }

      if (mode === 'login') {
        localStorage.setItem(confirmationEmailKey, cleanEmail)
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })
        if (authError) {
          if (authError.message.toLowerCase().includes('email not confirmed')) {
            setMode('verify')
            setPassword('')
            setConfirmPassword('')
            setSuccess(t.yourEmailIsNotConfirmedYetYouCanResendTheLinkBelow)
            return
          }
          throw authError
        }
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !sessionData.session?.user) {
          throw sessionError ?? new Error('Authentication session was not established.')
        }
        localStorage.removeItem(confirmationEmailKey)
        onAuthenticated()
        return
      }

      if (mode === 'signup') {
        localStorage.setItem(confirmationEmailKey, cleanEmail)
        const { data, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        })
        if (authError) throw authError

        // Supabase can intentionally return an obfuscated user for an existing
        // account when email confirmation is enabled. In that case no new
        // account was created, and an empty identities array is the signal.
        // Treat it as a duplicate signup instead of telling the user that a
        // new account was created.
        if (!data.user || (Array.isArray(data.user.identities) && data.user.identities.length === 0)) {
          setError(authI18n[language].thisEmailAlreadyHasAnAccountSignInInsteadOfCreatingAnotherOne)
          setMode('login')
          setPassword('')
          setConfirmPassword('')
          return
        }

        if (data.session) {
          localStorage.removeItem(confirmationEmailKey)
          onAuthenticated()
        } else {
          setSuccess(t.accountCreatedWeSentAConfirmationLinkToYourEmail)
          setMode('verify')
          setResendCooldown(30)
        }
        return
      }

      if (mode === 'forgot') {
        if (forgotCooldown > 0) {
          setError(authExtraI18n[language].waitForgot.replace('{n}', String(forgotCooldown)))
          return
        }
        const { error: authError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin,
        })
        if (authError) throw authError
        setForgotCooldown(60)
        setSuccess(t.ifThisEmailHasAnAccountWeSentASecurePasswordResetLinkCheckYourSpamFolderToo)
        return
      }

      const { error: authError } = await supabase.auth.updateUser({ password })
      if (authError) throw authError
      onPasswordReset?.()
      await supabase.auth.signOut()
      setMode('login')
      setSuccess(t.passwordResetSuccessfullyConfirmBelowToSignInAgain)
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
      setError(t.supabaseIsNotConfiguredYet)
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

  const isPasswordRecovery = mode === 'reset'
  const isCloseLocked = isPasswordRecovery || lockClose

  const handleClose = () => {
    if (isCloseLocked) return
    onClose()
  }

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) handleClose()
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={handleBackdropMouseDown}
      onKeyDown={event => {
        if (isCloseLocked && event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
        }
      }}
    >
      <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button
          className="auth-close"
          onClick={handleClose}
          aria-label={t.close}
          disabled={isCloseLocked}
          aria-disabled={isCloseLocked}
        >
          <X size={18} />
        </button>

        <div className="auth-brand"><span className="brand-mark">L</span><span>LifeDue</span></div>

        <div className="auth-head">
          <div className="auth-icon">{mode === 'forgot' || mode === 'reset' || mode === 'verify' ? <Mail size={20} /> : <CheckCircle2 size={20} />}</div>
          <div>
            <h2 id="auth-title">{title}</h2>
            <p>
              {mode === 'forgot'
                ? (t.getASecureLinkToResetYourPassword)
                : mode === 'reset'
                ? (t.chooseANewPasswordForYourAccount)
                : mode === 'verify'
                ? (t.weSentALinkToActivateYourAccountIfItFailsOrExpiresResendItHere)
                : (t.yourWorkspaceSecurelySynced)}
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
              {t.continueWithGoogle}
            </button>
            <div className="auth-divider"><span>{t.orUseEmailAndPassword}</span></div>
          </>
        )}
        {mode === 'verify' && (
          <div className="auth-verification-panel">
            <div className="auth-verification-icon"><Mail size={18} /></div>
            <div>
              <strong>{t.checkYourInbox}</strong>
              <p>{authExtraI18n[language].confirmAccountLink.replace('{email}', email.trim() || authExtraI18n[language].yourEmailFallback)}</p>
            </div>
          </div>
        )}
        {mode === 'forgot' && (
          <div className="auth-email-only-note">
            {t.enterTheEmailAssociatedWithYourAccountWeWillSendTheResetLinkToThatAddress}
          </div>
        )}

        {mode !== 'verify' && <form onSubmit={submit} className="auth-form">
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
              {mode === 'reset' ? authExtraI18n[language].newPassword : authExtraI18n[language].password}
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
                  aria-label={showPassword ? (t.hidePassword) : (t.showPassword)}
                  title={showPassword ? (t.hidePassword) : (t.showPassword)}
                >
                  {showPassword ? <Eye size={17} /> : <EyeOff size={17} />}
                </button>
              </span>
              {(mode === 'signup' || mode === 'reset') && (
                <>
                  <div className={`password-strength ${passwordStrength.tone}`} aria-live="polite">
                    <div className="password-strength-track">
                      <span style={{ width: `${Math.min(100, passwordStrength.score * 20)}%` }} />
                    </div>
                    <span>{passwordStrength.label || (t.useAStrongPassword)}</span>
                  </div>
                  <div className="password-requirements">
                    <span className={passwordRequirements.length ? 'met' : ''}>{t.8Characters}</span>
                    <span className={passwordRequirements.upper && passwordRequirements.lower ? 'met' : ''}>{t.upperLowercase}</span>
                    <span className={passwordRequirements.number ? 'met' : ''}>{t.number}</span>
                    <span className={passwordRequirements.symbol ? 'met' : ''}>{t.symbol}</span>
                  </div>
                  {mode === 'signup' && <button type="button" className="password-suggestion" onClick={suggestPassword}>
                    {t.suggestAStrongPassword}
                  </button>}
                </>
              )}
            </label>
          )}

          {mode === 'reset' && (
            <label>
              {t.confirmNewPassword}
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

          {mode === 'signup' && (
            <label>
              {t.confirmPassword}
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

          <button className="primary-button auth-submit" disabled={loading || (mode === 'forgot' && forgotCooldown > 0)} aria-busy={loading}>
            {loading ? <Loader2 size={17} className="spin" /> : null}
            {submitLabel}
          </button>
        </form>}

        {mode === 'verify' && (
          <div className="auth-verification-actions">
            <button type="button" className="primary-button auth-submit" onClick={() => void resendConfirmation()} disabled={resending || resendCooldown > 0} aria-busy={resending}>
              {resending ? <Loader2 size={17} className="spin" /> : <Mail size={17} />}
              {resendCooldown > 0 ? authExtraI18n[language].waitResend.replace('{n}', String(resendCooldown)) : t.resendConfirmationEmail}
            </button>
            <button type="button" className="secondary-button auth-change-email" onClick={() => { setMode('signup'); setPassword(''); setConfirmPassword(''); setError(''); setSuccess('') }}>
              {t.useAnotherEmail}
            </button>
          </div>
        )}

        <div className="auth-links">
          {mode === 'forgot' && (
            <button onClick={() => { setMode('login'); setPassword(''); setError(''); setSuccess('') }}>
              <ArrowLeft size={14} /> {t.backToSignIn}
            </button>
          )}
          {mode === 'reset' && (
            <button
              onClick={() => {
                void supabase?.auth.signOut()
                onClose()
              }}
              disabled={loading}
            >
              <ArrowLeft size={14} /> {t.cancelPasswordReset}
            </button>
          )}
          {mode === 'verify' && (
            <button onClick={() => { setMode('login'); setPassword(''); setError(''); setSuccess('') }}>
              <ArrowLeft size={14} /> {t.backToSignIn}
            </button>
          )}
          {mode === 'login' && (
            <>
              <button onClick={() => { setMode('forgot'); setPassword(''); setConfirmPassword(''); setError(''); setSuccess('') }}>
                {t.forgotMyPassword}
              </button>
              <button onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>
                {t.createAnAccount}
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button onClick={() => { setMode('login'); setError(''); setSuccess('') }}>
              {t.iAlreadyHaveAnAccount}
            </button>
          )}
        </div>

        <p className="auth-note">
          {appInlineI18n[language].yourDataIsAssociatedWithYourAccountAndProtectedByLifedueAccessControls}
        </p>
      </div>
    </div>
  )
}
