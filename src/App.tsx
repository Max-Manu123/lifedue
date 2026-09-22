import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  LayoutDashboard,
  ListTodo,
  Menu,
  Plus,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import type { Client, Payment, Priority, QuickAddItem, Task } from './types'
import type { User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { fetchClients, fetchPayments, fetchTasks, removeLegacyDemoTasks, createTasks, createPayment, updateTaskStatus, updatePaymentStatus } from './lib/tasks'
import { AuthModal } from './components/AuthModal'

type View = 'home' | 'quick-add' | 'tasks' | 'clients' | 'payments' | 'planner'
type Language='en'|'pt'
const trMap={en:{today:'Today',tasks:'Tasks',clients:'Clients',payments:'Payments',planner:'AI Planner',addTask:'Add task',freePlan:'Free plan',workspace:'CLIENT WORKSPACE',openApp:'Open app',builtFor:'Built for client work',heroText:'Turn your client work into a simple daily plan. Add tasks in plain language and see what needs your attention today.',tryFree:'Try it free',noCard:'No credit card required',quickAdd:'Quick Add',todayFirst:'Today first',paymentsText:'Keep pending client money visible.',quickAddText:'Describe several client tasks at once.',todayText:'See overdue and due-now work immediately.',pending:'pending',aiQuick:'AI QUICK ADD',quickQuestion:'What do you need to get done?',createPlan:'Create plan',plain:'Plain language · no setup',yourPlan:'YOUR PLAN',addAll:'Add all',overdue:'OVERDUE',upNext:'Up next',organize:'Organize my plan',nothing:'Nothing due today',breathing:'Enjoy the breathing room or add a task.',workQueue:'WORK QUEUE',everything:'Everything you need to deliver.',completed:'Completed',all:'All',open:'Open',clientsIntro:'Keep the people behind the work visible.',moneyDue:'MONEY DUE',unpaid:'Don’t let finished work stay unpaid.',clear:'All payments are clear',noPending:'No pending client payments.',paid:'Paid',markPaid:'Mark paid',aiPlanner:'AI PLANNER',calmer:'Turn your backlog into a calmer day.',plannerDesc:'LifeDue groups open work into a simple plan instead of making you manage a giant list.',openItems:'open items competing for attention.',generateOrder:'Generate a suggested order for your next few days.',generatePlan:'Generate plan',addAllToday:'Add all to Today',planEmpty:'Your plan will appear here.',newTask:'NEW TASK',task:'Task',client:'Client',dueDate:'Due date',priority:'Priority',cancel:'Cancel',low:'Low',medium:'Medium',high:'High',finishHomepage:'e.g. Finish homepage',john:'e.g. John',complete:'Complete task',tomorrow:'Tomorrow',due:'Due',overdueDue:'Overdue · due',menu:'Open menu',foundItems:'LifeDue found {n} items.',todayFocus:'Here is what needs your attention.',tasksHeadline:'Everything you need to deliver.',tasksDescription:'Keep work visible, prioritize what matters, and close tasks as you finish them.',clientsHeadline:'A clear view of your client work.',clientsDescription:'See who you work with, how much work is open, and what is still pending.',paymentsHeadline:'Keep every payment moving.',paymentsDescription:'Track money due by client and quickly mark payments as settled.'},pt:{today:'Hoje',tasks:'Tarefas',clients:'Clientes',payments:'Pagamentos',planner:'Planejador IA',addTask:'Adicionar tarefa',freePlan:'Plano grátis',workspace:'ÁREA DE CLIENTES',openApp:'Abrir app',builtFor:'Feito para trabalho com clientes',heroText:'Transforme seu trabalho com clientes em um plano diário simples. Adicione tarefas em linguagem natural e veja o que precisa da sua atenção hoje.',tryFree:'Experimentar grátis',noCard:'Sem cartão de crédito',quickAdd:'Adicionar rápido',todayFirst:'Hoje primeiro',paymentsText:'Mantenha os pagamentos pendentes visíveis.',quickAddText:'Descreva várias tarefas de clientes de uma vez.',todayText:'Veja imediatamente o que está atrasado e vence hoje.',pending:'pendente',aiQuick:'ADICIONAR COM IA',quickQuestion:'O que você precisa fazer?',createPlan:'Criar plano',plain:'Linguagem natural · sem configuração',yourPlan:'SEU PLANO',addAll:'Adicionar tudo',overdue:'ATRASADO',upNext:'A seguir',organize:'Organizar meu plano',nothing:'Nada vence hoje',breathing:'Aproveite o tempo livre ou adicione uma tarefa.',workQueue:'FILA DE TRABALHO',everything:'Tudo o que você precisa entregar.',completed:'Concluídas',all:'Todas',open:'Abertas',clientsIntro:'Mantenha visíveis as pessoas por trás do trabalho.',moneyDue:'DINHEIRO A RECEBER',unpaid:'Não deixe trabalho concluído ficar sem pagamento.',clear:'Todos os pagamentos estão em dia',noPending:'Não há pagamentos de clientes pendentes.',paid:'Pago',markPaid:'Marcar como pago',aiPlanner:'PLANEJADOR IA',calmer:'Transforme sua lista em um dia mais tranquilo.',plannerDesc:'O LifeDue agrupa o trabalho aberto em um plano simples em vez de fazer você gerenciar uma lista enorme.',openItems:'itens abertos disputando sua atenção.',generateOrder:'Gere uma ordem sugerida para os próximos dias.',generatePlan:'Gerar plano',addAllToday:'Adicionar tudo para hoje',planEmpty:'Seu plano aparecerá aqui.',newTask:'NOVA TAREFA',task:'Tarefa',client:'Cliente',dueDate:'Data de entrega',priority:'Prioridade',cancel:'Cancelar',low:'Baixa',medium:'Média',high:'Alta',finishHomepage:'ex.: Finalizar página inicial',john:'ex.: João',complete:'Concluir tarefa',tomorrow:'Amanhã',due:'Vence',overdueDue:'Atrasado · vence',menu:'Abrir menu',foundItems:'O LifeDue encontrou {n} itens.',todayFocus:'Veja o que precisa da sua atenção.',tasksHeadline:'Tudo o que você precisa entregar.',tasksDescription:'Mantenha o trabalho visível, priorize o que importa e conclua tarefas à medida que avança.',clientsHeadline:'Uma visão clara do seu trabalho com clientes.',clientsDescription:'Veja com quem trabalha, quanto trabalho está aberto e o que ainda está pendente.',paymentsHeadline:'Mantenha cada pagamento em andamento.',paymentsDescription:'Acompanhe o dinheiro a receber por cliente e marque pagamentos como concluídos rapidamente.'}}
let currentLanguage:Language='en'
const tr=(key:keyof typeof trMap.en)=>trMap[currentLanguage][key]

const today = new Date()
today.setHours(0, 0, 0, 0)

const iso = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const addDays = (days: number) => {
  const date = new Date(today)
  date.setDate(date.getDate() + days)
  return iso(date)
}

const taskKey = (task: Pick<Task, 'title' | 'client' | 'dueDate'>) =>
  `${task.title.trim().toLowerCase()}|${task.client.trim().toLowerCase()}|${task.dueDate}`

const uniqueTasks = (items: Task[]) => {
  const seen = new Set<string>()
  return items.filter(task => {
    const key = taskKey(task)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const paymentKey = (payment: Pick<Payment, 'client' | 'amount' | 'dueDate'>) =>
  `${payment.client.trim().toLowerCase()}|${payment.amount}|${payment.dueDate}`

const uniquePayments = (items: Payment[]) => {
  const seen = new Set<string>()
  return items.filter(payment => {
    const key = paymentKey(payment)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function localizeAiTitle(title: string, kind: QuickAddItem['kind']) {
  if (currentLanguage !== 'pt') return title
  const normalized = title.trim().toLowerCase()
  if (kind === 'payment' || /follow up payment|payment follow-up|collect payment|receive payment/.test(normalized)) return 'Cobrar pagamento'
  if (/send proposal|proposal/.test(normalized)) return 'Enviar proposta'
  if (/deliver website|deliver site|website/.test(normalized)) return 'Entregar site'
  if (/send invoice|invoice/.test(normalized)) return 'Enviar fatura'
  return title
}

function formatMoney(amount: number, currency: string, locale = currentLanguage === 'pt' ? 'pt-PT' : 'en-US') {
  const supported = ['USD', 'EUR', 'BRL', 'AOA', 'GBP'].includes(currency)
  if (supported) return amount.toLocaleString(locale, { style: 'currency', currency })
  return String(amount.toLocaleString(locale)) + ' ' + currency
}

function pendingMoneyLabel(payments: Payment[]) {
  const pending = payments.filter(payment => payment.status === 'pending')
  if (!pending.length) return formatMoney(0, 'USD')
  const currencies = [...new Set(pending.map(payment => payment.currency))]
  if (currencies.length === 1) return formatMoney(pending.reduce((sum, payment) => sum + payment.amount, 0), currencies[0])
  return currencies.map(currency => formatMoney(pending.filter(payment => payment.currency === currency).reduce((sum, payment) => sum + payment.amount, 0), currency)).join(' · ')
}

function App() {
  const [language,setLanguage]=useState<Language>(()=>(localStorage.getItem('lifedue-language') as Language)||'en')
  currentLanguage=language
  useEffect(()=>localStorage.setItem('lifedue-language',language),[language])
  const [view, setView] = useState<View>('home')
  const [tasks, setTasks] = useState<Task[]>(() => uniqueTasks(load('lifedue-tasks', [])))
  const [clients, setClients] = useState<Client[]>(() => load('lifedue-clients', []))
  const [payments, setPayments] = useState<Payment[]>(() => uniquePayments(load('lifedue-payments', [])))
  const [quickText, setQuickText] = useState('')
  const [plan, setPlan] = useState<Task[]>([])
  const [planPayments, setPlanPayments] = useState<QuickAddItem[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const quickAddRequestId = useRef(0)
  const [showAdd, setShowAdd] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState('')
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientsError, setClientsError] = useState('')
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentsError, setPaymentsError] = useState('')
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setAuthOpen(false)
        setView('quick-add')
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user || !supabase) return
    let cancelled = false
    setClientsLoading(true)
    setClientsError('')

    fetchClients(user)
      .then(remoteClients => {
        if (!cancelled) setClients(remoteClients)
      })
      .catch(error => {
        console.error('LifeDue client load failed:', error)
        if (!cancelled) setClientsError(currentLanguage === 'pt' ? 'Não foi possível carregar seus clientes.' : 'Could not load your clients.')
      })
      .finally(() => {
        if (!cancelled) setClientsLoading(false)
      })

    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!user || !supabase) return
    let cancelled = false
    setPaymentsLoading(true)
    setPaymentsError('')

    fetchPayments(user)
      .then(remotePayments => {
        if (!cancelled) setPayments(remotePayments)
      })
      .catch(error => {
        console.error('LifeDue payment load failed:', error)
        if (!cancelled) setPaymentsError(currentLanguage === 'pt' ? 'Não foi possível carregar seus pagamentos.' : 'Could not load your payments.')
      })
      .finally(() => {
        if (!cancelled) setPaymentsLoading(false)
      })

    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!user || !supabase) return
    let cancelled = false
    setTasksLoading(true)
    setTasksError('')

    removeLegacyDemoTasks(user)
      .then(() => fetchTasks(user))
      .then(remoteTasks => {
        if (!cancelled) setTasks(remoteTasks)
      })
      .catch(error => {
        console.error('LifeDue task load failed:', error)
        if (!cancelled) setTasksError(currentLanguage === 'pt' ? 'Não foi possível carregar suas tarefas.' : 'Could not load your tasks.')
      })
      .finally(() => {
        if (!cancelled) setTasksLoading(false)
      })

    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!user) localStorage.setItem('lifedue-tasks', JSON.stringify(tasks))
  }, [tasks, user])
  useEffect(() => localStorage.setItem('lifedue-clients', JSON.stringify(clients)), [clients])
  useEffect(() => localStorage.setItem('lifedue-payments', JSON.stringify(payments)), [payments])

  const openTasks = tasks.filter(t => t.status === 'open')
  const overdue = openTasks.filter(t => t.dueDate < iso(today))
  const todayTasks = openTasks.filter(t => t.dueDate === iso(today))
  const pendingPayments = payments.filter(p => p.status === 'pending')
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0)

  const navigate = (next: View) => {
    setView(next)
    setMenuOpen(false)
  }

  const handleSignOut = async () => {
    if (!supabase) {
      setUser(null)
      setAuthOpen(false)
      setMenuOpen(false)
      setPlan([])
      setView('home')
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('LifeDue sign-out failed:', error)
      return
    }

    setUser(null)
    setAuthOpen(false)
    setMenuOpen(false)
    setPlan([])
    setView('home')
  }

  const toggleTask = async (id: string) => {
    if (updatingTaskId) return
    const currentTask = tasks.find(task => task.id === id)
    if (!currentTask) return
    const nextStatus = currentTask.status === 'open' ? 'completed' : 'open'
    setUpdatingTaskId(id)
    setTasksError('')
    setTasks(current => current.map(task => task.id === id ? { ...task, status: nextStatus } : task))

    if (user && supabase) {
      try {
        await updateTaskStatus(user, id, nextStatus)
        const refreshed = await fetchTasks(user)
        setTasks(refreshed)
      } catch (error) {
        console.error('LifeDue task update failed:', error)
        setTasks(current => current.map(task => task.id === id ? currentTask : task))
        setTasksError(currentLanguage === 'pt'
          ? 'Não foi possível guardar esta tarefa. Tente novamente.'
          : 'Could not save this task. Please try again.')
      } finally {
        setUpdatingTaskId(null)
      }
      return
    }

    setUpdatingTaskId(null)
  }

  const createPlan = async () => {
    const input = quickText.trim()
    if (!input) {
      setPlan([])
      setPlanPayments([])
      setTasksError(currentLanguage === 'pt' ? 'Escreva pelo menos uma tarefa ou pagamento para criar um plano.' : 'Describe at least one task or payment to create a plan.')
      return
    }
    if (!user) {
      setTasksError(currentLanguage === 'pt' ? 'Entre na sua conta para usar a IA. O texto fica guardado nesta tela.' : 'Sign in to use AI. Your text will stay in this screen.')
      setAuthMode('login')
      setAuthOpen(true)
      return
    }
    const requestId = ++quickAddRequestId.current
    setPlan([])
    setPlanPayments([])
    setAiLoading(true)
    setTasksError('')
    try {
      if (supabase && user) {
        const { data, error } = await supabase.functions.invoke('quick-add', { body: { text: input, today: iso(today), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, language } })
        if (error) {
          let detail = ''
          try {
            const response = (error as FunctionsHttpError & { context?: Response }).context
            if (response) {
              const body = await response.clone().json()
              detail = typeof body?.detail === 'string' ? body.detail : typeof body?.message === 'string' ? body.message : ''
            }
          } catch {}
          console.error('LifeDue AI Quick Add failed:', error, detail)
          throw new Error(detail || error.message)
        }
        const items = (data?.items ?? []) as QuickAddItem[]
        if (items.length > 0 && requestId === quickAddRequestId.current) {
          const clientNames = Array.from(input.matchAll(/(?:do|da|de|from|for|para o|para a)\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][\p{L}'-]*)/gu)).map(match => match[1])
          const normalizedName = (value: string) => value.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase()
          const exactClient = (value: string) => {
            const match = clientNames.find(name => normalizedName(name) === normalizedName(value))
            if (match) return match
            if (normalizedName(value) === 'john') {
              const joao = clientNames.find(name => normalizedName(name) === 'joao')
              if (joao) return joao
            }
            return value
          }
          const normalizedItems = items.map(item => ({ ...item, client: exactClient(item.client), title: currentLanguage === 'pt' ? localizeAiTitle(item.title, item.kind) : item.title }))
          setPlan(normalizedItems.map(item => ({ id: crypto.randomUUID(), title: item.kind === 'payment' ? (currentLanguage === 'pt' ? 'Cobrar pagamento' : 'Follow up payment') : item.title, client: item.client, dueDate: item.dueDate, priority: item.priority, status: 'open' })))
          setPlanPayments(normalizedItems.filter(item => item.kind === 'payment'))
          setView('quick-add')
          return
        }
      }
    } catch (error) {
      if (requestId !== quickAddRequestId.current) return
      console.error('LifeDue AI Quick Add failed:', error)
      setTasksError(currentLanguage === 'pt' ? 'A IA não está disponível agora. Tente novamente.' : 'AI Quick Add is unavailable right now. Please try again.')
    } finally { setAiLoading(false) }
  }

  const addPlan = async () => {
    if (!plan.length) return
    setTasksError('')
    try {
      const paymentMatch = quickText.match(/\$\s*(\d+(?:\.\d{1,2})?)/i)
      const paymentTask = plan.find(task => /payment|pagamento|collect|cobrar|receber/i.test(task.title))
      const paymentAmount = paymentMatch ? Number(paymentMatch[1]) : 0

      const taskPlan = plan.filter(task => !planPayments.some(payment => payment.client.trim().toLowerCase() === task.client.trim().toLowerCase() && payment.dueDate === task.dueDate && /payment|pagamento|collect|cobrar|receber/i.test(task.title)))

      if (user && supabase) {
        const existingTaskKeys = new Set(tasks.map(taskKey))
        const newTaskPlan = taskPlan.filter(task => !existingTaskKeys.has(taskKey(task)))
        const created = newTaskPlan.length ? await createTasks(user, newTaskPlan) : []
        setTasks(current => uniqueTasks([...created, ...current]))
        if (planPayments.length > 0) {
          const existingPaymentKeys = new Set(payments.map(paymentKey))
          const newPayments = planPayments.filter(item => !existingPaymentKeys.has(paymentKey({ client: item.client, amount: item.amount ?? 0, dueDate: item.dueDate })))
          const createdPayments = await Promise.all(newPayments.map(item => createPayment(user, { client: item.client, amount: item.amount ?? 0, currency: item.currency ?? 'USD', dueDate: item.dueDate })))
          setPayments(current => uniquePayments([...createdPayments, ...current]))
        } else if (paymentTask && paymentAmount > 0) {
          const createdPayment = await createPayment(user, {
            client: paymentTask.client,
            amount: paymentAmount,
            currency: 'USD',
            dueDate: paymentTask.dueDate,
          })
          setPayments(current => [createdPayment, ...current])
        }
      } else {
        const clientNames = new Set(clients.map(c => c.name.toLowerCase()))
        const newClients = taskPlan
          .filter(task => !clientNames.has(task.client.toLowerCase()))
          .map(task => ({ id: crypto.randomUUID(), name: task.client }))
        if (newClients.length) setClients(current => [...current, ...newClients])
        setTasks(current => uniqueTasks([...taskPlan, ...current]))
        if (planPayments.length > 0) {
          const existingPaymentKeys = new Set(payments.map(paymentKey))
          const newPayments = planPayments.filter(item => !existingPaymentKeys.has(paymentKey({ client: item.client, amount: item.amount ?? 0, dueDate: item.dueDate })))
          setPayments(current => uniquePayments([...newPayments.map(item => ({ id: crypto.randomUUID(), client: item.client, amount: item.amount ?? 0, currency: item.currency ?? 'USD', dueDate: item.dueDate, status: 'pending' as const })), ...current]))
        } else if (paymentTask && paymentAmount > 0) {
          setPayments(current => [{
            id: crypto.randomUUID(),
            client: paymentTask.client,
            amount: paymentAmount,
            currency: 'USD',
            dueDate: paymentTask.dueDate,
            status: 'pending',
          }, ...current])
        }
      }
      setPlan([])
      setPlanPayments([])
      setQuickText('')
      setView('quick-add')
    } catch (error) {
      console.error('LifeDue plan save failed:', error)
      setTasksError(currentLanguage === 'pt' ? 'Não foi possível salvar o plano.' : 'Could not save the plan.')
    }
  }

  const addTask = async (task: Omit<Task, 'id' | 'status'>) => {
    setTasksError('')
    try {
      if (user && supabase) {
        const created = await createTasks(user, [{ ...task, status: 'open' }])
        setTasks(current => [...created, ...current])
      } else {
        const next = { ...task, id: crypto.randomUUID(), status: 'open' as const }
        setTasks(current => [next, ...current])
        if (!clients.some(c => c.name.toLowerCase() === task.client.toLowerCase())) {
          setClients(current => [...current, { id: crypto.randomUUID(), name: task.client }])
        }
      }
      setShowAdd(false)
    } catch (error) {
      console.error('LifeDue task creation failed:', error)
      setTasksError(currentLanguage === 'pt' ? 'Não foi possível salvar a tarefa.' : 'Could not save the task.')
    }
  }

  const markPaid = async (id: string) => {
    const currentPayment = payments.find(payment => payment.id === id)
    if (!currentPayment || currentPayment.status === 'paid') return
    setPayments(current => current.map(payment => payment.id === id ? { ...payment, status: 'paid' } : payment))
    if (user && supabase) {
      try {
        await updatePaymentStatus(user, id, 'paid')
      } catch (error) {
        console.error('LifeDue payment update failed:', error)
        setPayments(current => current.map(payment => payment.id === id ? currentPayment : payment))
        setPaymentsError(currentLanguage === 'pt' ? 'Não foi possível atualizar o pagamento.' : 'Could not update the payment.')
      }
    }
  }
  const addPayment = async (payment: Omit<Payment, 'id' | 'status'>) => {
    if (user && supabase) {
      try {
        const created = await createPayment(user, payment)
        setPayments(current => [created, ...current])
        setShowAddPayment(false)
      } catch (error) {
        console.error('LifeDue payment creation failed:', error)
        setPaymentsError(currentLanguage === 'pt' ? 'Não foi possível adicionar o pagamento.' : 'Could not add the payment.')
      }
    } else {
      setPayments(current => [{ ...payment, id: crypto.randomUUID(), status: 'pending' }, ...current])
      setShowAddPayment(false)
    }
  }

  return (
    <div className="app-shell">
      {view === 'home' ? (
        <Landing onStart={() => navigate('quick-add')} onAuth={() => { setAuthMode('login'); setAuthOpen(true) }} language={language} setLanguage={setLanguage} />
      ) : (
        <div className="workspace">
          <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
            <div className="brand" onClick={() => navigate('home')}>
              <span className="brand-mark">L</span>
              <span>LifeDue</span>
            </div>
            <nav>
              <NavItem icon={<LayoutDashboard size={18} />} label={tr('today')} active={view === 'quick-add'} onClick={() => navigate('quick-add')} />
              <NavItem icon={<ListTodo size={18} />} label={tr('tasks')} active={view === 'tasks'} onClick={() => navigate('tasks')} />
              <NavItem icon={<Users size={18} />} label={tr('clients')} active={view === 'clients'} onClick={() => navigate('clients')} />
              <NavItem icon={<CreditCard size={18} />} label={tr('payments')} active={view === 'payments'} onClick={() => navigate('payments')} />
              <NavItem icon={<Sparkles size={18} />} label={tr('planner')} active={view === 'planner'} onClick={() => navigate('planner')} />
            </nav>
            <div className="sidebar-bottom">
              <button className="sidebar-add" onClick={() => setShowAdd(true)}><Plus size={17} /> Add task</button>
              <div className="free-badge">{tr('freePlan')}</div>
            </div>
          </aside>

          <main className="main-content">
            <header className="topbar">
              <button className="icon-button mobile-only" onClick={() => setMenuOpen(!menuOpen)} aria-label={tr("menu")}><Menu size={21} /></button>
              <div>
                <div className="eyebrow">{tr('workspace')}</div>
                <h1>{view === 'quick-add' ? tr('today') : view === 'tasks' ? tr('tasks') : view === 'clients' ? tr('clients') : view === 'payments' ? tr('payments') : tr('planner')}</h1>
              </div>
              <div className="topbar-actions">{user ? <button className="account-button" title={user.email ?? ''} onClick={handleSignOut}>{currentLanguage==='pt' ? 'Sair' : 'Sign out'}</button> : <button className="ghost-button" onClick={() => { setAuthMode('login'); setAuthOpen(true) }}>{currentLanguage==='pt' ? 'Entrar' : 'Sign in'}</button>}<div className="language-switcher desktop-language" aria-label="Change language"><button className={language==='en'?'active':''} onClick={()=>setLanguage('en')}>EN</button><button className={language==='pt'?'active':''} onClick={()=>setLanguage('pt')}>PT</button></div><button className="primary-button compact" onClick={() => setShowAdd(true)}><Plus size={17} /> {tr('addTask')}</button></div>
            </header>

            <div key={view} className={"route-view route-" + view}>
            {tasksError && <div className="error-banner" role="alert">{tasksError}</div>}
            {clientsError && <div className="error-banner" role="alert">{clientsError}</div>}
            {paymentsError && <div className="error-banner" role="alert">{paymentsError}</div>}
            {tasksLoading && <div className="loading-banner">{currentLanguage === 'pt' ? 'A carregar tarefas…' : 'Loading tasks…'}</div>}
            {clientsLoading && <div className="loading-banner">{currentLanguage === 'pt' ? 'A carregar clientes…' : 'Loading clients…'}</div>}
            {paymentsLoading && <div className="loading-banner">{currentLanguage === 'pt' ? 'A carregar pagamentos…' : 'Loading payments…'}</div>}
            {view === 'quick-add' && (
              <TodayView
                tasks={tasks}
                overdue={overdue}
                todayTasks={todayTasks}
                pendingAmount={pendingAmount}
                pendingPayments={payments}
                quickText={quickText}
                onQuickTextChange={setQuickText}
                onToggle={toggleTask}
                plan={plan}
                onCreatePlan={createPlan}
                onAddPlan={addPlan}
                onPlanner={() => navigate('planner')}
                busyTaskId={updatingTaskId}
          aiLoading={aiLoading}
              />
            )}
            {view === 'tasks' && <TasksView tasks={tasks} onToggle={toggleTask} onAdd={() => setShowAdd(true)} busyTaskId={updatingTaskId} />}
            {view === 'clients' && <ClientsView clients={clients} tasks={tasks} payments={payments} />}
            {view === 'payments' && <PaymentsView payments={payments} onMarkPaid={markPaid} onAdd={() => setShowAddPayment(true)} />}
            {view === 'planner' && (
              <PlannerView
                plan={plan}
                onGenerate={async () => {
                  const candidates = [...openTasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5)
                  if (!candidates.length || !user || !supabase) {
                    setPlan(candidates)
                    setPlanPayments([])
                    setView('planner')
                    return
                  }

                  const requestId = ++quickAddRequestId.current
                  setAiLoading(true)
                  setTasksError('')
                  setPlan([])
                  try {
                    const { data, error } = await supabase.functions.invoke('quick-add', {
                      body: {
                        mode: 'plan',
                        today: iso(today),
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        language,
                        tasks: candidates,
                      },
                    })
                    if (error) throw error
                    const orderedIds = Array.isArray(data?.orderedIds) ? data.orderedIds as string[] : []
                    const byId = new Map(candidates.map(task => [task.id, task]))
                    const ordered = orderedIds.map(id => byId.get(id)).filter((task): task is Task => Boolean(task))
                    if (requestId === quickAddRequestId.current && ordered.length === candidates.length) {
                      setPlan(ordered)
                      setPlanPayments([])
                      setView('planner')
                      return
                    }
                    throw new Error('Planner returned an invalid order.')
                  } catch (error) {
                    if (requestId !== quickAddRequestId.current) return
                    console.error('LifeDue AI Planner failed:', error)
                    setTasksError(currentLanguage === 'pt'
                      ? 'O planejador IA não está disponível agora. Tente novamente.'
                      : 'AI Planner is unavailable right now. Please try again.')
                    setPlan([])
                    setPlanPayments([])
                    setView('planner')
                  } finally {
                    setAiLoading(false)
                  }
                }}
                onAddPlan={addPlan}
              />
            )}
            </div>
          </main>

          <div className="mobile-nav">
            <MobileNav icon={<LayoutDashboard size={19} />} label={tr('today')} active={view === 'quick-add'} onClick={() => navigate('quick-add')} />
            <MobileNav icon={<ListTodo size={19} />} label={tr('tasks')} active={view === 'tasks'} onClick={() => navigate('tasks')} />
            <MobileNav icon={<Users size={19} />} label={tr('clients')} active={view === 'clients'} onClick={() => navigate('clients')} />
            <MobileNav icon={<CreditCard size={19} />} label={tr('payments')} active={view === 'payments'} onClick={() => navigate('payments')} />
          </div>
        </div>
      )}

      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onAdd={addTask} />}
      {showAddPayment && <AddPaymentModal onClose={() => setShowAddPayment(false)} onAdd={addPayment} />}
      {authOpen && <AuthModal language={language} initialMode={authMode} onClose={() => setAuthOpen(false)} onAuthenticated={() => { setAuthOpen(false); setView('quick-add') }} />}
    </div>
  )
}

function Landing({ onStart, onAuth, language, setLanguage }: { onStart: () => void; onAuth: () => void; language: Language; setLanguage: (language: Language) => void }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand"><span className="brand-mark">L</span><span>LifeDue</span></div><div className="language-switcher"><button className={language==='en'?'active':''} onClick={()=>setLanguage('en')}>EN</button><button className={language==='pt'?'active':''} onClick={()=>setLanguage('pt')}>PT</button></div>
        <div className="landing-actions"><button className="ghost-button" onClick={onAuth}>{language==='pt' ? 'Entrar' : 'Sign in'}</button><button className="ghost-button" onClick={onStart}>Open app <ArrowRight size={16} /></button></div>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <div className="pill"><Sparkles size={15} /> Built for client work</div>
          <h1>{currentLanguage==='pt' ? 'Mantenha todos os prazos de clientes e ' : 'Keep every client deadline and '}<span>{currentLanguage==='pt' ? 'cobranças de pagamentos' : 'payment follow-up'}</span>{currentLanguage==='pt' ? ' sob controle.' : ' under control.'}</h1>
          <p>{tr('heroText')}</p>
          <button className="hero-cta" onClick={onStart}>Try it free <ArrowRight size={18} /></button>
          <div className="microcopy"><Check size={14} /> {tr('noCard')}</div>
        </div>
        <div className="hero-preview">
          <div className="preview-top"><span>LifeDue</span><span className="status-dot">●</span></div>
          <div className="preview-title">{tr('today').toUpperCase()}</div>
          <PreviewTask title="Finish homepage" client="John" urgent />
          <PreviewTask title="Send invoice" client="Maria" />
          <div className="preview-title muted">{tr('upNext').toUpperCase()}</div>
          <PreviewTask title="Follow up payment" client="Pedro" />
          <div className="preview-footer">3 {tr("tasks").toLowerCase()} · $200 {tr("pending")}</div>
        </div>
      </section>
      <section className="feature-row">
        <Feature icon={<Sparkles />} title={tr("quickAdd")} text={tr("quickAddText")} />
        <Feature icon={<Clock3 />} title={tr("todayFirst")} text={tr("todayText")} />
        <Feature icon={<CircleDollarSign />} title={tr("payments")} text={tr("paymentsText")} />
      </section>
    </div>
  )
}

function PreviewTask({ title, client, urgent = false }: { title: string; client: string; urgent?: boolean }) {
  return <div className="preview-task"><span className={urgent ? 'preview-check urgent' : 'preview-check'}></span><div><strong>{title}</strong><small>{client}</small></div></div>
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="feature"><div className="feature-icon">{icon}</div><div><strong>{title}</strong><p>{text}</p></div></div>
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return <button className={active ? 'nav-item active' : 'nav-item'} onClick={onClick}>{icon}<span>{label}</span></button>
}

function MobileNav({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return <button className={active ? 'mobile-nav-item active' : 'mobile-nav-item'} onClick={onClick}>{icon}<span>{label}</span></button>
}

function TodayView({ tasks, overdue, todayTasks, pendingAmount, pendingPayments, quickText, onQuickTextChange, onToggle, plan, onCreatePlan, onAddPlan, onPlanner, busyTaskId, aiLoading }: {
  tasks: Task[]
  overdue: Task[]
  todayTasks: Task[]
  pendingAmount: number
  pendingPayments: Payment[]
  quickText: string
  onQuickTextChange: (value: string) => void
  onToggle: (id: string) => void
  plan: Task[]
  onCreatePlan: () => void
  onAddPlan: () => void
  onPlanner: () => void
  busyTaskId: string | null
  aiLoading: boolean
}) {
  const nextTasks = tasks.filter(t => t.status === 'open' && t.dueDate > iso(today)).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 3)

  return (
    <div className="content-stack">
      <section className="welcome-row">
        <div>
          <p className="section-kicker">{new Intl.DateTimeFormat(currentLanguage==='pt'?'pt-PT':'en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(today).toUpperCase()}</p>
          <h2>{currentLanguage==='pt' ? 'Bom dia. Veja o que precisa de você.' : "Good morning. Here's what needs you."}</h2>
        </div>
        <div className="stat-card"><strong>{pendingMoneyLabel(pendingPayments)}</strong><span>{tr('pending')}</span></div>
      </section>

      <section className="quick-card">
        <div className="quick-icon"><Sparkles size={19} /></div>
        <div className="quick-main">
          <div className="quick-label">{tr('aiQuick')}</div>
          <h3>{tr('quickQuestion')}</h3>
          <textarea value={quickText} onChange={e => onQuickTextChange(e.target.value)} placeholder="e.g. Deliver John's website Friday, collect $200 from Maria tomorrow, and send Pedro the proposal Monday." />
          <div className="quick-actions">
            <button className="primary-button" onClick={onCreatePlan} disabled={aiLoading}>{aiLoading ? (currentLanguage==='pt' ? 'A analisar…' : 'Analyzing…') : tr('createPlan')} {!aiLoading && <ArrowRight size={17} />}</button>
            <span>{tr('plain')}</span>
          </div>
        </div>
      </section>

      {plan.length > 0 && (
        <section className="ai-result-card">
          <div className="ai-result-head">
            <div>
              <div className="quick-label">{tr('yourPlan')}</div>
              <h3>{tr('foundItems').replace('{n}', String(plan.length))}</h3>
            </div>
            <Sparkles size={18} />
          </div>
          <div className="ai-plan-list">
            {plan.map((task, index) => (
              <div className="ai-plan-item" key={`ai-plan-${task.id}-${index}`}>
                <div className="ai-plan-icon">{/payment|pagamento|cobrar|receber/i.test(task.title) ? '💰' : /proposal|proposta/i.test(task.title) ? '📄' : '💻'}</div>
                <div><strong>{task.title}</strong><span>{task.client} · {formatDate(task.dueDate)}</span></div>
              </div>
            ))}
          </div>
          <button className="primary-button" onClick={onAddPlan}>{tr('addAll')} <ArrowRight size={17} /></button>
        </section>
      )}

      <div className="section-heading"><div><p className="section-kicker">{tr('today')}</p><h2>{tr('todayFocus')}</h2></div><button className="text-button" onClick={onCreatePlan}><Sparkles size={15} /> {tr('quickAdd')}</button></div>

      {overdue.length > 0 && <TaskSection title={tr('overdue')} tone="danger" tasks={overdue} onToggle={onToggle} />}
      {todayTasks.length > 0 ? <TaskSection title={tr('today').toUpperCase()} tasks={todayTasks} onToggle={onToggle} /> : (
        <div className="empty-card"><CheckCircle2 size={23} /><div><strong>{tr('nothing')}</strong><p>{tr('breathing')}</p></div></div>
      )}

      <div className="section-heading up-next"><h2>{tr('upNext')}</h2><button className="text-button" onClick={onPlanner}><Bot size={16} /> {tr('organize')}</button></div>
      {nextTasks.map(task => <TaskRow key={task.id} task={task} onToggle={onToggle} disabled={busyTaskId === task.id} />)}
      <div className="summary-line">{tasks.filter(t => t.status === 'open').length} {tr('open').toLowerCase()} · {pendingMoneyLabel(pendingPayments)} {tr('pending')}</div>
    </div>
  )
}

function TaskSection({ title, tone, tasks, onToggle }: { title: string; tone?: 'danger'; tasks: Task[]; onToggle: (id: string) => void }) {
  return <section className="task-section"><div className={tone === 'danger' ? 'task-section-title danger' : 'task-section-title'}>{tone === 'danger' && '● '}{title}</div>{tasks.map(task => <TaskRow key={task.id} task={task} onToggle={onToggle} />)}</section>
}

function TaskRow({ task, onToggle, disabled }: { task: Task; onToggle: (id: string) => void; disabled?: boolean }) {
  return (
    <div className="task-row">
      <button type="button" disabled={disabled} className={task.status === 'completed' ? 'check-box checked' : 'check-box'} onClick={() => onToggle(task.id)} aria-label={task.status === 'completed' ? 'Reopen task' : tr('complete')} aria-busy={disabled}>
        {task.status === 'completed' && <Check size={14} />}
      </button>
      <div className="task-info"><strong>{task.title}</strong><span>{task.client} · {formatDate(task.dueDate)}</span></div>
      <PriorityBadge priority={task.priority} />
    </div>
  )
}

function TasksView({ tasks, onToggle, onAdd, busyTaskId }: { tasks: Task[]; onToggle: (id: string) => void; onAdd: () => void; busyTaskId: string | null }) {
  const [filter, setFilter] = useState<'all' | 'open' | 'completed'>('open')
  const filtered = tasks.filter(t => filter === 'all' || t.status === filter)
  return <div className="content-stack">
    <div className="page-intro"><div><p className="section-kicker">{tr('workQueue')}</p><h2>{tr('tasksHeadline')}</h2><p className="page-description">{tr('tasksDescription')}</p></div><button className="primary-button" onClick={onAdd}><Plus size={17} /> {tr('addTask')}</button></div>
    <div className="filter-tabs">{(['open', 'completed', 'all'] as const).map(item => <button key={item} className={filter === item ? 'filter-tab active' : 'filter-tab'} onClick={() => setFilter(item)}>{item === 'open' ? tr('open') : item === 'completed' ? tr('completed') : tr('all')} <span>{tasks.filter(t => item === 'all' || t.status === item).length}</span></button>)}</div>
    <div className="card-list">{filtered.map(task => <TaskRow key={task.id} task={task} onToggle={onToggle} />)}</div>
  </div>
}

function ClientsView({ clients, tasks, payments }: { clients: Client[]; tasks: Task[]; payments: Payment[] }) {
  return <div className="content-stack">
    <div className="page-intro"><div><p className="section-kicker">{tr('clients')}</p><h2>{tr('clientsHeadline')}</h2><p className="page-description">{tr('clientsDescription')}</p></div></div>
    <div className="client-grid">{clients.map(client => {
      const clientTasks = tasks.filter(t => t.client.toLowerCase() === client.name.toLowerCase())
      const clientPayments = payments.filter(p => p.client.toLowerCase() === client.name.toLowerCase() && p.status === 'pending')
      const amount = clientPayments.reduce((sum, p) => sum + p.amount, 0)
      return <div className="client-card" key={client.id}><div className="avatar">{client.name.charAt(0).toUpperCase()}</div><div className="client-name">{client.name}</div><div className="client-meta">{clientTasks.length} {tr('tasks').toLowerCase()} · {amount ? formatMoney(amount, clientPayments[0]?.currency ?? 'USD') + ' ' + tr('pending') : formatMoney(0, clientPayments[0]?.currency ?? 'USD')}</div><div className="client-progress"><span style={{ width: Math.min(100, clientTasks.length * 18) + '%' }} /></div></div>
    })}</div>
  </div>
}

function PaymentsView({ payments, onMarkPaid, onAdd }: { payments: Payment[]; onMarkPaid: (id: string) => void; onAdd: () => void }) {
  const pending = payments.filter(p => p.status === 'pending')
  const paid = payments.filter(p => p.status === 'paid')
  return <div className="content-stack">
    <div className="page-intro"><div><p className="section-kicker">{tr('moneyDue')}</p><h2>{tr('paymentsHeadline')}</h2><p className="page-description">{tr('paymentsDescription')}</p></div><button className="primary-button" onClick={onAdd}><Plus size={17} /> {currentLanguage === 'pt' ? 'Adicionar pagamento' : 'Add payment'}</button><div className="money-total">{pendingMoneyLabel(pending)}<span>{tr('pending')}</span></div></div>
    {pending.length === 0 && <div className="empty-card"><CheckCircle2 size={23} /><div><strong>{tr('clear')}</strong><p>{tr('noPending')}</p></div></div>}
    <div className="payment-list">{pending.map(payment => <PaymentRow key={payment.id} payment={payment} onMarkPaid={onMarkPaid} />)}</div>
    {paid.length > 0 && <><div className="section-heading"><h2>{tr('paid')}</h2></div><div className="payment-list">{paid.map(payment => <PaymentRow key={payment.id} payment={payment} onMarkPaid={onMarkPaid} />)}</div></>}
  </div>
}

function PaymentRow({ payment, onMarkPaid }: { payment: Payment; onMarkPaid: (id: string) => void }) {
  const isOverdue = payment.status === 'pending' && payment.dueDate < iso(today)
  return <div className="payment-row"><div className={isOverdue ? 'payment-icon overdue' : 'payment-icon'}><CircleDollarSign size={19} /></div><div className="payment-info"><strong>{payment.client} — {payment.currency} {payment.amount}</strong><span>{payment.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue · due ' + formatDate(payment.dueDate) : 'Due ' + formatDate(payment.dueDate)}</span></div>{payment.status === 'pending' ? <button className="secondary-button" onClick={() => onMarkPaid(payment.id)}>{tr('markPaid')}</button> : <span className="paid-label"><Check size={15} /> Paid</span>}</div>
}

function PlannerView({ plan, onGenerate, onAddPlan }: { plan: Task[]; onGenerate: () => void; onAddPlan: () => void }) {
  return <div className="content-stack">
    <div className="page-intro"><div><p className="section-kicker">{tr('aiPlanner')}</p><h2>{tr('calmer')}</h2><p className="page-description">{tr('plannerDesc')}</p></div></div>
    <div className="planner-card"><div className="planner-hero"><div className="planner-bot"><Bot size={26} /></div><div><strong>{tr('openItems')}</strong><p>{tr('generateOrder')}</p></div></div>{plan.length ? <div className="plan-list">{plan.map((task, index) => <div className="plan-item" key={`${task.id}-${index}`}><span>{formatDate(task.dueDate)}</span><strong>{task.title}</strong><small>{task.client}</small></div>)}</div> : <div className="planner-empty"><Sparkles size={22} /><p>{tr('planEmpty')}</p></div>}<div className="planner-actions"><button className="secondary-button" onClick={onGenerate}><Sparkles size={17} /> {tr('generatePlan')}</button>{plan.length > 0 && <button className="primary-button" onClick={onAddPlan}>{tr('addAllToday')} <ArrowRight size={17} /></button>}</div></div>
  </div>
}

function AddPaymentModal({ onClose, onAdd }: { onClose: () => void; onAdd: (payment: Omit<Payment, 'id' | 'status'>) => void }) {
  const [client, setClient] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(addDays(0))
  const submit = () => {
    const value = Number(amount)
    if (client.trim() && value > 0) onAdd({ client: client.trim(), amount: value, currency: 'USD', dueDate })
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e => e.stopPropagation()}>
    <div className="modal-head"><div><p className="section-kicker">New payment</p><h2>Add a payment</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div>
    <label>Client<input value={client} onChange={e => setClient(e.target.value)} placeholder="e.g. Maria" autoFocus /></label>
    <label>Amount<input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 200" /></label>
    <label>Due date<input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></label>
    <div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={submit}>Add payment</button></div>
  </div></div>
}

function AddTaskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (task: Omit<Task, 'id' | 'status'>) => void }) {
  const [title, setTitle] = useState('')
  const [client, setClient] = useState('')
  const [dueDate, setDueDate] = useState(addDays(0))
  const [priority, setPriority] = useState<Priority>('medium')
  const submit = () => { if (title.trim() && client.trim()) onAdd({ title: title.trim(), client: client.trim(), dueDate, priority }) }
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e => e.stopPropagation()}><div className="modal-head"><div><p className="section-kicker">{tr('newTask')}</p><h2>Add a task</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div><label>{tr('task')}<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Finish homepage" autoFocus /></label><label>{tr('client')}<input value={client} onChange={e => setClient(e.target.value)} placeholder="e.g. John" /></label><div className="form-grid"><label>{tr('dueDate')}<input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></label><label>{tr('priority')}<select value={priority} onChange={e => setPriority(e.target.value as Priority)}><option value="low">{tr('low')}</option><option value="medium">{tr('medium')}</option><option value="high">{tr('high')}</option></select></label></div><div className="modal-actions"><button className="secondary-button" onClick={onClose}>{tr('cancel')}</button><button className="primary-button" onClick={submit}>{tr('addTask')}</button></div></div></div>
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const label = priority === 'low' ? tr('low') : priority === 'medium' ? tr('medium') : tr('high')
  return <span className={'priority ' + priority}>{label}</span>
}

function formatDate(value: string) {
  const date = new Date(value + 'T00:00:00')
  if (value === iso(today)) return tr('today')
  if (value === addDays(1)) return tr('tomorrow')
  return date.toLocaleDateString(currentLanguage === 'pt' ? 'pt-PT' : 'en-US', { month: 'short', day: 'numeric' })
}

export default App
