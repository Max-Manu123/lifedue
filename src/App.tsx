import { useEffect, useState } from 'react'
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
import type { Client, Payment, Priority, Task } from './types'

type View = 'home' | 'quick-add' | 'tasks' | 'clients' | 'payments' | 'planner'
type Language='en'|'pt'
const trMap={en:{today:'Today',tasks:'Tasks',clients:'Clients',payments:'Payments',planner:'AI Planner',addTask:'Add task',freePlan:'Free plan',workspace:'CLIENT WORKSPACE',openApp:'Open app',builtFor:'Built for client work',heroText:'Turn your client work into a simple daily plan. Add tasks in plain language and see what needs your attention today.',tryFree:'Try it free',noCard:'No credit card required',quickAdd:'Quick Add',todayFirst:'Today first',paymentsText:'Keep pending client money visible.',quickAddText:'Describe several client tasks at once.',todayText:'See overdue and due-now work immediately.',pending:'pending',aiQuick:'AI QUICK ADD',quickQuestion:'What do you need to get done?',createPlan:'Create plan',plain:'Plain language · no setup',yourPlan:'YOUR PLAN',addAll:'Add all',overdue:'OVERDUE',upNext:'Up next',organize:'Organize my plan',nothing:'Nothing due today',breathing:'Enjoy the breathing room or add a task.',workQueue:'WORK QUEUE',everything:'Everything you need to deliver.',completed:'Completed',all:'All',open:'Open',clientsIntro:'Keep the people behind the work visible.',moneyDue:'MONEY DUE',unpaid:'Don’t let finished work stay unpaid.',clear:'All payments are clear',noPending:'No pending client payments.',paid:'Paid',markPaid:'Mark paid',aiPlanner:'AI PLANNER',calmer:'Turn your backlog into a calmer day.',plannerDesc:'LifeDue groups open work into a simple plan instead of making you manage a giant list.',openItems:'open items competing for attention.',generateOrder:'Generate a suggested order for your next few days.',generatePlan:'Generate plan',addAllToday:'Add all to Today',planEmpty:'Your plan will appear here.',newTask:'NEW TASK',task:'Task',client:'Client',dueDate:'Due date',priority:'Priority',cancel:'Cancel',low:'Low',medium:'Medium',high:'High',finishHomepage:'e.g. Finish homepage',john:'e.g. John',complete:'Complete task',tomorrow:'Tomorrow',due:'Due',overdueDue:'Overdue · due',menu:'Open menu',foundItems:'LifeDue found {n} items.'},pt:{today:'Hoje',tasks:'Tarefas',clients:'Clientes',payments:'Pagamentos',planner:'Planejador IA',addTask:'Adicionar tarefa',freePlan:'Plano grátis',workspace:'ÁREA DE CLIENTES',openApp:'Abrir app',builtFor:'Feito para trabalho com clientes',heroText:'Transforme seu trabalho com clientes em um plano diário simples. Adicione tarefas em linguagem natural e veja o que precisa da sua atenção hoje.',tryFree:'Experimentar grátis',noCard:'Sem cartão de crédito',quickAdd:'Adicionar rápido',todayFirst:'Hoje primeiro',paymentsText:'Mantenha os pagamentos pendentes visíveis.',quickAddText:'Descreva várias tarefas de clientes de uma vez.',todayText:'Veja imediatamente o que está atrasado e vence hoje.',pending:'pendente',aiQuick:'ADICIONAR COM IA',quickQuestion:'O que você precisa fazer?',createPlan:'Criar plano',plain:'Linguagem natural · sem configuração',yourPlan:'SEU PLANO',addAll:'Adicionar tudo',overdue:'ATRASADO',upNext:'A seguir',organize:'Organizar meu plano',nothing:'Nada vence hoje',breathing:'Aproveite o tempo livre ou adicione uma tarefa.',workQueue:'FILA DE TRABALHO',everything:'Tudo o que você precisa entregar.',completed:'Concluídas',all:'Todas',open:'Abertas',clientsIntro:'Mantenha visíveis as pessoas por trás do trabalho.',moneyDue:'DINHEIRO A RECEBER',unpaid:'Não deixe trabalho concluído ficar sem pagamento.',clear:'Todos os pagamentos estão em dia',noPending:'Não há pagamentos de clientes pendentes.',paid:'Pago',markPaid:'Marcar como pago',aiPlanner:'PLANEJADOR IA',calmer:'Transforme sua lista em um dia mais tranquilo.',plannerDesc:'O LifeDue agrupa o trabalho aberto em um plano simples em vez de fazer você gerenciar uma lista enorme.',openItems:'itens abertos disputando sua atenção.',generateOrder:'Gere uma ordem sugerida para os próximos dias.',generatePlan:'Gerar plano',addAllToday:'Adicionar tudo para hoje',planEmpty:'Seu plano aparecerá aqui.',newTask:'NOVA TAREFA',task:'Tarefa',client:'Cliente',dueDate:'Data de entrega',priority:'Prioridade',cancel:'Cancelar',low:'Baixa',medium:'Média',high:'Alta',finishHomepage:'ex.: Finalizar página inicial',john:'ex.: João',complete:'Concluir tarefa',tomorrow:'Amanhã',due:'Vence',overdueDue:'Atrasado · vence',menu:'Abrir menu',foundItems:'O LifeDue encontrou {n} itens.'}}
let currentLanguage:Language='en'
const tr=(key:keyof typeof trMap.en)=>trMap[currentLanguage][key]

const today = new Date()
today.setHours(0, 0, 0, 0)

const iso = (date: Date) => date.toISOString().slice(0, 10)
const addDays = (days: number) => {
  const date = new Date(today)
  date.setDate(date.getDate() + days)
  return iso(date)
}

const seedTasks: Task[] = [
  { id: '1', title: 'Finish homepage', client: 'John', dueDate: addDays(0), priority: 'high', status: 'open' },
  { id: '2', title: 'Send invoice', client: 'Maria', dueDate: addDays(0), priority: 'medium', status: 'open' },
  { id: '3', title: 'Follow up payment', client: 'Pedro', dueDate: addDays(1), priority: 'high', status: 'open' },
  { id: '4', title: 'Deliver website', client: 'John', dueDate: addDays(4), priority: 'high', status: 'open' },
  { id: '5', title: 'Send proposal', client: 'Pedro', dueDate: addDays(7), priority: 'medium', status: 'open' },
]

const seedClients: Client[] = [
  { id: '1', name: 'John' },
  { id: '2', name: 'Maria' },
  { id: '3', name: 'Pedro' },
]

const seedPayments: Payment[] = [
  { id: '1', client: 'Maria', amount: 200, currency: 'USD', dueDate: addDays(-1), status: 'pending' },
  { id: '2', client: 'John', amount: 500, currency: 'USD', dueDate: addDays(0), status: 'pending' },
]

const examplePlan: Task[] = [
  { id: 'ai-1', title: 'Follow up payment', client: 'Maria', dueDate: addDays(1), priority: 'high', status: 'open' },
  { id: 'ai-2', title: 'Send proposal', client: 'Pedro', dueDate: addDays(7), priority: 'medium', status: 'open' },
  { id: 'ai-3', title: 'Deliver website', client: 'John', dueDate: addDays(4), priority: 'high', status: 'open' },
]

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function App() {
  const [language,setLanguage]=useState<Language>(()=>(localStorage.getItem('lifedue-language') as Language)||'en')
  currentLanguage=language
  useEffect(()=>localStorage.setItem('lifedue-language',language),[language])
  const [view, setView] = useState<View>('home')
  const [tasks, setTasks] = useState<Task[]>(() => load('lifedue-tasks', seedTasks))
  const [clients, setClients] = useState<Client[]>(() => load('lifedue-clients', seedClients))
  const [payments, setPayments] = useState<Payment[]>(() => load('lifedue-payments', seedPayments))
  const [quickText, setQuickText] = useState('')
  const [plan, setPlan] = useState<Task[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => localStorage.setItem('lifedue-tasks', JSON.stringify(tasks)), [tasks])
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

  const toggleTask = (id: string) => {
    setTasks(current => current.map(task => task.id === id
      ? { ...task, status: task.status === 'open' ? 'completed' : 'open' }
      : task
    ))
  }

  const createPlan = () => {
    const normalized = quickText.toLowerCase()
    if (!normalized.trim()) {
      setPlan(examplePlan)
    } else {
      const generated: Task[] = []
      if (normalized.includes('maria') || normalized.includes('payment') || normalized.includes('pagamento')) {
        generated.push({ ...examplePlan[0], id: crypto.randomUUID() })
      }
      if (normalized.includes('pedro') || normalized.includes('proposal') || normalized.includes('proposta')) {
        generated.push({ ...examplePlan[1], id: crypto.randomUUID() })
      }
      if (normalized.includes('john') || normalized.includes('website') || normalized.includes('site')) {
        generated.push({ ...examplePlan[2], id: crypto.randomUUID() })
      }
      setPlan(generated.length ? generated : examplePlan)
    }
    setView('quick-add')
  }

  const addPlan = () => {
    if (!plan.length) return
    const clientNames = new Set(clients.map(c => c.name.toLowerCase()))
    const newClients = plan
      .filter(task => !clientNames.has(task.client.toLowerCase()))
      .map(task => ({ id: crypto.randomUUID(), name: task.client }))
    if (newClients.length) setClients(current => [...current, ...newClients])
    setTasks(current => [...current, ...plan])
    setPlan([])
    setQuickText('')
    setView('quick-add')
  }

  const addTask = (task: Omit<Task, 'id' | 'status'>) => {
    const next = { ...task, id: crypto.randomUUID(), status: 'open' as const }
    setTasks(current => [next, ...current])
    if (!clients.some(c => c.name.toLowerCase() === task.client.toLowerCase())) {
      setClients(current => [...current, { id: crypto.randomUUID(), name: task.client }])
    }
    setShowAdd(false)
  }

  const markPaid = (id: string) => {
    setPayments(current => current.map(payment => payment.id === id ? { ...payment, status: 'paid' } : payment))
  }

  return (
    <div className="app-shell">
      {view === 'home' ? (
        <Landing onStart={() => navigate('quick-add')} language={language} setLanguage={setLanguage} />
      ) : (
        <div className="workspace">
          <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
            <div className="brand" onClick={() => navigate('home')}>
              <span className="brand-mark">L</span>
              <span>LifeDue</span>
            </div>
            <nav>
              <NavItem icon={<LayoutDashboard size={18} />} label={tr('today')} active={view === 'quick-add' || view === 'home'} onClick={() => navigate('quick-add')} />
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
                <h1>{view === 'quick-add' ? 'Your plan' : view === 'tasks' ? 'Tasks' : view === 'clients' ? 'Clients' : view === 'payments' ? 'Payments' : 'AI Planner'}</h1>
              </div>
              <button className="primary-button compact" onClick={() => setShowAdd(true)}><Plus size={17} /> Add task</button>
            </header>

            {view === 'quick-add' && (
              <TodayView
                tasks={tasks}
                overdue={overdue}
                todayTasks={todayTasks}
                pendingAmount={pendingAmount}
                onToggle={toggleTask}
                plan={plan}
                onCreatePlan={createPlan}
                onAddPlan={addPlan}
                onPlanner={() => navigate('planner')}
              />
            )}
            {view === 'tasks' && <TasksView tasks={tasks} onToggle={toggleTask} onAdd={() => setShowAdd(true)} />}
            {view === 'clients' && <ClientsView clients={clients} tasks={tasks} payments={payments} />}
            {view === 'payments' && <PaymentsView payments={payments} onMarkPaid={markPaid} />}
            {view === 'planner' && (
              <PlannerView
                plan={plan}
                onGenerate={() => { setPlan(examplePlan); setView('planner') }}
                onAddPlan={addPlan}
              />
            )}
          </main>

          <div className="mobile-nav">
            <MobileNav icon={<LayoutDashboard size={19} />} label={tr('today')} active={view === 'quick-add'} onClick={() => navigate('quick-add')} />
            <MobileNav icon={<ListTodo size={19} />} label={tr('tasks')} active={view === 'tasks'} onClick={() => navigate('tasks')} />
            <MobileNav icon={<Users size={19} />} label={tr('clients')} active={view === 'clients'} onClick={() => navigate('clients')} />
            <MobileNav icon={<CreditCard size={19} />} label="Money" active={view === 'payments'} onClick={() => navigate('payments')} />
          </div>
        </div>
      )}

      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onAdd={addTask} />}
    </div>
  )
}

function Landing({ onStart, language, setLanguage }: { onStart: () => void; language: Language; setLanguage: (language: Language) => void }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand"><span className="brand-mark">L</span><span>LifeDue</span></div><div className="language-switcher"><button className={language==='en'?'active':''} onClick={()=>setLanguage('en')}>EN</button><button className={language==='pt'?'active':''} onClick={()=>setLanguage('pt')}>PT</button></div>
        <button className="ghost-button" onClick={onStart}>Open app <ArrowRight size={16} /></button>
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

function TodayView({ tasks, overdue, todayTasks, pendingAmount, onToggle, plan, onCreatePlan, onAddPlan, onPlanner }: {
  tasks: Task[]
  overdue: Task[]
  todayTasks: Task[]
  pendingAmount: number
  onToggle: (id: string) => void
  plan: Task[]
  onCreatePlan: () => void
  onAddPlan: () => void
  onPlanner: () => void
}) {
  const [text, setText] = useState('')
  const nextTasks = tasks.filter(t => t.status === 'open' && t.dueDate > iso(today)).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 3)

  return (
    <div className="content-stack">
      <section className="welcome-row">
        <div>
          <p className="section-kicker">{currentLanguage==='pt' ? 'SEGUNDA, 21 DE SETEMBRO' : 'MONDAY, SEPTEMBER 21'}</p>
          <h2>{currentLanguage==='pt' ? 'Bom dia. Veja o que precisa de você.' : "Good morning. Here's what needs you."}</h2>
        </div>
        <div className="stat-card"><strong>{pendingAmount.toLocaleString(currentLanguage==='pt'?'pt-PT':'en-US', { style: 'currency', currency: 'USD' })}</strong><span>pending</span></div>
      </section>

      <section className="quick-card">
        <div className="quick-icon"><Sparkles size={19} /></div>
        <div className="quick-main">
          <div className="quick-label">{tr('aiQuick')}</div>
          <h3>{tr('quickQuestion')}</h3>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="e.g. Deliver John's website Friday, collect $200 from Maria tomorrow, and send Pedro the proposal Monday." />
          <div className="quick-actions">
            <button className="primary-button" onClick={onCreatePlan}>Create plan <ArrowRight size={17} /></button>
            <span>{tr('plain')}</span>
          </div>
        </div>
      </section>

      {plan.length > 0 && (
        <section className="ai-result-card">
          <div className="ai-result-head">
            <div>
              <div className="quick-label">{tr('yourPlan')}</div>
              <h3>LifeDue found {plan.length} items.</h3>
            </div>
            <Sparkles size={18} />
          </div>
          <div className="ai-plan-list">
            {plan.map(task => (
              <div className="ai-plan-item" key={task.id}>
                <div className="ai-plan-icon">{task.title.toLowerCase().includes('payment') ? '💰' : task.title.toLowerCase().includes('proposal') ? '📄' : '💻'}</div>
                <div><strong>{task.title}</strong><span>{task.client} · {formatDate(task.dueDate)}</span></div>
              </div>
            ))}
          </div>
          <button className="primary-button" onClick={onAddPlan}>Add all <ArrowRight size={17} /></button>
        </section>
      )}

      <div className="section-heading"><h2>{tr('today')}</h2><button className="text-button" onClick={onCreatePlan}>Quick Add</button></div>

      {overdue.length > 0 && <TaskSection title="OVERDUE" tone="danger" tasks={overdue} onToggle={onToggle} />}
      {todayTasks.length > 0 ? <TaskSection title="TODAY" tasks={todayTasks} onToggle={onToggle} /> : (
        <div className="empty-card"><CheckCircle2 size={23} /><div><strong>{tr('nothing')}</strong><p>{tr('breathing')}</p></div></div>
      )}

      <div className="section-heading up-next"><h2>{tr('upNext')}</h2><button className="text-button" onClick={onPlanner}><Bot size={16} /> Organize my plan</button></div>
      {nextTasks.map(task => <TaskRow key={task.id} task={task} onToggle={onToggle} />)}
      <div className="summary-line">{tasks.filter(t => t.status === 'open').length} open tasks · {pendingAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} pending</div>
    </div>
  )
}

function TaskSection({ title, tone, tasks, onToggle }: { title: string; tone?: 'danger'; tasks: Task[]; onToggle: (id: string) => void }) {
  return <section className="task-section"><div className={tone === 'danger' ? 'task-section-title danger' : 'task-section-title'}>{tone === 'danger' && '● '}{title}</div>{tasks.map(task => <TaskRow key={task.id} task={task} onToggle={onToggle} />)}</section>
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  return (
    <div className="task-row">
      <button className={task.status === 'completed' ? 'check-box checked' : 'check-box'} onClick={() => onToggle(task.id)} aria-label={tr("complete")}>
        {task.status === 'completed' && <Check size={14} />}
      </button>
      <div className="task-info"><strong>{task.title}</strong><span>{task.client} · {formatDate(task.dueDate)}</span></div>
      <PriorityBadge priority={task.priority} />
    </div>
  )
}

function TasksView({ tasks, onToggle, onAdd }: { tasks: Task[]; onToggle: (id: string) => void; onAdd: () => void }) {
  const [filter, setFilter] = useState<'all' | 'open' | 'completed'>('open')
  const filtered = tasks.filter(t => filter === 'all' || t.status === filter)
  return <div className="content-stack">
    <div className="page-intro"><div><p className="section-kicker">{tr('workQueue')}</p><h2>{tr('everything')}</h2></div><button className="primary-button" onClick={onAdd}><Plus size={17} /> Add task</button></div>
    <div className="filter-tabs">{(['open', 'completed', 'all'] as const).map(item => <button key={item} className={filter === item ? 'filter-tab active' : 'filter-tab'} onClick={() => setFilter(item)}>{item === 'open' ? 'Open' : item === 'completed' ? 'Completed' : 'All'} <span>{tasks.filter(t => item === 'all' || t.status === item).length}</span></button>)}</div>
    <div className="card-list">{filtered.map(task => <TaskRow key={task.id} task={task} onToggle={onToggle} />)}</div>
  </div>
}

function ClientsView({ clients, tasks, payments }: { clients: Client[]; tasks: Task[]; payments: Payment[] }) {
  return <div className="content-stack">
    <div className="page-intro"><div><p className="section-kicker">CLIENTS</p><h2>{tr('clientsIntro')}</h2></div></div>
    <div className="client-grid">{clients.map(client => {
      const clientTasks = tasks.filter(t => t.client.toLowerCase() === client.name.toLowerCase())
      const clientPayments = payments.filter(p => p.client.toLowerCase() === client.name.toLowerCase() && p.status === 'pending')
      const amount = clientPayments.reduce((sum, p) => sum + p.amount, 0)
      return <div className="client-card" key={client.id}><div className="avatar">{client.name.charAt(0).toUpperCase()}</div><div className="client-name">{client.name}</div><div className="client-meta">{clientTasks.length} tasks · {amount ? '$' + amount + ' pending' : '$0'}</div><div className="client-progress"><span style={{ width: Math.min(100, clientTasks.length * 18) + '%' }} /></div></div>
    })}</div>
  </div>
}

function PaymentsView({ payments, onMarkPaid }: { payments: Payment[]; onMarkPaid: (id: string) => void }) {
  const pending = payments.filter(p => p.status === 'pending')
  const paid = payments.filter(p => p.status === 'paid')
  return <div className="content-stack">
    <div className="page-intro"><div><p className="section-kicker">{tr('moneyDue')}</p><h2>Don't let finished work stay unpaid.</h2></div><div className="money-total">{pending.reduce((s, p) => s + p.amount, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}<span>pending</span></div></div>
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
    <div className="page-intro"><div><p className="section-kicker">{tr('aiPlanner')}</p><h2>{tr('calmer')}</h2><p className="page-description">LifeDue groups open work into a simple plan instead of making you manage a giant list.</p></div></div>
    <div className="planner-card"><div className="planner-hero"><div className="planner-bot"><Bot size={26} /></div><div><strong>You have {Math.max(5, plan.length + 4)} open items competing for attention.</strong><p>Generate a suggested order for your next few days.</p></div></div>{plan.length ? <div className="plan-list">{plan.map(task => <div className="plan-item" key={task.id}><span>{formatDate(task.dueDate)}</span><strong>{task.title}</strong><small>{task.client}</small></div>)}</div> : <div className="planner-empty"><Sparkles size={22} /><p>Your plan will appear here.</p></div>}<div className="planner-actions"><button className="secondary-button" onClick={onGenerate}><Sparkles size={17} /> Generate plan</button>{plan.length > 0 && <button className="primary-button" onClick={onAddPlan}>Add all to Today <ArrowRight size={17} /></button>}</div></div>
  </div>
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
  return <span className={'priority ' + priority}>{priority}</span>
}

function formatDate(value: string) {
  const date = new Date(value + 'T00:00:00')
  if (value === iso(today)) return tr('today')
  if (value === addDays(1)) return tr('tomorrow')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default App
