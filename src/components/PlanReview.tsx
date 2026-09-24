import { useMemo, useState } from 'react'
import { AlertTriangle, Check, ChevronRight, Users, X } from 'lucide-react'

type Language = 'en' | 'pt'

type ReviewItem = {
  originalName: string
  existingName?: string
}

type Decision = {
  mode: 'existing' | 'new'
  name: string
}

export function PlanReview({ language, items, onConfirm, onCancel }: {
  language: Language
  items: ReviewItem[]
  onConfirm: (decisions: Record<string, string>) => void
  onCancel: () => void
}) {
  const pt = language === 'pt'
  const initial = useMemo(() => Object.fromEntries(items.map(item => [
    item.originalName,
    {
      mode: item.existingName ? 'existing' : 'new',
      name: item.existingName ?? item.originalName,
    } satisfies Decision,
  ])), [items])
  const [decisions, setDecisions] = useState<Record<string, Decision>>(initial)
  const [error, setError] = useState('')

  const update = (originalName: string, patch: Partial<Decision>) => {
    setDecisions(current => ({
      ...current,
      [originalName]: { ...current[originalName], ...patch },
    }))
    setError('')
  }

  const submit = () => {
    const result: Record<string, string> = {}
    for (const item of items) {
      const decision = decisions[item.originalName]
      const name = decision?.name.trim() ?? ''
      if (!name) {
        setError(pt ? 'Cada cliente precisa de um nome ou você pode voltar e corrigir o plano.' : 'Each client needs a name, or you can go back and correct the plan.')
        return
      }
      if (item.existingName && decision.mode === 'new' && name.toLocaleLowerCase() === item.existingName.toLocaleLowerCase()) {
        setError(pt ? 'Escolha outro nome ou use o cliente existente.' : 'Choose another name or use the existing client.')
        return
      }
      result[item.originalName] = name
    }
    onConfirm(result)
  }

  return (
    <div className="plan-review-backdrop" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) onCancel() }}>
      <section className="plan-review-modal" role="dialog" aria-modal="true" aria-labelledby="plan-review-title">
        <div className="plan-review-head">
          <div className="plan-review-icon"><Users size={19} /></div>
          <div>
            <p className="section-kicker">{pt ? 'REVER ANTES DE GUARDAR' : 'REVIEW BEFORE SAVING'}</p>
            <h2 id="plan-review-title">{pt ? 'Confirme os clientes do plano' : 'Confirm the clients in this plan'}</h2>
            <p>{pt ? 'A IA criou o plano. Agora o LifeDue verifica clientes antes de adicionar tudo.' : 'AI created the plan. LifeDue checks clients before adding everything.'}</p>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} aria-label={pt ? 'Fechar' : 'Close'}><X size={18} /></button>
        </div>

        <div className="plan-review-list">
          {items.map(item => {
            const decision = decisions[item.originalName]
            const hasExisting = Boolean(item.existingName)
            const useExisting = decision?.mode === 'existing'
            return (
              <div className="plan-review-item" key={item.originalName}>
                <div className="plan-review-item-head">
                  <div>
                    <strong>{item.originalName}</strong>
                    {hasExisting
                      ? <span className="plan-review-warning"><AlertTriangle size={14} /> {pt ? 'Já existe “' + item.existingName + '”.' : '“' + item.existingName + '” already exists.'}</span>
                      : <span>{pt ? 'Novo cliente — será adicionado.' : 'New client — will be added.'}</span>}
                  </div>
                </div>
                {hasExisting ? (
                  <div className="plan-review-choice">
                    <button type="button" className={useExisting ? 'plan-review-choice-button active' : 'plan-review-choice-button'} onClick={() => update(item.originalName, { mode: 'existing', name: item.existingName! })}>
                      <Check size={15} /> {pt ? 'Usar cliente existente' : 'Use existing client'}
                    </button>
                    <button type="button" className={!useExisting ? 'plan-review-choice-button active' : 'plan-review-choice-button'} onClick={() => update(item.originalName, { mode: 'new', name: decision?.name === item.existingName ? '' : decision?.name ?? '' })}>
                      {pt ? 'Outro nome' : 'Use another name'}
                    </button>
                  </div>
                ) : null}
                {(!hasExisting || !useExisting) && (
                  <input
                    value={decision?.name ?? ''}
                    onChange={event => update(item.originalName, { mode: 'new', name: event.target.value })}
                    placeholder={pt ? 'Nome do cliente' : 'Client name'}
                    autoComplete="off"
                  />
                )}
              </div>
            )
          })}
        </div>

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
