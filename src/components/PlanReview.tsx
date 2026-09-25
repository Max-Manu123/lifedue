import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronRight, CircleDollarSign, Flag, UserRound, X } from 'lucide-react'
import type { PaymentCurrency, Priority } from '../types'

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
}

type ClientDecision = {
  mode: 'existing' | 'new'
  name: string
}

type DetailDecision = {
  client?: string
  dueDate?: string
  priority?: Priority
  amount?: number
  currency?: PaymentCurrency | null
  paymentEnabled?: boolean
  paymentDueDate?: string
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
      ...(detail.priority ? { priority: detail.priority } : {}),
      ...(detail.amount !== undefined && detail.amount !== null ? { amount: detail.amount } : {}),
      ...(detail.currency ? { currency: detail.currency } : {}),
      ...(detail.kind === 'task' && detail.paymentAlreadyIncluded ? { paymentEnabled: true } : {}),
      ...(paymentDueDate ? { paymentDueDate } : {}),
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
        setError(pt ? 'Escolha ou informe um cliente para continuar.' : 'Choose or enter a client to continue.')
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
        setError(pt ? 'Escolha ou informe um cliente para continuar.' : 'Choose or enter a client to continue.')
        return
      }
      if (item.existingName && decision.mode === 'new' && name.toLocaleLowerCase() === item.existingName.toLocaleLowerCase()) {
        setError(pt ? 'Use o cliente existente ou escolha outro nome.' : 'Use the existing client or choose another name.')
        return
      }
      result[item.key] = name
    }

    for (const detail of details) {
      const decision = detailDecisions[detail.key]
      if (detail.dueDateMissing && decision?.dueDate && decision.dueDate < today) {
        setError(pt ? 'Escolha um prazo de hoje ou de uma data futura.' : 'Choose today or a future date.')
        return
      }
      if (detail.amountMissing && decision?.amount !== undefined && (!Number.isFinite(decision.amount) || decision.amount < 0)) {
        setError(pt ? 'Digite um valor de pagamento válido.' : 'Enter a valid payment amount.')
        return
      }
      if (detail.kind === 'task' && decision?.paymentEnabled) {
        const amount = decision.amount
        if (!Number.isFinite(amount) || amount === undefined || amount <= 0) {
          setError(pt ? 'Digite um valor de pagamento válido.' : 'Enter a valid payment amount.')
          return
        }
        if (!decision.currency) {
          setError(pt ? 'Escolha a moeda do pagamento.' : 'Choose the payment currency.')
          return
        }
        if (!decision.paymentDueDate || !isValidReviewDate(decision.paymentDueDate, today)) {
          setError(pt ? 'Escolha uma data de vencimento válida.' : 'Choose a valid payment due date.')
          return
        }
        const clientName = decision.client?.trim() || detail.clientName?.trim() || ''
        if (!clientName) {
          setError(pt ? 'Informe o cliente antes de adicionar o pagamento.' : 'Enter the client before adding the payment.')
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
            <p className="section-kicker">{pt ? 'REVER ANTES DE GUARDAR' : 'REVIEW BEFORE SAVING'}</p>
            <h2 id="plan-review-title">{pt ? 'Confirme seu plano' : 'Confirm your plan'}</h2>
            <p>{pt ? 'A IA preencheu o que entendeu. Confirme ou ajuste antes de guardar.' : 'AI filled in what it understood. Confirm or adjust it before saving.'}</p>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} aria-label={pt ? 'Fechar' : 'Close'}><X size={18} /></button>
        </div>

        <div className="plan-review-summary">
          <div className="plan-review-summary-head">
            <div>
              <strong>{pt ? 'Plano criado' : 'Plan created'}</strong>
              <span>{pt ? `${details.length > 0 ? 'Alguns detalhes precisam de confirmação.' : 'Tudo está pronto para guardar.'}` : details.length > 0 ? 'Some details need confirmation.' : 'Everything is ready to save.'}</span>
            </div>
            <span className="plan-review-count">{details.length > 0 ? (pt ? 'Revisar' : 'Review') : (pt ? 'Pronto' : 'Ready')}</span>
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
                    <span>{detail.kind === 'payment' ? (pt ? 'Pagamento' : 'Payment') : (pt ? 'Tarefa' : 'Task')}</span>
                  </div>
                </div>
              ))
              : safeItems.map(item => (
                <div className="plan-review-plan-row" key={item.key}>
                  <div className="plan-review-plan-icon"><Check size={16} /></div>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.existingName ? (pt ? 'Cliente existente' : 'Existing client') : (pt ? 'Novo cliente' : 'New client')}</span>
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
                <strong>{pt ? 'Detalhes do plano' : 'Plan details'}</strong>
                <span>{pt ? 'A IA preencheu o que encontrou. Os campos em branco são opcionais.' : 'AI filled what it found. Blank fields are optional.'}</span>
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
                          <span>{pt ? 'Cliente' : 'Client'}</span>
                        </div>
                        <input value={decision.client ?? ''} onChange={event => updateDetail(detail.key, { client: event.target.value })} placeholder={pt ? 'Nome do cliente (opcional)' : 'Client name (optional)'} autoComplete="off" />
                      </div>
                    )}

                    {(detail.dueDateMissing || detail.dueDate) && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span><CalendarDays size={14} /> {pt ? 'Prazo' : 'Deadline'}</span>
                        </div>
                        <input
                          type="date"
                          min={today}
                          value={decision.dueDate ?? ''}
                          onChange={event => updateDetail(detail.key, { dueDate: event.target.value || undefined })}
                          aria-label={pt ? `Prazo para ${detail.title}` : `Deadline for ${detail.title}`}
                        />
                        <small className="field-help">{detail.dueDate ? (pt ? 'Data entendida pela IA. Você pode ajustar.' : 'Date understood by AI. You can adjust it.') : (pt ? 'Opcional — escolha hoje ou uma data futura se quiser.' : 'Optional — choose today or a future date if you want.')}</small>
                      </div>
                    )}

                    {(detail.priorityMissing || detail.priority) && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span><Flag size={14} /> {pt ? 'Prioridade' : 'Priority'}</span>
                        </div>
                        <div className="plan-review-priority">
                          {(['low', 'medium', 'high'] as Priority[]).map(priority => (
                            <button key={priority} type="button" className={decision.priority === priority ? 'plan-review-choice-button active' : 'plan-review-choice-button'} onClick={() => updateDetail(detail.key, { priority })}>
                              {pt ? ({ low: 'Baixa', medium: 'Média', high: 'Alta' }[priority]) : ({ low: 'Low', medium: 'Medium', high: 'High' }[priority])}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {detail.kind === 'task' && (
                      <div className={decision.client?.trim() || detail.clientName ? 'plan-review-payment-box' : 'plan-review-payment-box plan-review-payment-box-disabled'}>
                        <div className="plan-review-payment-head">
                          <div>
                            <strong>{pt ? 'Pagamento' : 'Payment'}</strong>
                            <span>{decision.paymentEnabled
                              ? (detail.paymentAlreadyIncluded
                                ? (pt ? 'Pagamento encontrado pela IA. Confirme ou ajuste os dados.' : 'Payment found by AI. Confirm or adjust the details.')
                                : (pt ? 'Adicione uma cobrança para este cliente dentro do mesmo plano.' : 'Add a payment for this client inside the same plan.'))
                              : (detail.clientName || decision.client
                                ? (pt ? 'Nenhum pagamento foi definido para este cliente.' : 'No payment has been defined for this client.')
                                : (pt ? 'Informe o cliente acima para poder adicionar um pagamento.' : 'Enter the client above to add a payment.'))}</span>
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
                              <CircleDollarSign size={14} /> {pt ? 'Adicionar pagamento' : 'Add payment'}
                            </button>
                          )}
                        </div>
                        {decision.paymentEnabled && (
                          <div className="plan-review-payment-fields">
                              <div className="plan-review-field-head"><span><CircleDollarSign size={14} /> {pt ? 'Valor' : 'Amount'}</span></div>
                              <input type="number" min="0" step="any" value={decision.amount ?? ''} onChange={event => updateDetail(detail.key, { amount: event.target.value === '' ? undefined : Number(event.target.value) })} placeholder={pt ? 'Ex.: 200000' : 'e.g. 200000'} inputMode="decimal" />
                            </div>
                            <div className="plan-review-field">
                              <div className="plan-review-field-head"><span><CircleDollarSign size={14} /> {pt ? 'Moeda' : 'Currency'}</span></div>
                              <select value={decision.currency ?? ''} onChange={event => updateDetail(detail.key, { currency: (event.target.value || undefined) as PaymentCurrency | undefined })}>
                                <option value="">{pt ? 'Escolher moeda' : 'Choose currency'}</option>
                                <option value="AOA">AOA · Kz</option>
                                <option value="USD">USD · US$</option>
                                <option value="EUR">EUR · €</option>
                                <option value="BRL">BRL · R$</option>
                                <option value="GBP">GBP · £</option>
                                <option value="Other">{pt ? 'Outra' : 'Other'}</option>
                              </select>
                            </div>
                            <div className="plan-review-field">
                              <div className="plan-review-field-head"><span><CalendarDays size={14} /> {pt ? 'Vencimento' : 'Payment due date'}</span></div>
                              <input type="date" min={today} value={decision.paymentDueDate ?? ''} onChange={event => updateDetail(detail.key, { paymentDueDate: event.target.value || undefined })} />
                            </div>
                            <button type="button" className="plan-review-remove-payment" onClick={() => updateDetail(detail.key, { paymentEnabled: false, amount: undefined, currency: undefined, paymentDueDate: undefined })}>
                              {pt ? 'Remover pagamento' : 'Remove payment'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {detail.kind === 'payment' && detail.amountMissing && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span><CircleDollarSign size={14} /> {pt ? 'Valor' : 'Amount'}</span>
                          </div>
                        <input type="number" min="0" step="any" value={decision.amount ?? ''} onChange={event => updateDetail(detail.key, { amount: event.target.value === '' ? undefined : Number(event.target.value) })} placeholder={pt ? 'Ex.: 200000' : 'e.g. 200000'} inputMode="decimal" />
                      </div>
                    )}

                    {detail.kind === 'payment' && detail.currencyMissing && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span><CircleDollarSign size={14} /> {pt ? 'Moeda' : 'Currency'}</span>
                          </div>
                        <select value={decision.currency ?? ''} onChange={event => updateDetail(detail.key, { currency: (event.target.value || undefined) as PaymentCurrency | undefined })}>
                          <option value="">{pt ? 'Escolher moeda' : 'Choose currency'}</option>
                          <option value="AOA">AOA · Kz</option>
                          <option value="USD">USD · US$</option>
                          <option value="EUR">EUR · €</option>
                          <option value="BRL">BRL · R$</option>
                          <option value="GBP">GBP · £</option>
                          <option value="Other">{pt ? 'Outra' : 'Other'}</option>
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
          <button type="button" className="secondary-button" onClick={onCancel}>{pt ? 'Voltar' : 'Back'}</button>
          {details.length > 0 && (
            <button type="button" className="secondary-button" onClick={saveWithoutCompleting}>
              {pt ? 'Guardar sem completar' : 'Save without completing'}
            </button>
          )}
          <button type="button" className="primary-button" onClick={submit}>
            {pt ? 'Guardar plano' : 'Save plan'} <ChevronRight size={17} />
          </button>
        </div>
      </section>
    </div>
  )
}
