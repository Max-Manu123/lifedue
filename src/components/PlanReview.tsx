import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, ChevronRight, Clock3, Users, X } from 'lucide-react'
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
  const itemSignature = items.map(item => `${item.key}|${item.originalName ?? ''}|${item.existingName ?? ''}`).join('||')
  const initial = useMemo(() => Object.fromEntries(items.map(item => [
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

  const update = (key: string, patch: Partial<{ mode: 'existing' | 'new'; name: string }>) => {
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
      const currentDetail = { ...(next[key] ?? {}) }
      delete currentDetail[field]
      next[key] = currentDetail
      return next
    })
    setError('')
  }

  const submit = () => {
    const result: Record<string, string> = {}
    for (const item of items) {
      const decision = decisions[item.key]
      const name = decision?.name.trim() ?? ''
      if (!name) {
        setError(pt
          ? 'Preencha o nome do cliente ou deixe o campo em branco para guardar sem cliente.'
          : 'Enter a client name or leave it blank to save without a client.')
        return
      }
      if (item.existingName && decision.mode === 'new' && name.toLocaleLowerCase() === item.existingName.toLocaleLowerCase()) {
        setError(pt ? 'Escolha outro nome ou use o cliente existente.' : 'Choose another name or use the existing client.')
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

  const missingDetailCount = details.length

  return (
    <div className="plan-review-backdrop" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) onCancel() }}>
      <section className="plan-review-modal" role="dialog" aria-modal="true" aria-labelledby="plan-review-title">
        <div className="plan-review-head">
          <div className="plan-review-icon"><Users size={19} /></div>
          <div>
            <p className="section-kicker">{pt ? 'REVER ANTES DE GUARDAR' : 'REVIEW BEFORE SAVING'}</p>
            <h2 id="plan-review-title">{pt ? 'Confirme o plano antes de guardar' : 'Review the plan before saving'}</h2>
            <p>{pt ? 'A IA criou o plano. Confirme clientes e complete apenas o que realmente estiver em falta.' : 'AI created the plan. Confirm clients and complete only what is actually missing.'}</p>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} aria-label={pt ? 'Fechar' : 'Close'}><X size={18} /></button>
        </div>

        {items.length > 0 && (
          <section className="plan-review-section">
            <div className="plan-review-section-head">
              <Users size={16} />
              <div>
                <strong>{pt ? 'Clientes' : 'Clients'}</strong>
                <span>{pt ? 'Verifique nomes novos ou clientes que já existem.' : 'Check new names and clients that already exist.'}</span>
              </div>
            </div>
            <div className="plan-review-list">
              {items.map(item => {
                const decision = decisions[item.key]
                const hasExisting = Boolean(item.existingName)
                const useExisting = decision?.mode === 'existing'
                return (
                  <div className="plan-review-item" key={item.key}>
                    <div className="plan-review-item-head">
                      <div>
                        <strong>{item.label}</strong>
                        {hasExisting
                          ? <span className="plan-review-warning"><AlertTriangle size={14} /> {pt ? 'Já existe “' + item.existingName + '”.' : '“' + item.existingName + '” already exists.'}</span>
                          : <span>{pt ? 'Novo cliente — será adicionado.' : 'New client — will be added.'}</span>}
                      </div>
                    </div>
                    {hasExisting ? (
                      <div className="plan-review-choice">
                        <button type="button" className={useExisting ? 'plan-review-choice-button active' : 'plan-review-choice-button'} onClick={() => update(item.key, { mode: 'existing', name: item.existingName! })}>
                          <Check size={15} /> {pt ? 'Usar cliente existente' : 'Use existing client'}
                        </button>
                        <button type="button" className={!useExisting ? 'plan-review-choice-button active' : 'plan-review-choice-button'} onClick={() => update(item.key, { mode: 'new', name: decision?.name === item.existingName ? '' : decision?.name ?? '' })}>
                          {pt ? 'Outro nome' : 'Use another name'}
                        </button>
                      </div>
                    ) : null}
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

        {missingDetailCount > 0 && (
          <section className="plan-review-section">
            <div className="plan-review-section-head">
              <Clock3 size={16} />
              <div>
                <strong>{pt ? 'Completar detalhes (opcional)' : 'Complete details (optional)'}</strong>
                <span>{pt ? 'Só aparecem informações que a IA não conseguiu obter. Você pode pular qualquer uma.' : 'Only information AI could not get is shown. You can skip any field.'}</span>
              </div>
            </div>

            <div className="plan-review-details-list">
              {details.map(detail => {
                const decision = detailDecisions[detail.key] ?? {}
                const title = detail.title
                return (
                  <div className="plan-review-detail-card" key={detail.key}>
                    <strong className="plan-review-detail-title">{title}</strong>

                    {detail.clientMissing && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span>{pt ? 'Cliente' : 'Client'}</span>
                          <button type="button" className="plan-review-skip" onClick={() => clearDetail(detail.key, 'client')}>{pt ? 'Pular' : 'Skip'}</button>
                        </div>
                        <input
                          value={decision.client ?? ''}
                          onChange={event => updateDetail(detail.key, { client: event.target.value })}
                          placeholder={pt ? 'Nome do cliente' : 'Client name'}
                          autoComplete="off"
                        />
                      </div>
                    )}

                    {detail.dueDateMissing && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span>{pt ? 'Prazo' : 'Deadline'}</span>
                          <button type="button" className="plan-review-skip" onClick={() => clearDetail(detail.key, 'dueDate')}>{pt ? 'Pular' : 'Skip'}</button>
                        </div>
                        <input
                          type="date"
                          min={today}
                          value={decision.dueDate ?? ''}
                          onChange={event => updateDetail(detail.key, { dueDate: event.target.value })}
                        />
                      </div>
                    )}

                    {detail.priorityMissing && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span>{pt ? 'Prioridade' : 'Priority'}</span>
                          <button type="button" className="plan-review-skip" onClick={() => clearDetail(detail.key, 'priority')}>{pt ? 'Pular' : 'Skip'}</button>
                        </div>
                        <div className="plan-review-priority">
                          {(['low', 'medium', 'high'] as Priority[]).map(priority => (
                            <button
                              key={priority}
                              type="button"
                              className={decision.priority === priority ? 'plan-review-choice-button active' : 'plan-review-choice-button'}
                              onClick={() => updateDetail(detail.key, { priority })}
                            >
                              {pt ? ({ low: 'Baixa', medium: 'Média', high: 'Alta' }[priority]) : ({ low: 'Low', medium: 'Medium', high: 'High' }[priority])}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {detail.kind === 'payment' && detail.amountMissing && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span>{pt ? 'Valor' : 'Amount'}</span>
                          <button type="button" className="plan-review-skip" onClick={() => clearDetail(detail.key, 'amount')}>{pt ? 'Pular' : 'Skip'}</button>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={decision.amount ?? ''}
                          onChange={event => updateDetail(detail.key, { amount: event.target.value === '' ? undefined : Number(event.target.value) })}
                          placeholder={pt ? 'Ex.: 200000' : 'e.g. 200000'}
                          inputMode="decimal"
                        />
                      </div>
                    )}

                    {detail.kind === 'payment' && detail.currencyMissing && (
                      <div className="plan-review-field">
                        <div className="plan-review-field-head">
                          <span>{pt ? 'Moeda' : 'Currency'}</span>
                          <button type="button" className="plan-review-skip" onClick={() => clearDetail(detail.key, 'currency')}>{pt ? 'Pular' : 'Skip'}</button>
                        </div>
                        <select
                          value={decision.currency ?? ''}
                          onChange={event => updateDetail(detail.key, { currency: event.target.value as PaymentCurrency || undefined })}
                        >
                          <option value="">{pt ? 'Escolher moeda' : 'Choose currency'}</option>
                          <option value="AOA">AOA</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="BRL">BRL</option>
                          <option value="GBP">GBP</option>
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
            {pt ? 'Adicionar tudo' : 'Add everything'} <ChevronRight size={17} />
          </button>
        </div>
      </section>
    </div>
  )
}
