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
  const normalize = (value: string) => value.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLocaleLowerCase().trim()
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
  const [detailDecisions, setDetailDecisions] = useState<Record<string, DetailDecision>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    setDecisions(initial)
    setDetailDecisions({})
    setError('')
  }, [initial])

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

  const clearDetail = (key: string, field: keyof DetailDecision) => {
    setDetailDecisions(current => {
      const next = { ...current }
      const detail = { ...(next[key] ?? {}) }
      delete detail[field]
      next[key] = detail
      return next
    })
    setError('')
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
            <p>{pt ? 'A IA organizou o seu trabalho. Revise o que foi entendido e complete apenas os dados que faltam.' : 'AI organized your work. Review what was understood and complete only the missing details.'}</p>
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

        {safeItems.length > 0 && (
          <section className="plan-review-section">
            <div className="plan-review-section-head">
              <UserRound size={17} />
              <div>
                <strong>{pt ? 'Clientes' : 'Clients'}</strong>
                <span>{pt ? 'Confirme clientes existentes ou nomes novos.' : 'Confirm existing clients or new names.'}</span>
              </div>
            </div>
            <div className="plan-review-list">
              {safeItems.map(item => {
                const decision = decisions[item.key]
                const hasExisting = Boolean(item.existingName)
                const useExisting = decision?.mode === 'existing'

                return (
                  <div className="plan-review-item" key={item.key}>
                    <div className="plan-review-item-head">
                      <div>
                        <strong>{item.label}</strong>
                        <span>{hasExisting
                          ? (pt ? `Já existe “${item.existingName}”.` : `“${item.existingName}” already exists.`)
                          : (pt ? 'Novo cliente' : 'New client')}</span>
                      </div>
                    </div>

                    {hasExisting && (
                      <div className="plan-review-choice">
                        <button type="button" className={useExisting ? 'plan-review-choice-button active' : 'plan-review-choice-button'} onClick={() => update(item.key, { mode: 'existing', name: item.existingName! })}>
                          <Check size={15} /> {pt ? 'Usar existente' : 'Use existing'}
                        </button>
                        <button type="button" className={!useExisting ? 'plan-review-choice-button active' : 'plan-review-choice-button'} onClick={() => update(item.key, { mode: 'new', name: decision?.name === item.existingName ? '' : decision?.name ?? '' })}>
                          {pt ? 'Outro nome' : 'Another name'}
                        </button>
                      </div>
                    )}

                    {(!hasExisting || !useExisting) && (
                      <input
                        value={decision?.name ?? ''}
                        onChange={event => update(item.key, { mode: 'new', name: event.target.value })}
                        placeholder={pt ? 'Nome do cliente' : 'Client name'}
                        autoComplete="off"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {details.length > 0 && (
          <section className="plan-review-section">
            <div className="plan-review-section-head">
              <Flag size={17} />
              <div>
                <strong>{pt ? 'Detalhes a confirmar' : 'Details to confirm'}</strong>
                <span>{pt ? 'Nada aqui é obrigatório. Pode deixar para depois.' : 'Nothing here is required. You can leave it for later.'}</span>
              </div>
            </div>

            <div className="plan-review-details-list">
              {details.map(detail => {
                const decision = detailDecisions[detail.key] ?? {}
                return (
                  <div className="plan-review-detail-card" key={detail.key}>
                    <strong className="plan-review-detail-title">{detail.title}</strong>

                    {detail.clientMissing && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span>{pt ? 'Cliente' : 'Client'}</span>
                          <button type="button" className="plan-review-skip" onClick={() => clearDetail(detail.key, 'client')}>{pt ? 'Pular' : 'Skip'}</button>
                        </div>
                        <input value={decision.client ?? ''} onChange={event => updateDetail(detail.key, { client: event.target.value })} placeholder={pt ? 'Nome do cliente (opcional)' : 'Client name (optional)'} autoComplete="off" />
                      </div>
                    )}

                    {detail.dueDateMissing && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span><CalendarDays size={14} /> {pt ? 'Prazo' : 'Deadline'}</span>
                          <button type="button" className="plan-review-skip" onClick={() => clearDetail(detail.key, 'dueDate')}>{pt ? 'Pular' : 'Skip'}</button>
                        </div>
                        <input type="date" min={today} value={decision.dueDate ?? ''} onChange={event => updateDetail(detail.key, { dueDate: event.target.value })} />
                      </div>
                    )}

                    {detail.priorityMissing && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span><Flag size={14} /> {pt ? 'Prioridade' : 'Priority'}</span>
                          <button type="button" className="plan-review-skip" onClick={() => clearDetail(detail.key, 'priority')}>{pt ? 'Pular' : 'Skip'}</button>
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

                    {detail.kind === 'payment' && detail.amountMissing && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span><CircleDollarSign size={14} /> {pt ? 'Valor' : 'Amount'}</span>
                          <button type="button" className="plan-review-skip" onClick={() => clearDetail(detail.key, 'amount')}>{pt ? 'Pular' : 'Skip'}</button>
                        </div>
                        <input type="number" min="0" step="any" value={decision.amount ?? ''} onChange={event => updateDetail(detail.key, { amount: event.target.value === '' ? undefined : Number(event.target.value) })} placeholder={pt ? 'Ex.: 200000' : 'e.g. 200000'} inputMode="decimal" />
                      </div>
                    )}

                    {detail.kind === 'payment' && detail.currencyMissing && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span><CircleDollarSign size={14} /> {pt ? 'Moeda' : 'Currency'}</span>
                          <button type="button" className="plan-review-skip" onClick={() => clearDetail(detail.key, 'currency')}>{pt ? 'Pular' : 'Skip'}</button>
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
          <button type="button" className="primary-button" onClick={submit}>
            {pt ? 'Guardar plano' : 'Save plan'} <ChevronRight size={17} />
          </button>
        </div>
      </section>
    </div>
  )
}
