import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronRight, CircleDollarSign, Flag, UserRound, X } from 'lucide-react'
import type { PaymentCurrency, Priority } from '../types'
import { planReviewI18n, planExtraI18n } from '../lib/i18n'

type Language = 'en' | 'pt'

type ReviewItem = {
  key: string
  label: string
  originalName?: string
  existingName?: string
}

type ReviewDetail = {
  key: string
  title: string
  kind: 'task' | 'payment'
  clientMissing: boolean
  dueDateMissing: boolean
  dueDate?: string
  priorityMissing: boolean
  priority?: Priority
  amountMissing: boolean
  amount?: number
  currencyMissing: boolean
  currency?: PaymentCurrency | null
  clientName?: string
  paymentAlreadyIncluded?: boolean
  paymentDueDate?: string
  paymentDueDateProvided?: boolean
}

type ClientDecision = {
  mode: 'existing' | 'new'
  name: string
}

type DetailDecision = {
  client?: string
  dueDate?: string
  dueDateProvided?: boolean
  priority?: Priority
  amount?: number
  currency?: PaymentCurrency | null
  paymentEnabled?: boolean
  paymentDueDate?: string
  paymentDueDateProvided?: boolean
}

function isValidReviewDate(value: string, minimum: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(minimum)) return false

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return false

  return value >= minimum
}

export function PlanReview({
  language,
  items,
  details,
  today,
  onConfirm,
  onCancel,
}: {
  language: Language
  items: ReviewItem[]
  details: ReviewDetail[]
  today: string
  onConfirm: (clients: Record<string, string>, detailDecisions: Record<string, DetailDecision>) => void
  onCancel: () => void
}) {
  const pt = language === 'pt'
  const t = planReviewI18n[language]
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim()
  const isMissingClient = (value: string) => {
    const normalized = normalize(value)
    return !normalized
      || normalized === 'cliente nao definido'
      || normalized === 'cliente nao informado'
      || normalized === 'sem cliente'
      || normalized === 'client not set'
      || normalized === 'no client'
      || normalized === 'no client defined'
      || normalized.endsWith(' · cliente nao definido')
      || normalized.endsWith(' · cliente nao informado')
      || normalized.endsWith(' · sem cliente')
      || normalized.endsWith(' · client not set')
      || normalized.endsWith(' · no client')
      || normalized.endsWith(' · no client defined')
  }
  // Defensive boundary: a missing AI client is optional and must never become a fake client.
  const safeItems = items.filter(item => !isMissingClient(item.label) && !isMissingClient(item.originalName ?? ''))
  const itemSignature = safeItems.map(item => `${item.key}|${item.originalName ?? ''}|${item.existingName ?? ''}`).join('||')
  const initial = useMemo(() => Object.fromEntries(safeItems.map(item => [
    item.key,
    {
      mode: item.existingName ? 'existing' : 'new',
      name: item.existingName ?? item.originalName ?? '',
    } satisfies ClientDecision,
  ])) as Record<string, ClientDecision>, [itemSignature])

  const [decisions, setDecisions] = useState<Record<string, ClientDecision>>(initial)
  const initialDetailDecisions = useMemo(() => Object.fromEntries(details.map(detail => {
    const dueDate = detail.dueDate && isValidReviewDate(detail.dueDate, today) ? detail.dueDate : undefined
    const paymentDueDate = detail.paymentDueDate && isValidReviewDate(detail.paymentDueDate, today) ? detail.paymentDueDate : undefined
    return [detail.key, {
      ...(detail.clientName ? { client: detail.clientName } : {}),
      ...(dueDate ? { dueDate } : {}),
      dueDateProvided: Boolean(dueDate),
      ...(detail.priority ? { priority: detail.priority } : {}),
      ...(detail.amount !== undefined && detail.amount !== null ? { amount: detail.amount } : {}),
      ...(detail.currency ? { currency: detail.currency } : {}),
      ...(detail.kind === 'task' && detail.paymentAlreadyIncluded ? { paymentEnabled: true } : {}),
      ...(paymentDueDate ? { paymentDueDate } : {}),
      paymentDueDateProvided: Boolean(paymentDueDate),
    } satisfies DetailDecision]
  })) as Record<string, DetailDecision>, [details, today])

  const [detailDecisions, setDetailDecisions] = useState<Record<string, DetailDecision>>(initialDetailDecisions)
  const [error, setError] = useState('')

  useEffect(() => {
    setDecisions(initial)
    setDetailDecisions(initialDetailDecisions)
    setError('')
  }, [initial, initialDetailDecisions])

  const update = (key: string, patch: Partial<ClientDecision>) => {
    setDecisions(current => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }))
    setError('')
  }

  const updateDetail = (key: string, patch: Partial<DetailDecision>) => {
    setDetailDecisions(current => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }))
    setError('')
  }

  const saveWithoutCompleting = () => {
    const result: Record<string, string> = {}

    for (const item of safeItems) {
      const decision = decisions[item.key]
      const name = decision?.name.trim() ?? ''
      if (!name) {
        setError(t.chooseOrEnterAClientToContinue)
        return
      }
      result[item.key] = name
    }

    onConfirm(result, detailDecisions)
  }

  const submit = () => {
    const result: Record<string, string> = {}

    for (const item of safeItems) {
      const decision = decisions[item.key]
      const name = decision?.name.trim() ?? ''
      if (!name) {
        setError(t.chooseOrEnterAClientToContinue)
        return
      }
      if (item.existingName && decision.mode === 'new' && name.toLocaleLowerCase() === item.existingName.toLocaleLowerCase()) {
        setError(t.useTheExistingClientOrChooseAnotherName)
        return
      }
      result[item.key] = name
    }

    for (const detail of details) {
      const decision = detailDecisions[detail.key]
      if (decision?.dueDateProvided !== false && !decision?.dueDate) {
        setError(t.chooseADateOrSelectNoDeadline)
        return
      }
      if (decision?.dueDateProvided !== false && decision?.dueDate && decision.dueDate < today) {
        setError(t.chooseTodayOrAFutureDate)
        return
      }
      if (detail.amountMissing && decision?.amount !== undefined && (!Number.isFinite(decision.amount) || decision.amount < 0)) {
        setError(t.enterAValidPaymentAmount)
        return
      }
      if (detail.kind === 'task' && decision?.paymentEnabled) {
        const amount = decision.amount
        if (!Number.isFinite(amount) || amount === undefined || amount <= 0) {
          setError(t.enterAValidPaymentAmount)
          return
        }
        if (!decision.currency) {
          setError(t.chooseThePaymentCurrency)
          return
        }
        if (decision.paymentDueDateProvided !== false && !decision.paymentDueDate) {
          setError(t.chooseADueDateOrSelectNoDueDate)
          return
        }
        if (decision.paymentDueDateProvided !== false && decision.paymentDueDate && !isValidReviewDate(decision.paymentDueDate, today)) {
          setError(t.chooseAValidDueDateOrSelectNoDueDate)
          return
        }
        const clientName = decision.client?.trim() || detail.clientName?.trim() || ''
        if (!clientName) {
          setError(t.enterTheClientBeforeAddingThePayment)
          return
        }
      }
    }

    onConfirm(result, detailDecisions)
  }

  return (
    <div className="plan-review-backdrop" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) onCancel() }}>
      <section className="plan-review-modal" role="dialog" aria-modal="true" aria-labelledby="plan-review-title">
        <div className="plan-review-head">
          <div className="plan-review-icon"><Check size={19} /></div>
          <div className="plan-review-head-copy">
            <p className="section-kicker">{t.reviewBeforeSaving}</p>
            <h2 id="plan-review-title">{t.confirmYourPlan}</h2>
            <p>{t.aiFilledInWhatItUnderstoodConfirmOrAdjustItBeforeSaving}</p>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} aria-label={t.close}><X size={18} /></button>
        </div>

        <div className="plan-review-summary">
          <div className="plan-review-summary-head">
            <div>
              <strong>{t.planCreated}</strong>
              <span>{details.length > 0 ? planExtraI18n[language].someDetails : planExtraI18n[language].everythingReady}</span>
            </div>
            <span className="plan-review-count">{details.length > 0 ? (t.review) : (t.ready)}</span>
          </div>
          <div className="plan-review-plan-list">
            {details.length > 0
              ? details.map(detail => (
                <div className="plan-review-plan-row" key={detail.key}>
                  <div className="plan-review-plan-icon">
                    {detail.kind === 'payment' ? <CircleDollarSign size={16} /> : <CalendarDays size={16} />}
                  </div>
                  <div>
                    <strong>{detail.title}</strong>
                    <span>{detail.kind === 'payment' ? (t.payment) : (t.task)}</span>
                  </div>
                </div>
              ))
              : safeItems.map(item => (
                <div className="plan-review-plan-row" key={item.key}>
                  <div className="plan-review-plan-icon"><Check size={16} /></div>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.existingName ? (t.existingClient) : (t.newClient)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {details.length > 0 && (
          <section className="plan-review-section">
            <div className="plan-review-section-head">
              <Flag size={17} />
              <div>
                <strong>{t.planDetails}</strong>
                <span>{t.aiFilledWhatItFoundBlankFieldsAreOptional}</span>
              </div>
            </div>

            <div className="plan-review-details-list">
              {details.map(detail => {
                const decision = detailDecisions[detail.key] ?? {}
                return (
                  <div className="plan-review-detail-card" key={detail.key}>
                    <strong className="plan-review-detail-title">{detail.title}</strong>

                    {(detail.clientMissing || detail.clientName) && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span>{t.client}</span>
                        </div>
                        <input value={decision.client ?? ''} onChange={event => updateDetail(detail.key, { client: event.target.value })} placeholder={t.clientNameOptional} autoComplete="off" />
                      </div>
                    )}

                    {(detail.dueDateMissing || detail.dueDate) && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span><CalendarDays size={14} /> {t.deadline}</span>
                        </div>
                        <div className="plan-review-priority">
                          <button
                            type="button"
                            className={decision.dueDateProvided !== false ? 'plan-review-choice-button active' : 'plan-review-choice-button'}
                            onClick={() => updateDetail(detail.key, { dueDateProvided: true })}
                          >
                            {t.chooseDate}
                          </button>
                          <button
                            type="button"
                            className={decision.dueDateProvided === false ? 'plan-review-choice-button active' : 'plan-review-choice-button'}
                            onClick={() => updateDetail(detail.key, { dueDateProvided: false, dueDate: undefined })}
                          >
                            {t.noDeadline}
                          </button>
                        </div>
                        {decision.dueDateProvided !== false && (
                          <input
                            type="date"
                            min={today}
                            value={decision.dueDate ?? ''}
                            onChange={event => updateDetail(detail.key, { dueDate: event.target.value || undefined, dueDateProvided: Boolean(event.target.value) })}
                            aria-label={planExtraI18n[language].deadlineFor.replace('{title}', detail.title)}
                          />
                        )}
                        <small className="field-help">{decision.dueDateProvided === false
                          ? (t.thisTaskWillHaveNoDeadline)
                          : (detail.dueDate ? (t.dateUnderstoodByAiYouCanAdjustIt) : (t.optionalChooseADateOrLeaveItWithoutADeadline))}</small>
                      </div>
                    )}

                    {(detail.priorityMissing || detail.priority) && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span><Flag size={14} /> {t.priority}</span>
                        </div>
                        <div className="plan-review-priority">
                          {(['low', 'medium', 'high'] as Priority[]).map(priority => (
                            <button key={priority} type="button" className={decision.priority === priority ? 'plan-review-choice-button active' : 'plan-review-choice-button'} onClick={() => updateDetail(detail.key, { priority })}>
                              {planExtraI18n[language][priority]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {detail.kind === 'task' && (
                      <div className={decision.client?.trim() || detail.clientName ? 'plan-review-payment-box' : 'plan-review-payment-box plan-review-payment-box-disabled'}>
                        <div className="plan-review-payment-head">
                          <div>
                            <strong>{t.payment}</strong>
                            <span>{decision.paymentEnabled
                              ? (detail.paymentAlreadyIncluded
                                ? (t.paymentFoundByAiConfirmOrAdjustTheDetails)
                                : (t.addAPaymentForThisClientInsideTheSamePlan))
                              : (detail.clientName || decision.client
                                ? (t.noPaymentHasBeenDefinedForThisClient)
                                : (t.enterTheClientAboveToAddAPayment))}</span>
                          </div>
                          {!decision.paymentEnabled && (
                            <button
                              type="button"
                              className="plan-review-choice-button"
                              disabled={!detail.clientName && !decision.client?.trim()}
                              onClick={() => updateDetail(detail.key, {
                                paymentEnabled: true,
                                paymentDueDate: detail.paymentDueDate && isValidReviewDate(detail.paymentDueDate, today)
                                  ? detail.paymentDueDate
                                  : (detail.dueDate && isValidReviewDate(detail.dueDate, today) ? detail.dueDate : undefined),
                              })}
                            >
                              <CircleDollarSign size={14} /> {t.addPayment}
                            </button>
                          )}
                        </div>
                        {decision.paymentEnabled && (
                          <div className="plan-review-payment-fields">
                            <div className="plan-review-field">
                              <div className="plan-review-field-head"><span><CircleDollarSign size={14} /> {t.amount}</span></div>
                              <input type="number" min="0" step="any" value={decision.amount ?? ''} onChange={event => updateDetail(detail.key, { amount: event.target.value === '' ? undefined : Number(event.target.value) })} placeholder={t.eG200000} inputMode="decimal" />
                            </div>
                            <div className="plan-review-field">
                              <div className="plan-review-field-head"><span><CircleDollarSign size={14} /> {t.currency}</span></div>
                              <select value={decision.currency ?? ''} onChange={event => updateDetail(detail.key, { currency: (event.target.value || undefined) as PaymentCurrency | undefined })}>
                                <option value="">{t.chooseCurrency}</option>
                                <option value="AOA">AOA · Kz</option>
                                <option value="USD">USD · US$</option>
                                <option value="EUR">EUR · €</option>
                                <option value="BRL">BRL · R$</option>
                                <option value="GBP">GBP · £</option>
                                <option value="Other">{t.other}</option>
                              </select>
                            </div>
                            <div className="plan-review-field">
                              <div className="plan-review-field-head"><span><CalendarDays size={14} /> {t.paymentDueDate}</span></div>
                              <div className="plan-review-priority">
                                <button
                                  type="button"
                                  className={decision.paymentDueDateProvided !== false ? 'plan-review-choice-button active' : 'plan-review-choice-button'}
                                  onClick={() => updateDetail(detail.key, { paymentDueDateProvided: true })}
                                >
                                  {t.chooseDate}
                                </button>
                                <button
                                  type="button"
                                  className={decision.paymentDueDateProvided === false ? 'plan-review-choice-button active' : 'plan-review-choice-button'}
                                  onClick={() => updateDetail(detail.key, { paymentDueDateProvided: false, paymentDueDate: undefined })}
                                >
                                  {t.noDueDate}
                                </button>
                              </div>
                              {decision.paymentDueDateProvided !== false && (
                                <input type="date" min={today} value={decision.paymentDueDate ?? ''} onChange={event => updateDetail(detail.key, { paymentDueDate: event.target.value || undefined, paymentDueDateProvided: Boolean(event.target.value) })} />
                              )}
                              <small className="field-help">{decision.paymentDueDateProvided === false
                                ? (t.thisPaymentWillHaveNoDueDate)
                                : (detail.paymentDueDate ? (t.dateUnderstoodByAiYouCanAdjustIt) : (t.optionalChooseADateOrLeaveItWithoutADueDate))}</small>
                            </div>
                            <button type="button" className="plan-review-remove-payment" onClick={() => updateDetail(detail.key, { paymentEnabled: false, amount: undefined, currency: undefined, paymentDueDate: undefined })}>
                              {t.removePayment}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {detail.kind === 'payment' && detail.amountMissing && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span><CircleDollarSign size={14} /> {t.amount}</span>
                          </div>
                        <input type="number" min="0" step="any" value={decision.amount ?? ''} onChange={event => updateDetail(detail.key, { amount: event.target.value === '' ? undefined : Number(event.target.value) })} placeholder={t.eG200000} inputMode="decimal" />
                      </div>
                    )}

                    {detail.kind === 'payment' && detail.currencyMissing && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span><CircleDollarSign size={14} /> {t.currency}</span>
                          </div>
                        <select value={decision.currency ?? ''} onChange={event => updateDetail(detail.key, { currency: (event.target.value || undefined) as PaymentCurrency | undefined })}>
                          <option value="">{t.chooseCurrency}</option>
                          <option value="AOA">AOA · Kz</option>
                          <option value="USD">USD · US$</option>
                          <option value="EUR">EUR · €</option>
                          <option value="BRL">BRL · R$</option>
                          <option value="GBP">GBP · £</option>
                          <option value="Other">{t.other}</option>
                        </select>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {error && <div className="quick-error" role="alert">{error}</div>}

        <div className="plan-review-footer">
          <button type="button" className="secondary-button" onClick={onCancel}>{t.back}</button>
          {details.length > 0 && (
            <button type="button" className="secondary-button" onClick={saveWithoutCompleting}>
              {t.saveWithoutCompleting}
            </button>
          )}
          <button type="button" className="primary-button" onClick={submit}>
            {t.savePlan} <ChevronRight size={17} />
          </button>
        </div>
      </section>
    </div>
  )
}
