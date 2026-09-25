import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  LayoutDashboard,
  ListTodo,
  Menu,
  Plus,
  Sparkles,
  Users,
  X,
  MessageSquareText,
  Settings,
  UserCircle2,
  Globe2,
  Sun,
  Moon,
  Monitor,
  LogOut,
  CheckCircle,
} from 'lucide-react'
import type { Client, Payment, Priority, QuickAddItem, Task } from './types'
import type { User, FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { fetchClients, fetchPayments, fetchTasks, removeLegacyDemoTasks, createTasks, createClient, createPayment, updateTaskStatus, updatePaymentStatus } from './lib/tasks'
import { AuthModal } from './components/AuthModal'
import { PlanReview } from './components/PlanReview'

type View = 'home' | 'onboarding' | 'quick-add' | 'tasks' | 'clients' | 'payments' | 'planner' | 'feedback' | 'settings'
type Language='en'|'pt'
type AiUsage = { used: number; limit: number; remaining: number }
const trMap={en:{today:'Today',tasks:'Tasks',clients:'Clients',payments:'Payments',planner:'AI Planner',addTask:'Add task',freePlan:'Free plan',aiUsageLabel:'AI usage',aiUsesRemaining:'{n} AI uses remaining this month',aiLimitReachedNotice:'You have used all 20 AI actions for this month.',aiLimitReachedTitle:'You\'ve reached your free AI limit',aiLimitReachedDesc:'Your 20 AI actions for this month are used. Join the Pro waitlist and we\'ll let you know when Pro is available.',aiUsageExhausted:'Your AI credits are used up for this month.',aiUsageReset:'Your AI credits reset automatically at the start of each month.',aiUsageShared:'Create with AI and AI Planner share the same 20 AI credits each month.',proComingSoon:'LifeDue Pro is coming soon',proComingSoonDesc:'You\'re already on the Pro list. We\'ll notify you when Pro is ready.',proLimitWaitlist:'Join the Pro waitlist',proLimitEmail:'Email for Pro updates',proLimitSaved:'You\'re on the Pro list. Pro is coming soon.',workspace:'CLIENT WORKSPACE',openApp:'Open app',builtFor:'Built for client work',heroText:'Turn your client work into a simple daily plan. Add tasks in plain language and see what needs your attention today.',tryFree:'Try it free',noCard:'No credit card required',quickAdd:'Quick Add',todayFirst:'Today first',paymentsText:'Keep pending client money visible.',quickAddText:'Describe several client tasks at once.',todayText:'See overdue and due-now work immediately.',pending:'pending',aiQuick:'AI QUICK ADD',quickQuestion:'What do you need to get done?',createPlan:'Create plan',plain:'Plain language · no setup',yourPlan:'YOUR PLAN',addAll:'Add all',saveToLifeDue:'Save to LifeDue',overdue:'OVERDUE',upNext:'Up next',organize:'Organize my plan',openPlanner:'Open AI Planner',addPlanToLifeDue:'Add to LifeDue',currencySummary:'By currency',nothing:'Nothing due today',breathing:'Enjoy the breathing room or add a task.',workQueue:'WORK QUEUE',everything:'Everything you need to deliver.',completed:'Completed',all:'All',open:'Open',clientsIntro:'Keep the people behind the work visible.',addClient:'Add client',addClientTitle:'Add a client',clientName:'Client name',clientNamePlaceholder:'e.g. Maria',noClientName:'Enter a client name.',moneyDue:'MONEY DUE',unpaid:'Don’t let finished work stay unpaid.',clear:'All payments are clear',noPending:'No pending client payments.',paid:'Paid',markPaid:'Mark paid',aiPlanner:'AI PLANNER',calmer:'Turn your backlog into a calmer day.',plannerDesc:'LifeDue groups open work into a simple plan instead of making you manage a giant list.',openItems:'open items competing for attention.',generateOrder:'Generate a suggested order for your next few days.',generatePlan:'Generate plan',savePlan:'Save plan',plannerReady:'Plan ready',plannerOpen:'open tasks',plannerOverdue:'overdue',plannerToday:'due today',plannerUpcoming:'upcoming',plannerEmptyTitle:'No open work to plan',plannerEmptyDesc:'Add a task first and LifeDue will organize it into a practical order.',plannerFallback:'Showing a local order based on due date and priority. Sign in to use AI prioritization.',plannerAiReady:'AI suggested order ready.',plannerLocalReady:'Suggested order ready.',plannerAiDesc:'Order based on due dates, priority, and task context.',plannerLocalDesc:'Order based on due dates and priority. Sign in to use AI prioritization.',plannerHowItWorks:'How it works',plannerHowItWorksDesc:'LifeDue organizes open tasks by due date and priority. With AI, task context helps break ties.',plannerPlannerInfo:'The Planner only suggests an order. It does not change your tasks.',addTaskToPlan:'Add a task',viewTasks:'View tasks',planEmpty:'Your plan will appear here.',newTask:'NEW TASK',task:'Task',client:'Client',dueDate:'Due date',noDueDate:'No deadline',priority:'Priority',cancel:'Cancel',low:'Low',medium:'Medium',high:'High',finishHomepage:'e.g. Finish homepage',john:'e.g. John',complete:'Complete task',tomorrow:'Tomorrow',due:'Due',overdueDue:'Overdue · due',menu:'Open menu',foundItems:'LifeDue found {n} items.',todayFocus:'Here is what needs your attention.',todayGreetingMorning:'Good morning. Let\'s handle what matters.',todayGreetingAfternoon:'Good afternoon. Let\'s handle what matters.',todayGreetingEvening:'Good evening. Let\'s handle what matters.',focusTitle:'Today\'s focus',openWork:'Open work',dueToday:'Due today',urgent:'Urgent',toCollect:'To collect',allClearToday:'You\'re clear for today',allClearDesc:'No overdue work or payments need attention right now.',paymentAttention:'Payment follow-ups',paymentAttentionDesc:'Money that still needs to move.',noPaymentAttention:'No payment follow-ups due.',upcomingWork:'Coming up next',upcomingDesc:'Work due after today, ordered by delivery date.',noUpcoming:'Nothing else is scheduled yet.',viewAllTasks:'View all tasks',viewPayments:'View payments',addTaskToday:'Add a task',addPaymentToday:'Add payment',markPaidToday:'Mark paid',tasksHeadline:'Everything you need to deliver.',tasksDescription:'Keep work visible, prioritize what matters, and close tasks as you finish them.',taskSearch:'Search tasks or clients',taskSummary:'taskSummary',taskProgress:'complete',noTasks:'No tasks here',noTasksDesc:'Add a task or change the filter to see more work.',clearSearch:'Clear search',dueSoon:'Due soon',overdueTasks:'Overdue',todayTasks:'Today',upcomingTasks:'Upcoming',completedTasks:'Completed',priorityFilter:'Priority',allPriorities:'All priorities',clientsHeadline:'A clear view of your client work.',clientsDescription:'See who you work with, how much work is open, and what is still pending.',paymentsHeadline:'Keep every payment moving.',paymentsDescription:'Track money due by client, spot overdue payments, and mark payments as settled.',paymentOverview:'Payment overview',paymentPendingCount:'Pending',paymentOverdueCount:'Overdue',paymentPaidCount:'Paid',paymentPendingAmount:'Outstanding',paymentSearch:'Search by client',paymentFilter:'Filter',paymentAll:'All payments',paymentPending:'Pending',paymentOverdue:'Overdue',paymentPaid:'Paid',paymentDue:'Due',paymentOverdueLabel:'Overdue',paymentNoResults:'No payments match this filter.',paymentNoResultsDesc:'Try another filter or add a payment.',paymentHistory:'Payment history',paymentTotal:'Total',currency:'Currency',noCurrency:'Currency not set',usd:'USD',eur:'EUR',aoa:'AOA',newPayment:'New payment',addPaymentTitle:'Add a payment',amount:'Amount',addPayment:'Add payment',addTaskTitle:'Add a task',settings:'Settings',feedback:'Feedback',account:'Account',preferences:'Preferences',appearance:'Appearance',theme:'Theme',themeSystem:'Default',themeLight:'Light',themeDark:'Dark',language:'Language',languageChoiceDesc:'Choose the language used throughout LifeDue.',upgrade:'Upgrade to Pro',upgradeTitle:'LifeDue Pro',upgradeDesc:'Get more room to manage client work and unlock the next level of LifeDue.',proBenefits:'What you get',proBenefit1:'Higher limits for tasks and AI usage',proBenefit2:'More powerful planning and client-work workflows',proBenefit3:'Priority access to upcoming Pro features',notifyMe:'Notify me when Pro is ready',notifyEmail:'Email for Pro updates',notifyEmailPlaceholder:'you@example.com',joinWaitlist:'Join the waitlist',waitlistSuccess:'You’re on the list. We’ll notify you when Pro is ready.',waitlistError:'We could not save your email. Please try again.',waitlistInvalidEmail:'Enter a valid email address.',waitlistAlready:'This email is already on the list.',close:'Close',languageDesc:'Choose how LifeDue is displayed.' ,themeDesc:'Choose the appearance that feels right for you.',accountDesc:'Your LifeDue account and plan.',email:'Email',plan:'Plan',freePlanDesc:'Free plan · no payment required',security:'Security',securityDesc:'Sign out of this account securely.',password:'Password',changePassword:'Change password',installApp:'Install LifeDue',installAppDesc:'Use LifeDue like an app on your phone or desktop.',openOnboarding:'Review onboarding',signOut:'Sign out',settingsDesc:'Keep your account and preferences under control.',feedbackTitle:'Help us improve LifeDue',feedbackDesc:'Tell us what is working, what is confusing, or what you want next.',feedbackType:'What is this about?',feedbackTypeBug:'Bug or problem',feedbackTypeIdea:'Feature idea',feedbackTypeGeneral:'General feedback',feedbackTypeOther:'Other',feedbackMessage:'Your feedback',feedbackPlaceholder:'Tell us what happened or what you would like to see…',feedbackRating:'How is LifeDue feeling so far?',feedbackRatingGreat:'Great',feedbackRatingOkay:'Could be better',feedbackRatingPoor:'I am struggling',sendFeedback:'Send feedback',feedbackSent:'Thanks — your feedback was saved.',feedbackHint:'Your feedback helps us decide what to improve next.',feedbackFormHint:'Choose a topic, rate your experience, and tell us what would make LifeDue better.',feedbackSignIn:'Sign in to send feedback.',feedbackError:'We could not send your feedback. Please try again.',backToWork:'Back to work'},pt:{today:'Hoje',tasks:'Tarefas',clients:'Clientes',payments:'Pagamentos',planner:'Planejador IA',addTask:'Adicionar tarefa',freePlan:'Plano grátis',aiUsageLabel:'Uso da IA',aiUsesRemaining:'{n} usos de IA restantes este mês',aiLimitReachedNotice:'Você usou os 20 usos de IA deste mês.',aiLimitReachedTitle:'Você atingiu o limite gratuito de IA',aiLimitReachedDesc:'Você usou os 20 usos de IA deste mês. Entre na lista do Pro e avisaremos quando o Pro estiver disponível.',aiUsageExhausted:'Os seus créditos de IA acabaram neste mês.',aiUsageReset:'Os seus créditos de IA são renovados automaticamente no início de cada mês.',aiUsageShared:'Criar com IA e o Planejador IA partilham os mesmos 20 créditos de IA por mês.',proComingSoon:'O LifeDue Pro está a caminho',proComingSoonDesc:'Você já está na lista do Pro. Vamos avisar quando o Pro estiver disponível.',proLimitWaitlist:'Entrar na lista do Pro',proLimitEmail:'Email para novidades do Pro',proLimitSaved:'Você já está na lista do Pro. O Pro está a caminho.',workspace:'ÁREA DE CLIENTES',openApp:'Abrir app',builtFor:'Feito para trabalho com clientes',heroText:'Transforme seu trabalho com clientes em um plano diário simples. Adicione tarefas em linguagem natural e veja o que precisa da sua atenção hoje.',tryFree:'Experimentar grátis',noCard:'Sem cartão de crédito',quickAdd:'Adicionar rápido',todayFirst:'Hoje primeiro',paymentsText:'Mantenha os pagamentos pendentes visíveis.',quickAddText:'Descreva várias tarefas de clientes de uma vez.',todayText:'Veja imediatamente o que está atrasado e vence hoje.',pending:'pendente',aiQuick:'ADICIONAR COM IA',quickQuestion:'O que você precisa fazer?',createPlan:'Criar plano',plain:'Linguagem natural · sem configuração',yourPlan:'SEU PLANO',addAll:'Adicionar tudo',saveToLifeDue:'Guardar no LifeDue',overdue:'ATRASADO',upNext:'A seguir',organize:'Organizar meu plano',openPlanner:'Abrir Planejador IA',addPlanToLifeDue:'Adicionar ao LifeDue',currencySummary:'Resumo por moeda',nothing:'Nada vence hoje',breathing:'Aproveite o tempo livre ou adicione uma tarefa.',workQueue:'FILA DE TRABALHO',everything:'Tudo o que você precisa entregar.',completed:'Concluídas',all:'Todas',open:'Abertas',clientsIntro:'Mantenha visíveis as pessoas por trás do trabalho.',addClient:'Adicionar cliente',addClientTitle:'Adicionar cliente',clientName:'Nome do cliente',clientNamePlaceholder:'ex.: Maria',noClientName:'Digite o nome de um cliente.',moneyDue:'DINHEIRO A RECEBER',unpaid:'Não deixe trabalho concluído ficar sem pagamento.',clear:'Todos os pagamentos estão em dia',noPending:'Não há pagamentos de clientes pendentes.',paid:'Pago',markPaid:'Marcar como pago',aiPlanner:'PLANEJADOR IA',calmer:'Transforme sua lista em um dia mais tranquilo.',plannerDesc:'O LifeDue agrupa o trabalho aberto em um plano simples em vez de fazer você gerenciar uma lista enorme.',openItems:'itens abertos disputando sua atenção.',generateOrder:'Gere uma ordem sugerida para os próximos dias.',generatePlan:'Gerar plano',savePlan:'Guardar plano',plannerReady:'Plano pronto',plannerOpen:'tarefas abertas',plannerOverdue:'atrasadas',plannerToday:'vencem hoje',plannerUpcoming:'a seguir',plannerEmptyTitle:'Nenhum trabalho aberto para organizar',plannerEmptyDesc:'Adicione uma tarefa primeiro e o LifeDue vai organizá-la numa ordem prática.',plannerFallback:'A mostrar uma ordem local por data e prioridade. Entre na conta para usar a priorização por IA.',plannerAiReady:'Ordem sugerida pela IA pronta.',plannerLocalReady:'Ordem sugerida pronta.',plannerAiDesc:'Ordem baseada em prazos, prioridade e contexto das tarefas.',plannerLocalDesc:'Ordem baseada em prazos e prioridade. Entre na conta para usar a priorização por IA.',plannerHowItWorks:'Como funciona',plannerHowItWorksDesc:'O LifeDue organiza as tarefas abertas por prazo e prioridade. Com IA, o contexto da tarefa ajuda a desempatar.',plannerPlannerInfo:'O Planner apenas sugere uma ordem. Ele não altera suas tarefas.',addTaskToPlan:'Adicionar tarefa',viewTasks:'Ver tarefas',planEmpty:'Seu plano aparecerá aqui.',newTask:'NOVA TAREFA',task:'Tarefa',client:'Cliente',dueDate:'Data de entrega',noDueDate:'Sem prazo',priority:'Prioridade',cancel:'Cancelar',low:'Baixa',medium:'Média',high:'Alta',finishHomepage:'ex.: Finalizar página inicial',john:'ex.: João',complete:'Concluir tarefa',tomorrow:'Amanhã',due:'Vence',overdueDue:'Atrasado · vence',menu:'Abrir menu',foundItems:'O LifeDue encontrou {n} itens.',todayFocus:'Veja o que precisa da sua atenção.',todayGreetingMorning:'Bom dia. Vamos cuidar do que importa.',todayGreetingAfternoon:'Boa tarde. Vamos cuidar do que importa.',todayGreetingEvening:'Boa noite. Vamos cuidar do que importa.',focusTitle:'Foco de hoje',openWork:'Trabalho aberto',dueToday:'Vence hoje',urgent:'Urgente',toCollect:'A receber',allClearToday:'Tudo tranquilo por hoje',allClearDesc:'Nenhum trabalho atrasado ou pagamento precisa de atenção agora.',paymentAttention:'Cobranças a acompanhar',paymentAttentionDesc:'Dinheiro que ainda precisa entrar.',noPaymentAttention:'Nenhuma cobrança pendente para acompanhar.',upcomingWork:'Próximos trabalhos',upcomingDesc:'Trabalho depois de hoje, ordenado pela data de entrega.',noUpcoming:'Ainda não há nada agendado.',viewAllTasks:'Ver todas as tarefas',viewPayments:'Ver pagamentos',addTaskToday:'Adicionar tarefa',addPaymentToday:'Adicionar pagamento',markPaidToday:'Marcar como pago',tasksHeadline:'Tudo o que você precisa entregar.',tasksDescription:'Mantenha o trabalho visível, priorize o que importa e conclua tarefas à medida que avança.',taskSearch:'Pesquisar tarefas ou clientes',taskSummary:'taskSummary',taskProgress:'concluída',noTasks:'Nenhuma tarefa aqui',noTasksDesc:'Adicione uma tarefa ou altere o filtro para ver mais trabalho.',clearSearch:'Limpar pesquisa',dueSoon:'Próximas',overdueTasks:'Atrasadas',todayTasks:'Hoje',upcomingTasks:'A seguir',completedTasks:'Concluídas',priorityFilter:'Prioridade',allPriorities:'Todas as prioridades',clientsHeadline:'Uma visão clara do seu trabalho com clientes.',clientsDescription:'Veja com quem trabalha, quanto trabalho está aberto e o que ainda está pendente.',paymentsHeadline:'Mantenha cada pagamento em andamento.',paymentsDescription:'Acompanhe o dinheiro a receber por cliente, veja atrasados e marque pagamentos como concluídos.',paymentOverview:'Resumo dos pagamentos',paymentPendingCount:'Pendentes',paymentOverdueCount:'Atrasados',paymentPaidCount:'Pagos',paymentPendingAmount:'A receber',paymentSearch:'Pesquisar por cliente',paymentFilter:'Filtro',paymentAll:'Todos',paymentPending:'Pendentes',paymentOverdue:'Atrasados',paymentPaid:'Pagos',paymentDue:'Vence',paymentOverdueLabel:'Atrasado',paymentNoResults:'Nenhum pagamento corresponde a este filtro.',paymentNoResultsDesc:'Tente outro filtro ou adicione um pagamento.',paymentHistory:'Histórico de pagamentos',paymentTotal:'Total',currency:'Moeda',noCurrency:'Moeda não definida',usd:'USD',eur:'EUR',aoa:'AOA',newPayment:'Novo pagamento',addPaymentTitle:'Adicionar pagamento',amount:'Valor',addPayment:'Adicionar pagamento',addTaskTitle:'Adicionar tarefa',settings:'Definições',feedback:'Feedback',account:'Conta',preferences:'Preferências',appearance:'Aparência',theme:'Tema',themeSystem:'Padrão',themeLight:'Claro',themeDark:'Escuro',language:'Idioma',languageDesc:'Escolha o idioma usado em todo o LifeDue.',languageChoiceDesc:'Mude entre inglês e português.',upgrade:'Passar para Pro',upgradeTitle:'LifeDue Pro',upgradeDesc:'Tenha mais espaço para gerir trabalho com clientes e desbloqueie a próxima evolução do LifeDue.',proBenefits:'O que inclui',proBenefit1:'Limites maiores para tarefas e uso de IA',proBenefit2:'Planeamento e fluxos de trabalho com clientes mais avançados',proBenefit3:'Acesso prioritário às próximas funcionalidades Pro',notifyMe:'Avise-me quando o Pro estiver disponível',notifyEmail:'Email para novidades do Pro',notifyEmailPlaceholder:'voce@exemplo.com',joinWaitlist:'Entrar na lista',waitlistSuccess:'Está na lista. Vamos avisar quando o Pro estiver disponível.',waitlistError:'Não foi possível guardar o seu email. Tente novamente.',waitlistInvalidEmail:'Introduza um email válido.',waitlistAlready:'Este email já está na lista.',close:'Fechar',themeDesc:'Escolha a aparência ideal para si.',accountDesc:'A sua conta e o seu plano LifeDue.',email:'Email',plan:'Plano',freePlanDesc:'Plano grátis · sem pagamento necessário',security:'Segurança',securityDesc:'Saia desta conta de forma segura.',password:'Palavra-passe',changePassword:'Alterar palavra-passe',installApp:'Baixar LifeDue',installAppDesc:'Use o LifeDue como uma aplicação no telemóvel ou computador.',openOnboarding:'Ver onboarding novamente',signOut:'Sair',settingsDesc:'Mantenha a sua conta e preferências sob controlo.',feedbackTitle:'Ajude-nos a melhorar o LifeDue',feedbackDesc:'Diga-nos o que funciona, o que está confuso ou o que gostaria de ver a seguir.',feedbackType:'Sobre o quê?',feedbackTypeBug:'Bug ou problema',feedbackTypeIdea:'Sugestão de funcionalidade',feedbackTypeGeneral:'Feedback geral',feedbackTypeOther:'Outro',feedbackMessage:'O seu feedback',feedbackPlaceholder:'Conte-nos o que aconteceu ou o que gostaria de ver…',feedbackRating:'Como está a ser usar o LifeDue?',feedbackRatingGreat:'Muito bom',feedbackRatingOkay:'Pode melhorar',feedbackRatingPoor:'Estou com dificuldades',sendFeedback:'Enviar feedback',feedbackSent:'Obrigado — o seu feedback foi guardado.',feedbackHint:'O seu feedback ajuda-nos a decidir o que melhorar a seguir.',feedbackFormHint:'Escolha um tema, avalie a sua experiência e diga-nos como podemos melhorar o LifeDue.',feedbackSignIn:'Entre na conta para enviar feedback.',feedbackError:'Não foi possível enviar o seu feedback. Tente novamente.',backToWork:'Voltar ao trabalho'}}
let currentLanguage:Language='en'
const tr=(key:keyof typeof trMap.en)=>trMap[currentLanguage][key]

const currentTodayKey = () => iso(new Date())

const iso = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const addDays = (days: number) => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
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

const paymentKey = (payment: Pick<Payment, 'client' | 'amount' | 'dueDate'> & { currency?: string | null }) =>
  `${payment.client.trim().toLowerCase()}|${payment.amount}|${payment.dueDate}|${payment.currency ?? ''}`

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

const extractCompanionTask = (input: string, payment: QuickAddItem): (QuickAddItem & { dueDateProvided: boolean; priorityProvided: boolean }) | null => {
  const workVerb = /\b(entregar|enviar|criar|terminar|concluir|fazer|preparar|desenvolver|corrigir|revisar|publicar|configurar|instalar|atualizar|apresentar|montar|produzir|editar)\b/i
  if (!workVerb.test(input)) return null
  const firstClause = input.split(/[,.!?;]+/)[0].trim()
  if (!workVerb.test(firstClause)) return null
  let title = firstClause
  if (payment.client) {
    const lowerTitle = title.toLocaleLowerCase()
    const lowerClient = payment.client.toLocaleLowerCase()
    for (const connector of [' do ', ' da ', ' de ', ' para o ', ' para a ', ' para ']) {
      const start = lowerTitle.indexOf(connector + lowerClient)
      if (start >= 0) {
        title = title.slice(0, start).trim()
        break
      }
    }
  }
  title = title.replace(/\b(?:hoje|amanhã|ontem|today|tomorrow|sexta(?:-feira)?|segunda(?:-feira)?|terça(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sábado|domingo|friday|monday|tuesday|wednesday|thursday|saturday|sunday)\b/gi, '').replace(/\s+/g, ' ').trim()
  if (!title || !workVerb.test(title)) return null
  return { kind: 'task', title, client: payment.client, dueDate: payment.dueDate, dueDateProvided: payment.dueDateProvided !== false, priority: payment.priority, priorityProvided: payment.priorityProvided === true }
}

function localizeAiTitle(title: string, _kind: QuickAddItem['kind']) {
  // The AI is already instructed to return titles in the user's language.
  // Do not rewrite task titles from keywords: that can silently change the user's action
  // (for example, "Criar website" must never become "Entregar site").
  return title.trim()
}

function formatMoney(amount: number, currency: string | null, locale = currentLanguage === 'pt' ? 'pt-PT' : 'en-US') {
  if (!currency) return String(amount.toLocaleString(locale)) + ' · ' + tr('noCurrency')
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
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(() => (localStorage.getItem('lifedue-theme') as 'system' | 'light' | 'dark') || 'system')
  const [feedbackType, setFeedbackType] = useState<'bug' | 'idea' | 'general' | 'other'>('general')
  const [feedbackRating, setFeedbackRating] = useState<'great' | 'okay' | 'poor' | ''>('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [feedbackSaving, setFeedbackSaving] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [proLimitReached, setProLimitReached] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistSaving, setWaitlistSaving] = useState(false)
  const [waitlistSent, setWaitlistSent] = useState(false)
  const [waitlistError, setWaitlistError] = useState('')
  const [aiUsage, setAiUsage] = useState<AiUsage>({ used: 0, limit: 20, remaining: 20 })
  useEffect(() => {
    localStorage.setItem('lifedue-theme', theme)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches)
      document.documentElement.dataset.theme = theme
      document.documentElement.classList.toggle('theme-dark', isDark)
    }
    applyTheme()
    if (theme === 'system') {
      media.addEventListener?.('change', applyTheme)
      return () => media.removeEventListener?.('change', applyTheme)
    }
  }, [theme])
  const [view, setView] = useState<View>('home')
  const [tasks, setTasks] = useState<Task[]>(() => uniqueTasks(load('lifedue-tasks', [])))
  const [clients, setClients] = useState<Client[]>(() => load('lifedue-clients', []))
  const [payments, setPayments] = useState<Payment[]>(() => uniquePayments(load('lifedue-payments', [])))
  const [quickText, setQuickText] = useState('')
  const [plan, setPlan] = useState<Task[]>([])
  const [planSource, setPlanSource] = useState<'quick-add' | 'planner' | null>(null)
  const [planPayments, setPlanPayments] = useState<QuickAddItem[]>([])
  const [planReviewOpen, setPlanReviewOpen] = useState(false)
  const [planReviewConfirmed, setPlanReviewConfirmed] = useState(false)
  const [plannerError, setPlannerError] = useState('')
  const [plannerSource, setPlannerSource] = useState<'ai' | 'local' | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const quickAddRequestId = useRef(0)
  const plannerRequestId = useRef(0)
  const [showAdd, setShowAdd] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [taskDraftClient, setTaskDraftClient] = useState('')
  const [paymentDraftClient, setPaymentDraftClient] = useState('')
  const [nextStep, setNextStep] = useState<{ type: 'payment' | 'task'; client: string } | null>(null)
  const suppressNextStepRef = useRef(false)
  const taskUpdateInFlightRef = useRef(new Set<string>())
  const persistingPlanRef = useRef(false)
  const [showAddClient, setShowAddClient] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login')
  const passwordRecoveryRef = useRef(false)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState('')
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientsError, setClientsError] = useState('')
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentsError, setPaymentsError] = useState('')
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [pendingSaveAfterAuth, setPendingSaveAfterAuth] = useState(false)
  const [pendingOnboardingSkip, setPendingOnboardingSkip] = useState(false)
  const pendingOnboardingSkipRef = useRef(false)
  const [pendingOnboardingPaymentAfterAuth, setPendingOnboardingPaymentAfterAuth] = useState(false)
  const pendingOnboardingPaymentAfterAuthRef = useRef(false)
  const authDraftKey = 'lifedue-auth-draft-v1'

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        if (pendingOnboardingSkipRef.current) setView('home')
        else setView('quick-add')
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') {
        passwordRecoveryRef.current = true
        setAuthMode('reset')
        setAuthOpen(true)
        return
      }
      if (session?.user) {
        if (passwordRecoveryRef.current) return
        setAuthOpen(false)
        if (pendingOnboardingPaymentAfterAuthRef.current) {
          return
        }
        if (pendingOnboardingSkipRef.current) {
          pendingOnboardingSkipRef.current = false
          setPendingOnboardingSkip(false)
          setView('home')
        } else {
          setView('quick-add')
        }
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user || !supabase) {
      setAiUsage({ used: 0, limit: 20, remaining: 20 })
      setWaitlistEmail('')
      setWaitlistSent(false)
      return
    }

    let cancelled = false
    const periodStart = new Date().toISOString().slice(0, 7) + '-01'

    Promise.all([
      supabase.rpc('get_ai_usage', {
        p_user_id: user.id,
        p_period_start: periodStart,
        p_limit: 20,
      }),
      supabase
        .from('pro_waitlist')
        .select('email')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]).then(([usageResult, waitlistResult]) => {
      if (cancelled) return
      if (!usageResult.error) {
        const usageRow = Array.isArray(usageResult.data) ? usageResult.data[0] : usageResult.data
        const rawUsed = Number(usageRow?.used ?? 0)
        const used = Math.min(Math.max(Number.isFinite(rawUsed) ? rawUsed : 0, 0), 20)
        setAiUsage({
          used,
          limit: 20,
          remaining: Math.max(20 - used, 0),
        })
      }
      if (!waitlistResult.error) {
        const email = typeof waitlistResult.data?.email === 'string' ? waitlistResult.data.email : ''
        setWaitlistEmail(email)
        setWaitlistSent(Boolean(email))
      }
    }).catch(error => {
      console.error('LifeDue account limits load failed:', error)
    })

    return () => { cancelled = true }
  }, [user])

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
  const overdue = openTasks.filter(t => t.dueDateProvided !== false && t.dueDate < currentTodayKey())
  const todayTasks = openTasks.filter(t => t.dueDateProvided !== false && t.dueDate === currentTodayKey())
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
    if (taskUpdateInFlightRef.current.has(id)) return
    const currentTask = tasks.find(task => task.id === id)
    if (!currentTask) return

    const nextStatus = currentTask.status === 'open' ? 'completed' : 'open'
    taskUpdateInFlightRef.current.add(id)
    setUpdatingTaskId(id)
    setTasksError('')

    // Optimistic UI: the checkbox responds immediately, while the same task
    // is locked so a double click cannot create a second state transition.
    setTasks(current => current.map(task => task.id === id ? { ...task, status: nextStatus } : task))

    if (user && supabase) {
      try {
        const persisted = await updateTaskStatus(user, id, nextStatus)
        // Apply the exact server-confirmed state before refreshing the list.
        setTasks(current => current.map(task => task.id === id ? { ...task, status: persisted.status } : task))
        const refreshed = await fetchTasks(user)
        setTasks(refreshed)
      } catch (error) {
        console.error('LifeDue task update failed:', error)
        setTasks(current => current.map(task => task.id === id ? currentTask : task))
        setTasksError(currentLanguage === 'pt'
          ? 'Não foi possível guardar esta tarefa. Tente novamente.'
          : 'Could not save this task. Please try again.')
      } finally {
        taskUpdateInFlightRef.current.delete(id)
        setUpdatingTaskId(current => current === id ? null : current)
      }
      return
    }

    taskUpdateInFlightRef.current.delete(id)
    setUpdatingTaskId(current => current === id ? null : current)
  }

  const applyAiUsage = (value: unknown) => {
    const raw = value as { used?: unknown; limit?: unknown; remaining?: unknown } | null
    const limit = 20
    const usedValue = Number(raw?.used ?? 0)
    const used = Math.min(Math.max(Number.isFinite(usedValue) ? usedValue : 0, 0), limit)
    const remainingValue = Number(raw?.remaining ?? (limit - used))
    const remaining = Math.min(Math.max(Number.isFinite(remainingValue) ? remainingValue : limit - used, 0), limit)
    setAiUsage({ used, limit, remaining })
  }

  const createPlan = async () => {
    const input = quickText.trim()
    if (!input) {
      setPlan([])
      setPlanPayments([])
      setAiError(currentLanguage === 'pt' ? 'Escreva pelo menos uma tarefa ou pagamento para criar um plano.' : 'Describe at least one task or payment to create a plan.')
      return
    }

    const requestId = ++quickAddRequestId.current
    setAiLoading(true)
    setAiError('')

    try {
      if (!supabase) throw new Error('Supabase is not configured.')

      const { data, error } = await supabase.functions.invoke('quick-add', {
        body: {
          text: input,
          today: currentTodayKey(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language,
        },
      })

      if (error) {
        let detail = ''
        let code = ''
        try {
          const response = (error as FunctionsHttpError & { context?: Response }).context
          if (response) {
            const body = await response.clone().json()
            code = typeof body?.code === 'string' ? body.code : ''
            detail = typeof body?.detail === 'string'
              ? body.detail
              : typeof body?.message === 'string'
                ? body.message
                : ''
            if (body?.aiUsage && typeof body.aiUsage === 'object') applyAiUsage(body.aiUsage)
          }
        } catch {}
        if (code === 'AI_LIMIT_REACHED') {
          setAiError(currentLanguage === 'pt'
            ? 'Os seus créditos de IA acabaram. Eles serão renovados no próximo mês.'
            : 'Your AI credits are used up. They will reset next month.')
          setProLimitReached(true)
          setUpgradeOpen(true)
          return
        }
        console.error('LifeDue AI Quick Add failed:', error, detail)
        throw new Error(detail || error.message)
      }

      if (data?.aiUsage) {
        const nextAiUsage = {
          used: Number(data.aiUsage.used ?? aiUsage.used),
          limit: Number(data.aiUsage.limit ?? 20),
          remaining: Number(data.aiUsage.remaining ?? aiUsage.remaining),
        }
        applyAiUsage(nextAiUsage)
      }

      const items = Array.isArray(data?.items) ? data.items as QuickAddItem[] : []
      if (requestId !== quickAddRequestId.current) return

      if (!items.length) {
        setAiError(typeof data?.message === 'string' ? data.message : (currentLanguage === 'pt'
          ? 'Não encontrei nenhuma tarefa ou cobrança clara. Escreva uma ação concreta.'
          : 'I could not find a clear task or payment. Describe one concrete action.'))
        return
      }

      const clientNames = Array.from(input.matchAll(/(?:do|da|de|from|for|para o|para a|para|pra o|pra a|pra)\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][\p{L}'-]*)/gu)).map(match => match[1])
      const normalizedName = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      const isMissingClient = (value: string) => {
        const normalized = normalizedName(value.trim())
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
      const exactClient = (value: string) => {
        const trimmed = value.trim()
        if (isMissingClient(trimmed)) return ''
        const normalized = normalizedName(trimmed)
        const missingSuffixes = [
          ' · cliente nao definido',
          ' · cliente nao informado',
          ' · sem cliente',
          ' · client not set',
          ' · no client',
          ' · no client defined',
        ]
        const cleaned = missingSuffixes.reduce((current, suffix) => current.endsWith(suffix) ? current.slice(0, -suffix.length).trim() : current, normalized)
        if (cleaned !== normalized && missingSuffixes.some(suffix => normalized.endsWith(suffix))) return ''
        const match = clientNames.find(name => normalizedName(name) === normalized)
        if (match) return match
        if (normalized === 'john') {
          const joao = clientNames.find(name => normalizedName(name) === 'joao')
          if (joao) return joao
        }
        return trimmed
      }

      setPlan([])
      setPlanSource(null)
      setPlanPayments([])

      const normalizedItems = items.map(item => ({
        ...item,
        dueDateProvided: item.dueDateProvided === true,
        priorityProvided: item.priorityProvided === true,
        client: exactClient(item.client),
        title: currentLanguage === 'pt' ? localizeAiTitle(item.title, item.kind) : item.title,
      }))

      const normalizedPayment = normalizedItems.find(item => item.kind === 'payment' && item.amount !== null && item.amount !== undefined)
      if (normalizedPayment && !normalizedItems.some(item => item.kind === 'task')) {
        const companionTask = extractCompanionTask(input, normalizedPayment)
        if (companionTask) normalizedItems.unshift(companionTask)
      }

      setPlanSource('quick-add')
      setPlan(normalizedItems.map(item => ({
        id: crypto.randomUUID(),
        title: item.kind === 'payment'
          ? (currentLanguage === 'pt' ? 'Cobrar pagamento' : 'Follow up payment')
          : item.title,
        client: item.client,
        dueDate: item.dueDate,
        dueDateProvided: item.dueDateProvided === true,
        priority: item.priority,
        priorityProvided: item.priorityProvided === true,
        status: 'open',
      })))
      setPlanPayments(normalizedItems.filter(item => item.kind === 'payment'))
      setView(view === 'onboarding' ? 'onboarding' : 'quick-add')
    } catch (error) {
      if (requestId !== quickAddRequestId.current) return
      console.error('LifeDue AI Quick Add failed:', error)

      const message = error instanceof Error ? error.message : ''
      const normalized = message.toLowerCase()
      const configurationError = normalized.includes('gemini_api_key') || normalized.includes('not configured')
      const rateLimitError = normalized.includes('429') || normalized.includes('quota') || normalized.includes('rate limit')
      const providerError = normalized.includes('gemini 4') || normalized.includes('gemini 5') || normalized.includes('gemini 503') || normalized.includes('gemini 502') || normalized.includes('gemini 500')

      setAiError(
        currentLanguage === 'pt'
          ? configurationError
            ? 'A IA ainda não foi configurada no servidor. Adicione a GEMINI_API_KEY no Supabase e publique a função quick-add.'
            : rateLimitError
              ? 'A IA atingiu o limite temporário. Aguarde alguns segundos e tente novamente.'
              : providerError
                ? 'O serviço de IA está temporariamente indisponível. Tente novamente em alguns segundos.'
                : 'Não foi possível criar seu plano agora. Tente novamente.'
          : configurationError
            ? 'AI is not configured on the server yet. Add GEMINI_API_KEY in Supabase and deploy the quick-add function.'
            : rateLimitError
              ? 'AI hit a temporary rate limit. Wait a few seconds and try again.'
              : providerError
                ? 'The AI service is temporarily unavailable. Try again in a few seconds.'
                : 'We could not create your plan right now. Please try again.'
      )
    } finally {
      if (requestId === quickAddRequestId.current) setAiLoading(false)
    }
  }

  const skipOnboarding = () => {
    if (user) {
      setView('home')
      return
    }
    pendingOnboardingSkipRef.current = true
    setPendingOnboardingSkip(true)
    setAuthMode('signup')
    setAuthOpen(true)
  }

  const addOnboardingPayment = () => {
    if (user) {
      setPaymentDraftClient(plan[0]?.client ?? '')
      setShowAddPayment(true)
      return
    }
    saveAuthDraft()
    pendingOnboardingPaymentAfterAuthRef.current = true
    setPendingOnboardingPaymentAfterAuth(true)
    setPendingSaveAfterAuth(true)
    setAuthMode('signup')
    setAuthOpen(true)
  }

  const saveAuthDraft = () => {
    if (!plan.length) return
    localStorage.setItem(authDraftKey, JSON.stringify({ plan, planPayments, quickText, savedAt: Date.now() }))
  }

  const restoreAuthDraft = () => {
    try {
      const raw = localStorage.getItem(authDraftKey)
      if (!raw) return false
      const draft = JSON.parse(raw) as { plan?: Task[]; planPayments?: QuickAddItem[]; quickText?: string }
      if (!Array.isArray(draft.plan) || draft.plan.length === 0) return false
      setPlan(draft.plan)
      setPlanPayments(Array.isArray(draft.planPayments) ? draft.planPayments : [])
      setQuickText(typeof draft.quickText === 'string' ? draft.quickText : '')
      return true
    } catch {
      localStorage.removeItem(authDraftKey)
      return false
    }
  }

  const clearAuthDraft = () => localStorage.removeItem(authDraftKey)

  const persistPlan = async () => {
    if (!plan.length || persistingPlanRef.current) return
    if (!user) {
      saveAuthDraft()
      setPendingSaveAfterAuth(true)
      setAuthMode('signup')
      setAuthOpen(true)
      return
    }

    persistingPlanRef.current = true
    try {
      setTasksError('')
    setPaymentsError('')

    // AI plans now use the exact same persistence path as the manual
    // "Add task" / "Add payment" actions. This keeps both flows identical.
    const taskPlan = plan.filter(task =>
      !planPayments.some(payment =>
        payment.client.trim().toLowerCase() === task.client.trim().toLowerCase() &&
        payment.dueDate === task.dueDate &&
        payment.amount !== null &&
        payment.amount !== undefined &&
        /payment|pagamento|collect|cobrar|receber/i.test(task.title)
      )
    )

    const paymentsToSave = planPayments.filter(item =>
      item.amount !== null &&
      item.amount !== undefined
    )

    let tasksSaved = taskPlan.length === 0
    let paymentsSaved = paymentsToSave.length === 0

    // Suppress the manual-flow "next step" cards while saving the whole AI plan.
    suppressNextStepRef.current = true

    for (const task of taskPlan) {
      try {
        await addTask({
          title: task.title,
          client: task.client,
          dueDate: task.dueDate,
          dueDateProvided: task.dueDateProvided !== false,
          priority: task.priority,
        })
        tasksSaved = true
      } catch (error) {
        console.error('LifeDue AI task save failed:', error)
        setTasksError(currentLanguage === 'pt'
          ? 'A tarefa não foi guardada. Tente novamente.'
          : 'The task was not saved. Please try again.')
        tasksSaved = false
      }
    }

    for (const payment of paymentsToSave) {
      try {
        await addPayment({
          client: payment.client,
          amount: payment.amount as number,
          currency: payment.currency ?? null,
          dueDate: payment.dueDate,
          dueDateProvided: payment.dueDateProvided !== false,
        })
        paymentsSaved = true
      } catch (error) {
        console.error('LifeDue AI payment save failed:', error)
        setPaymentsError(currentLanguage === 'pt'
          ? 'O pagamento não foi guardado. Tente novamente.'
          : 'The payment was not saved. Please try again.')
        paymentsSaved = false
      }
    }

    suppressNextStepRef.current = false

    try {
      setClients(await fetchClients(user))
    } catch (error) {
      console.error('LifeDue AI client refresh failed:', error)
    }

    if (tasksSaved || paymentsSaved) {
      // AI-generated plans are complete when this review is saved. Optional
      // payments are handled inside PlanReview, so do not open a separate
      // post-save payment prompt here.
      setNextStep(null)

      clearAuthDraft()
      setPlan([])
      setPlanPayments([])
      setQuickText('')
      if (pendingOnboardingPaymentAfterAuthRef.current) {
        pendingOnboardingPaymentAfterAuthRef.current = false
        setPendingOnboardingPaymentAfterAuth(false)
        setPaymentDraftClient(taskPlan[0]?.client ?? paymentsToSave[0]?.client ?? '')
        setShowAddPayment(true)
      }
      setView('tasks')
      } else {
        setTasksError(currentLanguage === 'pt'
          ? 'Nada foi guardado. Tente novamente.'
          : 'Nothing was saved. Please try again.')
      }
    } finally {
    persistingPlanRef.current = false
  }
  }

  useEffect(() => {
    if (!user) return
    const hasDraft = restoreAuthDraft()
    if (hasDraft) setPendingSaveAfterAuth(true)
  }, [user])

  useEffect(() => {
    if (!user || !pendingSaveAfterAuth || !plan.length) return
    setPendingSaveAfterAuth(false)
    setPlanReviewConfirmed(false)
    setPlanReviewOpen(true)
  }, [user, pendingSaveAfterAuth, plan.length])

  const planReviewItems = () => {
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
    const isMissingClient = (value: string) => {
      const normalized = normalize(value.trim())
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
    const items: Array<{ key: string; label: string; originalName?: string; existingName?: string }> = []
    const seenClients = new Set<string>()

    for (const task of plan) {
      const clientName = task.client.trim()
      if (isMissingClient(clientName)) continue
      const normalized = normalize(clientName)
      if (seenClients.has(normalized)) continue
      seenClients.add(normalized)
      items.push({
        key: 'client:' + normalized,
        label: clientName,
        originalName: clientName,
        existingName: clients.find(client => normalize(client.name.trim()) === normalized)?.name,
      })
    }

    planPayments.forEach(payment => {
      const clientName = payment.client.trim()
      if (isMissingClient(clientName)) return
      const normalized = normalize(clientName)
      if (seenClients.has(normalized)) return
      seenClients.add(normalized)
      items.push({
        key: 'client:' + normalized,
        label: clientName,
        originalName: clientName,
        existingName: clients.find(client => normalize(client.name.trim()) === normalized)?.name,
      })
    })

    return items
  }

  const planReviewDetails = () => {
    const normalize = (value: string) => value.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLocaleLowerCase().trim()
    const missingClient = (value: string) => {
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

    const details: Array<{
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
      currency?: QuickAddItem['currency'] | null
      clientName?: string
      paymentAlreadyIncluded?: boolean
      paymentDueDate?: string
    }> = []

    for (const task of plan) {
      const clientMissing = missingClient(task.client)
      const dueDateMissing = task.dueDateProvided !== true
      const priorityMissing = task.priorityProvided !== true
      const matchedPayment = !clientMissing
        ? planPayments.find(payment =>
          payment.client.trim().toLocaleLowerCase() === task.client.trim().toLocaleLowerCase()
        )
        : undefined

      // Client-linked tasks stay in Review so the user can confirm or edit
      // the complete AI result, including an optional payment.
      if (clientMissing && !dueDateMissing && !priorityMissing && !matchedPayment) continue

      details.push({
        key: 'task:' + task.id,
        title: task.title.trim() || (currentLanguage === 'pt' ? 'Tarefa sem título' : 'Untitled task'),
        kind: 'task',
        clientMissing,
        dueDateMissing,
        dueDate: task.dueDateProvided === true ? task.dueDate : undefined,
        priorityMissing,
        priority: task.priority,
        clientName: clientMissing ? undefined : task.client.trim(),
        paymentAlreadyIncluded: Boolean(matchedPayment),
        paymentDueDate: matchedPayment?.dueDateProvided !== false ? matchedPayment?.dueDate : undefined,
        amountMissing: false,
        amount: matchedPayment?.amount ?? undefined,
        currencyMissing: false,
        currency: matchedPayment?.currency ?? null,
      })
    }

    planPayments.forEach((payment, index) => {
      const clientMissing = missingClient(payment.client)
      const dueDateMissing = payment.dueDateProvided !== true
      const amountMissing = payment.amount === null || payment.amount === undefined
      const currencyMissing = payment.currency === null || payment.currency === undefined

      // Payments belonging to an AI task are reviewed inside that task card.
      // Never render the same payment again as a separate detail card.
      const linkedToTask = !clientMissing && plan.some(task =>
        !missingClient(task.client) &&
        task.client.trim().toLocaleLowerCase() === payment.client.trim().toLocaleLowerCase()
      )
      if (linkedToTask) return
      if (!clientMissing && !dueDateMissing && !amountMissing && !currencyMissing) return

      details.push({
        key: 'payment:' + index,
        title: currentLanguage === 'pt'
          ? 'Cobrança' + (clientMissing ? '' : ' · ' + payment.client.trim())
          : 'Payment' + (clientMissing ? '' : ' · ' + payment.client.trim()),
        kind: 'payment',
        clientMissing,
        dueDateMissing,
        dueDate: payment.dueDateProvided === true ? payment.dueDate : undefined,
        priorityMissing: false,
        amountMissing,
        amount: payment.amount,
        currencyMissing,
        currency: payment.currency ?? null,
      })
    })

    return details
  }

  const addPlan = () => {
    if (!plan.length) return

    // Every AI-generated plan must pass through the review step before persistence.
    // Do not condition this on the number of review items: a plan can still need
    // confirmation even when the current client list is empty.
    if (!planReviewConfirmed) {
      setPlanReviewOpen(true)
      return
    }

    void persistPlan()
  }

  const confirmPlanReview = (
    decisions: Record<string, string>,
    detailDecisions: Record<string, { client?: string; dueDate?: string; priority?: Priority; amount?: number; currency?: QuickAddItem['currency'] | null; paymentEnabled?: boolean; paymentDueDate?: string }>
  ) => {
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
    const nextPlan = plan.map(task => {
      const details = detailDecisions['task:' + task.id] ?? {}
      return {
        ...task,
        client: details.client !== undefined
          ? details.client.trim()
          : (task.client.trim()
            ? (decisions['client:' + normalize(task.client)] ?? task.client)
            : task.client),
        dueDate: details.dueDate ?? task.dueDate,
        dueDateProvided: details.dueDate ? true : task.dueDateProvided,
        priority: details.priority ?? task.priority,
        priorityProvided: details.priority ? true : task.priorityProvided,
      }
    })
    const nextPayments = planPayments.flatMap((payment, index) => {
      const details = detailDecisions['payment:' + index] ?? {}
      const paymentClient = payment.client.trim()
      const relatedTask = plan.find(task =>
        paymentClient &&
        task.client.trim().toLocaleLowerCase() === paymentClient.toLocaleLowerCase()
      )
      const relatedTaskDetails = relatedTask ? detailDecisions['task:' + relatedTask.id] ?? {} : {}
      const relatedNextTask = relatedTask
        ? nextPlan.find(task => task.id === relatedTask.id)
        : undefined

      // A payment that originated from a task card is controlled by that card.
      // This lets the user edit or remove an AI-detected payment without
      // creating a second payment record.
      if (relatedTask && relatedTaskDetails.paymentEnabled === false && relatedTaskDetails.amount !== undefined) {
        return []
      }

      return [{
        ...payment,
        client: relatedNextTask?.client?.trim()
          || (details.client !== undefined
            ? details.client.trim()
            : (payment.client.trim()
              ? (decisions['client:' + normalize(payment.client)] ?? payment.client)
              : payment.client)),
        dueDate: relatedTaskDetails.paymentEnabled
          ? (relatedTaskDetails.paymentDueDate || payment.dueDate)
          : (details.dueDate ?? payment.dueDate),
        dueDateProvided: relatedTaskDetails.paymentEnabled
          ? Boolean(relatedTaskDetails.paymentDueDate || payment.dueDateProvided)
          : (details.dueDate ? true : payment.dueDateProvided),
        amount: relatedTaskDetails.paymentEnabled && relatedTaskDetails.amount !== undefined
          ? relatedTaskDetails.amount
          : (details.amount ?? payment.amount),
        currency: relatedTaskDetails.paymentEnabled && relatedTaskDetails.currency !== undefined
          ? (relatedTaskDetails.currency ?? undefined)
          : (details.currency !== undefined ? (details.currency ?? undefined) : (payment.currency ?? undefined)),
      }]
    })

    const inlinePayments = nextPlan.flatMap(task => {
      const detail = detailDecisions['task:' + task.id] ?? {}
      if (!detail.paymentEnabled || !detail.amount || !detail.currency) return []
      const client = (detail.client?.trim() || task.client.trim())
      if (!client) return []

      const dueDate = detail.paymentDueDate || (task.dueDateProvided !== false ? task.dueDate : currentTodayKey())
      return [{
        kind: 'payment' as const,
        title: currentLanguage === 'pt' ? 'Cobrança · ' + client : 'Payment · ' + client,
        client,
        dueDate,
        dueDateProvided: true,
        priority: 'medium' as Priority,
        priorityProvided: true,
        amount: detail.amount,
        currency: detail.currency,
      }]
    })

    // AI payments are edited in-place when their related task is reviewed.
    const dedupedPayments = [...nextPayments, ...inlinePayments].filter((payment, index, all) => {
      const key = payment.client.trim().toLocaleLowerCase() + '|' + payment.amount + '|' + payment.dueDate + '|' + (payment.currency ?? '')
      return all.findIndex(candidate =>
        candidate.client.trim().toLocaleLowerCase() + '|' + candidate.amount + '|' + candidate.dueDate + '|' + (candidate.currency ?? '') === key
      ) === index
    })

    setPlan(nextPlan)
    setPlanPayments(dedupedPayments)
    setPlanReviewOpen(false)
    setPlanReviewConfirmed(true)
  }

  useEffect(() => {
    if (!planReviewConfirmed || !plan.length) return
    setPlanReviewConfirmed(false)
    void persistPlan()
  }, [planReviewConfirmed, plan.length])

  const addTask = async (task: Omit<Task, 'id' | 'status'>) => {
    if (!isValidDueDate(task.dueDate)) {
      const message = currentLanguage === 'pt' ? 'A data de entrega deve ser hoje ou uma data futura válida.' : 'The due date must be today or a valid future date.'
      setTasksError(message)
      throw new Error(message)
    }
    setTasksError('')
    try {
      if (user && supabase) {
        const created = await createTasks(user, [{ ...task, status: 'open' }])
        setTasks(current => [...created, ...current])
      } else {
        const next = { ...task, id: crypto.randomUUID(), status: 'open' as const }
        setTasks(current => [next, ...current])
        if (task.client.trim() && !clients.some(c => c.name.toLowerCase() === task.client.toLowerCase())) {
          setClients(current => [...current, { id: crypto.randomUUID(), name: task.client }])
        }
      }
      setShowAdd(false)
      if (suppressNextStepRef.current) suppressNextStepRef.current = false
      else setNextStep({ type: 'payment', client: task.client })
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
        if (suppressNextStepRef.current) suppressNextStepRef.current = false
        else setNextStep({ type: 'task', client: payment.client })
      } catch (error) {
        console.error('LifeDue payment creation failed:', error)
        setPaymentsError(currentLanguage === 'pt' ? 'Não foi possível adicionar o pagamento.' : 'Could not add the payment.')
      }
    } else {
      setPayments(current => [{ ...payment, id: crypto.randomUUID(), status: 'pending' }, ...current])
      setShowAddPayment(false)
      if (suppressNextStepRef.current) suppressNextStepRef.current = false
      else setNextStep({ type: 'task', client: payment.client })
    }
  }

  const submitFeedback = async () => {
    const message = feedbackMessage.trim()
    if (!message || feedbackSaving) return
    if (!user || !supabase) {
      setFeedbackError(tr('feedbackSignIn'))
      return
    }

    setFeedbackSaving(true)
    setFeedbackError('')
    setFeedbackSent(false)

    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        email: user.email ?? null,
        type: feedbackType,
        rating: feedbackRating || null,
        message,
      })

      if (error) throw error

      setFeedbackSent(true)
      setFeedbackMessage('')
    } catch (error) {
      console.error('LifeDue feedback submission failed:', error)
      setFeedbackError(tr('feedbackError'))
    } finally {
      setFeedbackSaving(false)
    }
  }

  const joinProWaitlist = async () => {
    const email = (waitlistEmail || user?.email || '').trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setWaitlistError(tr('waitlistInvalidEmail'))
      return
    }
    if (!user || !supabase || waitlistSaving) {
      if (!user || !supabase) setWaitlistError(currentLanguage === 'pt' ? 'Entre na sua conta para entrar na lista.' : 'Sign in to join the waitlist.')
      return
    }

    setWaitlistSaving(true)
    setWaitlistError('')
    try {
      const { data: existing, error: lookupError } = await supabase
        .from('pro_waitlist')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (lookupError) throw lookupError
      if (existing) {
        setWaitlistSent(true)
        return
      }

      const { error } = await supabase.from('pro_waitlist').insert({ user_id: user.id, email })
      if (error) {
        if (error.code === '23505') {
          setWaitlistSent(true)
          return
        }
        throw error
      }
      setWaitlistEmail(email)
      setWaitlistSent(true)
    } catch (error) {
      console.error('LifeDue Pro waitlist failed:', error)
      setWaitlistError(tr('waitlistError'))
    } finally {
      setWaitlistSaving(false)
    }
  }

  const resolvedTheme = theme === 'system' ? 'system' : theme

  return (
    <div className="app-shell" data-theme={resolvedTheme}>
      {view === 'home' ? (
        <Landing onStart={() => navigate('onboarding')} onAuth={() => { setAuthMode('login'); setAuthOpen(true) }} onOpenApp={() => navigate('quick-add')} language={language} setLanguage={setLanguage} user={user} />
      ) : view === 'onboarding' ? (
        <OnboardingView quickText={quickText} onQuickTextChange={value => { setQuickText(value); if (aiError) setAiError('') }} onCreatePlan={() => void createPlan()} plan={plan} planSource={planSource} planPayments={planPayments} onAddPlan={addPlan} onAddPayment={addOnboardingPayment} onUpdatePlanTask={(id, patch) => setPlan(current => current.map(task => task.id === id ? { ...task, ...patch } : task))} onUpdatePlanPayment={(index, patch) => setPlanPayments(current => current.map((payment, itemIndex) => itemIndex === index ? { ...payment, ...patch } : payment))} onSkip={skipOnboarding} aiLoading={aiLoading} aiError={aiError} user={user} onBack={() => navigate('home')} language={language} />
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
              <button className="sidebar-add" onClick={() => setShowAdd(true)}><Plus size={17} /> {tr('addTask')}</button>
              <div className="sidebar-secondary-nav">
                <button className={view === 'feedback' ? 'sidebar-secondary active' : 'sidebar-secondary'} onClick={() => navigate('feedback')}><MessageSquareText size={16} /> {tr('feedback')}</button>
                <button className={view === 'settings' ? 'sidebar-secondary active' : 'sidebar-secondary'} onClick={() => navigate('settings')}><Settings size={16} /> {tr('settings')}</button>
              </div>
              <div className="free-badge">{tr('freePlan')}</div>
            </div>
          </aside>

          {upgradeOpen && <div className="upgrade-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setUpgradeOpen(false) }}>
            <section className="upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
              <button className="upgrade-close" type="button" onClick={() => setUpgradeOpen(false)} aria-label={tr('close')}>×</button>
              <div className="upgrade-icon"><Sparkles size={22} /></div>
              <p className="section-kicker">{tr('upgrade')}</p>
              <h2 id="upgrade-title">{proLimitReached ? tr('aiLimitReachedTitle') : tr('upgradeTitle')}</h2>
              <p className="upgrade-description">{proLimitReached ? tr('aiLimitReachedDesc') : tr('upgradeDesc')}</p>
              <div className="upgrade-benefits"><strong>{tr('proBenefits')}</strong><ul><li>{tr('proBenefit1')}</li><li>{tr('proBenefit2')}</li><li>{tr('proBenefit3')}</li></ul></div>
              {!waitlistSent ? <div className="upgrade-form"><label htmlFor="pro-waitlist-email">{tr('notifyEmail')}</label><input id="pro-waitlist-email" type="email" value={waitlistEmail || user?.email || ''} onChange={event => { setWaitlistEmail(event.target.value); setWaitlistError('') }} placeholder={tr('notifyEmailPlaceholder')} autoComplete="email" /><p className="upgrade-note">{tr('notifyMe')}</p>{waitlistError && <div className="form-error" role="alert">{waitlistError}</div>}<button className="primary-button" type="button" onClick={joinProWaitlist} disabled={waitlistSaving}>{waitlistSaving ? (currentLanguage === 'pt' ? 'A guardar…' : 'Saving…') : tr('joinWaitlist')}</button></div> : <div className="upgrade-success"><CheckCircle size={18} /><div><strong>{tr('proComingSoon')}</strong><span>{tr('proComingSoonDesc')}</span></div></div>}
            </section>
          </div>}
          <main className="main-content">
            <header className="topbar">
              <button className="icon-button mobile-only" onClick={() => setMenuOpen(!menuOpen)} aria-label={tr("menu")}><Menu size={21} /></button>
              <div>
                <div className="eyebrow">{tr('workspace')}</div>
                <h1>{view === 'quick-add' ? tr('today') : view === 'tasks' ? tr('tasks') : view === 'clients' ? tr('clients') : view === 'payments' ? tr('payments') : view === 'planner' ? tr('planner') : view === 'feedback' ? tr('feedback') : tr('settings')}</h1>
              </div>
              <div className="topbar-actions">{user ? <button className="account-button" title={user.email ?? ''} onClick={() => navigate('settings')}><UserCircle2 size={17} /> <span className="account-button-label">{user.email?.split('@')[0] || (currentLanguage==='pt' ? 'Conta' : 'Account')}</span></button> : <button className="ghost-button" onClick={() => { setAuthMode('login'); setAuthOpen(true) }}>{currentLanguage==='pt' ? 'Entrar' : 'Sign in'}</button>}<InstallPwaButton language={language} /><div className="language-switcher desktop-language" aria-label={tr('language')}><button className={language==='en'?'active':''} onClick={()=>setLanguage('en')}>EN</button><button className={language==='pt'?'active':''} onClick={()=>setLanguage('pt')}>PT</button></div></div>
            </header>

            <div key={view} className={"route-view route-" + view}>
            {view === 'tasks' && tasksError && <div className="error-banner" role="alert">{tasksError}</div>}
            {view === 'clients' && clientsError && <div className="error-banner" role="alert">{clientsError}</div>}
            {view === 'payments' && paymentsError && <div className="error-banner" role="alert">{paymentsError}</div>}
            {view === 'tasks' && tasksLoading && <div className="loading-banner" aria-live="polite">{currentLanguage === 'pt' ? 'A carregar tarefas…' : 'Loading tasks…'}</div>}
            {view === 'clients' && clientsLoading && <div className="loading-banner" aria-live="polite">{currentLanguage === 'pt' ? 'A carregar clientes…' : 'Loading clients…'}</div>}
            {view === 'payments' && paymentsLoading && <div className="loading-banner" aria-live="polite">{currentLanguage === 'pt' ? 'A carregar pagamentos…' : 'Loading payments…'}</div>}
            {view === 'quick-add' && (
              <TodayView
                tasks={tasks}
                overdue={overdue}
                todayTasks={todayTasks}
                pendingPayments={pendingPayments}
                quickText={quickText}
                aiError={aiError}
                onQuickTextChange={value => { setQuickText(value); if (aiError) setAiError('') }}
                onToggle={toggleTask}
                plan={plan}
                planSource={planSource}
                onCreatePlan={createPlan}
                onAddPlan={addPlan}
                onPlanner={() => navigate('planner')}
                onMarkPaid={markPaid}
                onViewTasks={() => navigate('tasks')}
                onViewPayments={() => navigate('payments')}
                onAddTask={() => setShowAdd(true)}
                onAddPayment={() => setShowAddPayment(true)}
                busyTaskId={updatingTaskId}
                aiLoading={aiLoading}
                user={user}
                aiUsage={aiUsage}
                onUpgrade={() => { setProLimitReached(false); setUpgradeOpen(true) }}
              />
            )}
            {view === 'tasks' && <TasksView tasks={tasks} onToggle={toggleTask} onAdd={() => setShowAdd(true)} busyTaskId={updatingTaskId} />}
            {view === 'clients' && <ClientsView clients={clients} tasks={tasks} payments={payments} />}
            {view === 'payments' && <PaymentsView payments={payments} onMarkPaid={markPaid} onAdd={() => setShowAddPayment(true)} />}
            {view === 'feedback' && <FeedbackView
              type={feedbackType}
              rating={feedbackRating}
              message={feedbackMessage}
              sent={feedbackSent}
              saving={feedbackSaving}
              error={feedbackError}
              canSubmit={Boolean(user && supabase)}
              onType={value => { setFeedbackType(value); setFeedbackSent(false); setFeedbackError('') }}
              onRating={value => { setFeedbackRating(value); setFeedbackSent(false); setFeedbackError('') }}
              onMessage={value => { setFeedbackMessage(value); setFeedbackSent(false); setFeedbackError('') }}
              onSubmit={() => void submitFeedback()}
              onSignIn={() => { setAuthMode('login'); setAuthOpen(true) }}
              onBack={() => navigate('quick-add')}
            />}
            {view === 'settings' && <SettingsView
              user={user}
              language={language}
              setLanguage={setLanguage}
              theme={theme}
              setTheme={setTheme}
              onSignOut={handleSignOut}
              onFeedback={() => navigate('feedback')}
              onUpgrade={() => { setProLimitReached(false); setUpgradeOpen(true) }}
              waitlistEmail={waitlistEmail}
              setWaitlistEmail={setWaitlistEmail}
              waitlistSent={waitlistSent}
              waitlistSaving={waitlistSaving}
              waitlistError={waitlistError}
              onJoinWaitlist={() => void joinProWaitlist()}
              aiUsage={aiUsage}
            />}
            {view === 'planner' && (
              <PlannerView
                plan={plan}
                openTasks={openTasks}
                aiLoading={aiLoading}
                isAuthenticated={Boolean(user)}
                plannerError={plannerError}
                plannerSource={plannerSource}
                aiUsage={aiUsage}
                onGenerate={async () => {
                  const candidates = [...openTasks]
                    .sort((a, b) => (a.dueDateProvided === false ? '9999-12-31' : a.dueDate).localeCompare(b.dueDateProvided === false ? '9999-12-31' : b.dueDate) || ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
                    .slice(0, 12)

                  setPlannerError('')
                  setPlannerSource(null)
                  if (!candidates.length) {
                    setPlan([])
                    setPlanPayments([])
                    setView('planner')
                    return
                  }

                  if (aiUsage.remaining <= 0) {
                    setPlannerError(currentLanguage === 'pt'
                      ? 'Os seus créditos de IA acabaram neste mês. Tente novamente no próximo mês.'
                      : 'Your AI credits are used up for this month. Try again next month.')
                    setProLimitReached(true)
                    setUpgradeOpen(true)
                    return
                  }

                  if (!user || !supabase) {
                    setPlan(candidates)
      setPlanSource('planner')
                    setPlanPayments([])
                    setPlannerSource('local')
                    setView('planner')
                    return
                  }

                  const requestId = ++plannerRequestId.current
                  setAiLoading(true)
                  setPlannerError('')
                  setPlan([])
                  try {
                    const plannerPromise = supabase.functions.invoke('quick-add', {
                      body: {
                        mode: 'plan',
                        today: currentTodayKey(),
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        language,
                        tasks: candidates,
                      },
                    })
                    const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Planner request timed out.')), 30000))
                    const { data, error } = await Promise.race([plannerPromise, timeoutPromise])
                    if (error) {
                      let code = ''
                      let detail = ''
                      try {
                        const response = (error as FunctionsHttpError & { context?: Response }).context
                        if (response) {
                          const body = await response.clone().json()
                          code = typeof body?.code === 'string' ? body.code : ''
                          detail = typeof body?.message === 'string' ? body.message : ''
                          if (body?.aiUsage && typeof body.aiUsage === 'object') applyAiUsage(body.aiUsage)
                        }
                      } catch {}
                      if (code === 'AI_LIMIT_REACHED') {
                        setProLimitReached(true)
                        setUpgradeOpen(true)
                        setPlannerError(currentLanguage === 'pt'
                          ? 'Os seus créditos de IA acabaram. Eles serão renovados no próximo mês.'
                          : 'Your AI credits are used up. They will reset next month.')
                        return
                      }
                      throw new Error(detail || error.message)
                    }
                    if (data?.aiUsage) {
                      const nextAiUsage = {
                        used: Number(data.aiUsage.used ?? aiUsage.used),
                        limit: Number(data.aiUsage.limit ?? 20),
                        remaining: Number(data.aiUsage.remaining ?? aiUsage.remaining),
                      }
                      applyAiUsage(nextAiUsage)
                    }
                    const orderedIds = Array.isArray(data?.orderedIds) ? data.orderedIds as string[] : []
                    const byId = new Map(candidates.map(task => [task.id, task]))
                    const ordered = orderedIds.map(id => byId.get(id)).filter((task): task is Task => Boolean(task))
                    if (requestId === plannerRequestId.current && ordered.length === candidates.length) {
                      setPlan(ordered)
      setPlanSource('planner')
                      setPlanPayments([])
                      setPlannerSource('ai')
                      setView('planner')
                      return
                    }
                    throw new Error('Planner returned an invalid order.')
                  } catch (error) {
                    if (requestId !== plannerRequestId.current) return
                    console.error('LifeDue AI Planner failed:', error)
                    setPlannerError(currentLanguage === 'pt' ? 'A IA não respondeu a tempo. Mostramos uma ordem segura por prazo e prioridade.' : 'AI did not respond in time. We are showing a safe order by due date and priority.')
                    setPlan(candidates)
                    setPlanPayments([])
                    setPlannerSource('local')
                    setView('planner')
                  } finally {
                    setAiLoading(false)
                  }
                }}
                onAddTask={() => { setShowAdd(true); setTaskDraftClient('') }}
                onViewTasks={() => navigate('tasks')}
              />           )}
            </div>
          </main>

          <div className="mobile-nav">
            <MobileNav icon={<LayoutDashboard size={19} />} label={tr('today')} active={view === 'quick-add'} onClick={() => navigate('quick-add')} />
            <MobileNav icon={<ListTodo size={19} />} label={tr('tasks')} active={view === 'tasks'} onClick={() => navigate('tasks')} />
            <MobileNav icon={<Users size={19} />} label={tr('clients')} active={view === 'clients'} onClick={() => navigate('clients')} />
            <MobileNav icon={<CreditCard size={19} />} label={tr('payments')} active={view === 'payments'} onClick={() => navigate('payments')} />
            <MobileNav icon={<Sparkles size={19} />} label={tr('planner')} active={view === 'planner'} onClick={() => navigate('planner')} />
          </div>
        </div>
      )}

      {planReviewOpen && <PlanReview
        language={currentLanguage}
        items={planReviewItems()}
        details={planReviewDetails()}
        today={currentTodayKey()}
        onCancel={() => setPlanReviewOpen(false)}
        onConfirm={confirmPlanReview}
      />}
      {showAddClient && user && <AddClientModal onClose={() => setShowAddClient(false)} onAdd={async name => { if (!supabase || !user) return; const created = await createClient(user, name); setClients(current => current.some(client => client.name.trim().toLowerCase() === created.name.trim().toLowerCase()) ? current : [...current, created].sort((a,b) => a.name.localeCompare(b.name))) }} />}
      {nextStep && <NextStepCard type={nextStep.type} client={nextStep.client} onAction={() => { suppressNextStepRef.current = true; if (nextStep.type === 'payment') { setPaymentDraftClient(nextStep.client); setShowAddPayment(true) } else { setTaskDraftClient(nextStep.client); setShowAdd(true) }; setNextStep(null) }} onDismiss={() => setNextStep(null)} />}
      {showAdd && <AddTaskModal initialClient={taskDraftClient} onClose={() => { setShowAdd(false); setTaskDraftClient('') }} onAdd={addTask} clients={clients} />}
      {showAddPayment && <AddPaymentModal initialClient={paymentDraftClient} onClose={() => { setShowAddPayment(false); setPaymentDraftClient('') }} onAdd={addPayment} clients={clients} />}
      {authOpen && <AuthModal language={language} initialMode={authMode} onClose={() => setAuthOpen(false)} onAuthenticated={() => { setAuthOpen(false); setView('quick-add') }} />}
    </div>
  )
}


function FeedbackView({ type, rating, message, sent, saving, error, canSubmit, onType, onRating, onMessage, onSubmit, onSignIn, onBack }: {
  type: 'bug' | 'idea' | 'general' | 'other'
  rating: 'great' | 'okay' | 'poor' | ''
  message: string
  sent: boolean
  saving: boolean
  error: string
  canSubmit: boolean
  onType: (value: 'bug' | 'idea' | 'general' | 'other') => void
  onRating: (value: 'great' | 'okay' | 'poor') => void
  onMessage: (value: string) => void
  onSubmit: () => void
  onSignIn: () => void
  onBack: () => void
}) {
  const typeOptions = [
    { value: 'bug' as const, label: tr('feedbackTypeBug') },
    { value: 'idea' as const, label: tr('feedbackTypeIdea') },
    { value: 'general' as const, label: tr('feedbackTypeGeneral') },
    { value: 'other' as const, label: tr('feedbackTypeOther') },
  ]
  return <div className="content-stack feedback-page">
    <div className="page-intro">
      <div><p className="section-kicker">{tr('feedback')}</p><h2>{tr('feedbackTitle')}</h2><p className="page-description">{tr('feedbackDesc')}</p></div>
      <button className="secondary-button" onClick={onBack}><ArrowRight size={15} className="back-arrow" /> {tr('backToWork')}</button>
    </div>
    <section className="feedback-card">
      <div className="feedback-card-header"><div className="feedback-icon"><MessageSquareText size={20} /></div><div><strong>{tr('feedbackHint')}</strong><p>{tr('feedbackFormHint')}</p></div></div>
      <div className="feedback-field">
        <label>{tr('feedbackType')}</label>
        <div className="feedback-options">
          {typeOptions.map(option => <button key={option.value} type="button" className={type === option.value ? 'feedback-option active' : 'feedback-option'} onClick={() => onType(option.value)}>{option.label}</button>)}
        </div>
      </div>
      <div className="feedback-field">
        <label>{tr('feedbackRating')}</label>
        <div className="feedback-rating">
          {([
            ['great', '😊', tr('feedbackRatingGreat')],
            ['okay', '😐', tr('feedbackRatingOkay')],
            ['poor', '😕', tr('feedbackRatingPoor')],
          ] as const).map(([value, emoji, label]) => <button key={value} type="button" className={rating === value ? 'feedback-rating-option active' : 'feedback-rating-option'} onClick={() => onRating(value)}><span>{emoji}</span><small>{label}</small></button>)}
        </div>
      </div>
      <div className="feedback-field">
        <label htmlFor="lifedue-feedback-message">{tr('feedbackMessage')}</label>
        <textarea id="lifedue-feedback-message" value={message} onChange={event => onMessage(event.target.value)} placeholder={tr('feedbackPlaceholder')} maxLength={1200} />
        <div className="feedback-counter">{message.length}/1200</div>
      </div>
      <div className="feedback-submit-row">
        <span className={error ? 'feedback-status error' : 'feedback-status'}>{error ? error : sent ? <><CheckCircle size={15} /> {tr('feedbackSent')}</> : !canSubmit ? tr('feedbackSignIn') : ''}</span>
        {canSubmit ? (
          <button className="primary-button" disabled={!message.trim() || saving} onClick={onSubmit}>
            <MessageSquareText size={16} /> {saving ? (currentLanguage === 'pt' ? 'A enviar…' : 'Sending…') : tr('sendFeedback')}
          </button>
        ) : (
          <button className="secondary-button" onClick={onSignIn}>{currentLanguage === 'pt' ? 'Entrar' : 'Sign in'}</button>
        )}
      </div>
    </section>
  </div>
}

function SettingsView({ user, language, setLanguage, theme, setTheme, onSignOut, onFeedback, onUpgrade, waitlistEmail, setWaitlistEmail, waitlistSent, waitlistSaving, waitlistError, onJoinWaitlist, aiUsage }: {
  user: User | null
  language: Language
  setLanguage: (value: Language) => void
  theme: 'system' | 'light' | 'dark'
  setTheme: (value: 'system' | 'light' | 'dark') => void
  onSignOut: () => void
  onFeedback: () => void
  onUpgrade: () => void
  waitlistEmail: string
  setWaitlistEmail: (value: string) => void
  waitlistSent: boolean
  waitlistSaving: boolean
  waitlistError: string
  onJoinWaitlist: () => void
  aiUsage: AiUsage
}) {
  return <div className="content-stack settings-page">
    <div className="page-intro">
      <div><p className="section-kicker">{tr('account')}</p><h2>{tr('settings')}</h2><p className="page-description">{tr('settingsDesc')}</p></div>
    </div>

    <section className="settings-card account-card">
      <div className="settings-section-head"><div className="settings-icon"><UserCircle2 size={19} /></div><div><h3>{tr('account')}</h3><p>{tr('accountDesc')}</p></div></div>
      <div className="account-summary">
        <div className="account-avatar">{(user?.email?.[0] || 'L').toUpperCase()}</div>
        <div className="account-details"><strong>{user?.email || (currentLanguage === 'pt' ? 'Conta local' : 'Local account')}</strong><span>{tr('plan')} · {tr('freePlanDesc')}</span></div>
        <span className="settings-plan-badge">{tr('freePlan')}</span><button className="upgrade-button" type="button" onClick={onUpgrade}><Sparkles size={14} /> {tr('upgrade')}</button>
      </div>
    </section>

    <section className="settings-card">
      <div className="settings-section-head">
        <div className="settings-icon"><Sparkles size={19} /></div>
        <div>
          <h3>{tr('aiUsageLabel')}</h3>
          <p>{aiUsage.remaining > 0 ? tr('aiUsesRemaining').replace('{n}', String(aiUsage.remaining)) : tr('aiUsageExhausted')}</p>
        </div>
      </div>
      <div className="settings-action-row">
        <div>
          <strong>{aiUsage.used}/{aiUsage.limit}</strong>
          <span>{currentLanguage === 'pt' ? 'usos de IA utilizados neste mês' : 'AI uses used this month'}</span>
        </div>
        <span className="settings-plan-badge">{tr('freePlan')}</span>
      </div>
      <div className={aiUsage.remaining === 0 ? 'settings-usage-notice exhausted' : 'settings-usage-notice'}>
        <span>{aiUsage.remaining === 0 ? tr('aiUsageExhausted') : tr('aiUsageShared')}</span>
        <small>{tr('aiUsageReset')}</small>
      </div>
    </section>

    <section className="settings-card">
      <div className="settings-section-head"><div className="settings-icon"><Sparkles size={19} /></div><div><h3>{tr('upgradeTitle')}</h3><p>{tr('upgradeDesc')}</p></div></div>
      {waitlistSent ? (
        <div className="settings-action-row"><div><strong>{tr('proComingSoon')}</strong><span>{tr('proComingSoonDesc')}</span></div><span className="settings-plan-badge">{currentLanguage === 'pt' ? 'Na lista' : 'On the list'}</span></div>
      ) : (
        <div className="settings-waitlist">
          <div><strong>{tr('notifyMe')}</strong><span>{tr('proLimitEmail')}</span></div>
          <div className="settings-waitlist-form">
            <input type="email" value={waitlistEmail || user?.email || ''} onChange={event => setWaitlistEmail(event.target.value)} placeholder={tr('notifyEmailPlaceholder')} autoComplete="email" />
            <button className="primary-button" type="button" onClick={onJoinWaitlist} disabled={waitlistSaving}>{waitlistSaving ? (currentLanguage === 'pt' ? 'A guardar…' : 'Saving…') : tr('joinWaitlist')}</button>
          </div>
          {waitlistError && <div className="form-error" role="alert">{waitlistError}</div>}
        </div>
      )}
    </section>

    <section className="settings-card">
      <div className="settings-section-head"><div className="settings-icon"><Globe2 size={19} /></div><div><h3>{tr('preferences')}</h3><p>{tr('languageDesc')}</p></div></div>
      <div className="settings-row"><div><strong>{tr('language')}</strong><span>{tr('languageDesc')}</span></div><div className="segmented-control"><button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>English</button><button className={language === 'pt' ? 'active' : ''} onClick={() => setLanguage('pt')}>Português</button></div></div>
      <div className="settings-row"><div><strong>{tr('theme')}</strong><span>{tr('themeDesc')}</span></div><div className="theme-options">
        <button className={theme === 'system' ? 'active' : ''} onClick={() => setTheme('system')}><Monitor size={15} />{tr('themeSystem')}</button>
        <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}><Sun size={15} />{tr('themeLight')}</button>
        <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}><Moon size={15} />{tr('themeDark')}</button>
      </div></div>
    </section>

    <section className="settings-card">
      <div className="settings-section-head"><div className="settings-icon"><Download size={19} /></div><div><h3>{tr('installApp')}</h3><p>{tr('installAppDesc')}</p></div></div>
      <div className="settings-action-row"><div><strong>{tr('installApp')}</strong><span>{tr('installAppDesc')}</span></div><InstallPwaButton language={language} /></div>
    </section>

    <section className="settings-card">
      <div className="settings-section-head"><div className="settings-icon"><MessageSquareText size={19} /></div><div><h3>{tr('feedback')}</h3><p>{tr('feedbackDesc')}</p></div></div>
      <div className="settings-action-row"><div><strong>{tr('feedback')}</strong><span>{tr('feedbackHint')}</span></div><button className="secondary-button" onClick={onFeedback}>{tr('feedback')}</button></div>
    </section>

    <section className="settings-card settings-danger">
      <div className="settings-section-head"><div className="settings-icon danger-icon"><LogOut size={19} /></div><div><h3>{tr('security')}</h3><p>{tr('security')}</p></div></div>
      <div className="settings-action-row"><div><strong>{tr('signOut')}</strong><span>{tr('security')}</span></div><button className="danger-button" onClick={onSignOut}><LogOut size={15} /> {tr('signOut')}</button></div>
    </section>
  </div>
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function InstallPwaButton({ language, variant = 'default' }: { language: Language; variant?: 'default' | 'hero' }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [help, setHelp] = useState('')

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
    setInstalled(isStandalone)

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setInstallEvent(null)
      setHelp('')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  if (installed) {
    return <span className="install-pwa-installed"><CheckCircle size={15} /> {language === 'pt' ? 'LifeDue já está instalado' : 'LifeDue is already installed'}</span>
  }

  const install = async () => {
    const event = installEvent
    if (event) {
      await event.prompt()
      await event.userChoice
      setInstallEvent(null)
      return
    }

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setHelp(isIOS
      ? (language === 'pt' ? 'No iPhone/iPad: use Partilhar → Adicionar ao ecrã principal.' : 'On iPhone/iPad: use Share → Add to Home Screen.')
      : (language === 'pt' ? 'No menu do navegador, escolha “Instalar LifeDue” ou “Adicionar ao ecrã principal”.' : 'Open your browser menu and choose “Install LifeDue” or “Add to Home Screen”.'))
  }

  return (
    <div className={variant === 'hero' ? 'install-pwa-wrap install-pwa-wrap-hero' : 'install-pwa-wrap'}>
      <button className={variant === 'hero' ? 'install-pwa-button install-pwa-hero' : 'install-pwa-button'} onClick={install}>
        <Download size={15} />
        {language === 'pt' ? 'Baixar LifeDue' : 'Install LifeDue'}
      </button>
      {help && <span className="install-pwa-help" role="status">{help}</span>}
    </div>
  )
}

function Landing({ onStart, onAuth, onOpenApp, language, setLanguage, user }: { onStart: () => void; onAuth: () => void; onOpenApp: () => void; language: Language; setLanguage: (language: Language) => void; user: User | null }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand"><span className="brand-mark">L</span><span>LifeDue</span></div>
        <div className="landing-nav-right">
          <div className="language-switcher"><button className={language==='en'?'active':''} onClick={()=>setLanguage('en')}>EN</button><button className={language==='pt'?'active':''} onClick={()=>setLanguage('pt')}>PT</button></div>
          {user ? (
            <button className="nav-cta" onClick={onOpenApp}>{language==='pt' ? 'Abrir LifeDue' : 'Open LifeDue'} <ArrowRight size={15} /></button>
          ) : (
            <>
              <button className="ghost-button landing-signin" onClick={onAuth}>{language==='pt' ? 'Entrar' : 'Sign in'}</button>
              <button className="nav-cta" onClick={onStart}>{language==='pt' ? 'Começar grátis' : 'Start for free'} <ArrowRight size={15} /></button>
            </>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="pill"><Sparkles size={14} /> {language==='pt' ? 'Feito para trabalho com clientes' : 'Built for client work'}</div>
          <h1>{language==='pt' ? 'Nunca mais perca um ' : 'Never miss a client '}<span>{language==='pt' ? 'prazo ou cobrança.' : 'deadline or payment.'}</span></h1>
          <p>{language==='pt'
            ? 'Transforme seu trabalho com clientes em um plano diário simples. Saiba exatamente o que precisa da sua atenção hoje.'
            : 'Turn your client work into a simple daily plan. Know exactly what needs your attention today.'}</p>
          <div className="hero-actions">
            {user ? (
              <button className="hero-cta" onClick={onOpenApp}>{language==='pt' ? 'Ir para o app' : 'Go to app'} <ArrowRight size={18} /></button>
            ) : (
              <>
                <button className="hero-cta" onClick={onStart}>{language==='pt' ? 'Começar grátis' : 'Start for free'} <ArrowRight size={18} /></button>
                <button className="hero-secondary" onClick={onAuth}>{language==='pt' ? 'Já tenho uma conta' : 'I already have an account'}</button>
              </>
            )}
          </div>
          <div className="microcopy"><Check size={14} /> {language==='pt' ? 'Grátis para começar · sem cartão' : 'Free to start · no credit card'}</div>
          <InstallPwaButton language={language} variant="hero" />
        </div>

        <div className="hero-visual">
          <div className="preview-glow" />
          <div className="hero-preview">
            <div className="preview-top"><span>LifeDue</span><span className="preview-status"><span className="status-dot">●</span> {language==='pt' ? 'Tudo sob controle' : 'All on track'}</span></div>
            <div className="preview-balance"><div><span>{language==='pt' ? 'A receber' : 'To collect'}</span><strong>$2,500 USD</strong></div><CircleDollarSign size={22} /></div>
            <div className="preview-title">{tr('today').toUpperCase()}</div>
            <PreviewTask title={language==='pt' ? 'Entregar landing page' : 'Deliver landing page'} client={language==='pt' ? 'Maria' : 'Maria'} kind={language==='pt' ? 'Entrega' : 'Delivery'} urgent />
            <PreviewTask title={language==='pt' ? 'Cobrar pagamento' : 'Follow up payment'} client={language==='pt' ? 'João' : 'John'} kind={language==='pt' ? 'Pagamento' : 'Payment'} />
            <div className="preview-title muted">{tr('upNext').toUpperCase()}</div>
            <PreviewTask title={language==='pt' ? 'Enviar proposta' : 'Send proposal'} client="Carlos" kind={language==='pt' ? 'Entrega' : 'Delivery'} />
            <div className="preview-footer"><Check size={14} /> {language==='pt' ? '3 itens organizados para você' : '3 items organized for you'}</div>
          </div>
        </div>
      </section>

      <section className="feature-row">
        <Feature icon={<Sparkles />} title={language==='pt' ? 'Adicione com linguagem natural' : 'Add in natural language'} text={language==='pt' ? 'Escreva "Entregar site da Maria sexta" e o LifeDue cria a tarefa e o pagamento.' : 'Write "Deliver Maria site Friday" and LifeDue creates the task and payment.'} />
        <Feature icon={<Clock3 />} title={language==='pt' ? 'Veja o que é urgente' : 'See what is urgent'} text={language==='pt' ? 'Atrasados, hoje e próximos prazos em um só lugar. Sem listas confusas.' : 'Overdue, today, and upcoming deadlines in one place. No messy lists.'} />
        <Feature icon={<CircleDollarSign />} title={language==='pt' ? 'Nunca esqueça um pagamento' : 'Never forget a payment'} text={language==='pt' ? 'Pagamentos pendentes ligados aos clientes e prazos. Saiba quanto deve receber.' : 'Pending payments connected to clients and deadlines. Know what you are owed.'} />
      </section>
    </div>
  )
}

function OnboardingView({ quickText, onQuickTextChange, onCreatePlan, plan, planSource, planPayments, onAddPlan, onAddPayment, onUpdatePlanTask, onUpdatePlanPayment, onSkip, aiLoading, aiError, user, onBack, language }: {
  quickText: string
  onQuickTextChange: (value: string) => void
  onCreatePlan: () => void
  plan: Task[]
  planSource: 'quick-add' | 'planner' | null
  planPayments: QuickAddItem[]
  onAddPlan: () => void
  onAddPayment: () => void
  onUpdatePlanTask: (id: string, patch: Partial<Pick<Task, 'dueDate' | 'dueDateProvided' | 'priority'>>) => void
  onUpdatePlanPayment: (index: number, patch: Partial<Pick<QuickAddItem, 'amount' | 'currency' | 'dueDate' | 'dueDateProvided'>>) => void
  onSkip: () => void
  aiLoading: boolean
  aiError: string
  user: User | null
  onBack: () => void
  language: Language
}) {
  const pt = language === 'pt'
  const resultRef = useRef<HTMLElement>(null)
  const [showPaymentSuggestion, setShowPaymentSuggestion] = useState(true)
  const [showDetails, setShowDetails] = useState(true)
  const [editingTaskDate, setEditingTaskDate] = useState<string | null>(null)
  const [editingPayment, setEditingPayment] = useState<number | null>(null)
  const [paymentAmountDraft, setPaymentAmountDraft] = useState('')

  useEffect(() => {
    if (plan.length > 0 && !aiLoading) {
      const timer = window.setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
      return () => window.clearTimeout(timer)
    }
  }, [plan.length, aiLoading])

  return (
    <div className="onboarding">
      <header className="onboarding-header">
        <button className="brand onboarding-brand" onClick={onBack}><span className="brand-mark">L</span><span>LifeDue</span></button>
        <div className="onboarding-progress"><span className="active" /><span className={plan.length ? 'active' : ''} /><span className={user ? 'active' : ''} /></div>
        <div className="onboarding-header-actions">
          <button className="ghost-button" onClick={onSkip}>{pt ? 'Pular por agora' : 'Skip for now'}</button>
          <button className="ghost-button" onClick={onBack}>{pt ? 'Voltar' : 'Back'}</button>
        </div>
      </header>
      <main className="onboarding-main">
        <div className="onboarding-intro">
          <div className="onboarding-icon"><Sparkles size={22} /></div>
          <p className="section-kicker">{pt ? 'COMECE EM SEGUNDOS' : 'START IN SECONDS'}</p>
          <h1>{pt ? 'Vamos organizar seu trabalho.' : 'Let’s organize your work.'}</h1>
          <p>{pt ? 'Diga ao LifeDue o que você precisa fazer. A IA transforma isso em um plano simples — sem configurar nada antes.' : 'Tell LifeDue what you need to get done. AI turns it into a simple plan — no setup required.'}</p>
        </div>
        <section className="onboarding-card">
          <label htmlFor="onboarding-input">{pt ? 'O que você precisa fazer?' : 'What do you need to get done?'}</label>
          <textarea id="onboarding-input" value={quickText} onChange={e => onQuickTextChange(e.target.value)} autoFocus placeholder={pt ? 'Ex.: Entregar o site da Maria sexta, cobrar 200 USD amanhã e enviar a proposta ao Carlos segunda.' : "e.g. Deliver Maria's website Friday, collect $200 tomorrow, and send Carlos the proposal Monday."} />
          <div className="onboarding-examples">
            <span>{pt ? 'Exemplos:' : 'Examples:'}</span>
            <button type="button" onClick={() => onQuickTextChange(pt ? 'Entregar o site da Maria sexta' : "Deliver Maria's website Friday")}>{pt ? 'Entrega' : 'Delivery'}</button>
            <button type="button" onClick={() => onQuickTextChange(pt ? 'Cobrar 200 USD do João amanhã' : 'Collect $200 from John tomorrow')}>{pt ? 'Cobrança' : 'Payment'}</button>
          </div>
          <button className="primary-button onboarding-submit" onClick={onCreatePlan} disabled={aiLoading || !quickText.trim()}>
            {aiLoading ? (pt ? 'A organizar…' : 'Organizing…') : (pt ? 'Criar meu plano' : 'Create my plan')} <ArrowRight size={17} />
          </button>
          {aiError && <div className="quick-error" role="alert">{aiError}</div>}
        </section>
        {plan.length > 0 && (
          <section ref={resultRef} className="onboarding-result">
            <div className="onboarding-result-head">
              <div><p className="section-kicker">{pt ? 'SEU PRIMEIRO PLANO' : 'YOUR FIRST PLAN'}</p><h2>{pt ? 'Isto é o que encontramos.' : 'Here’s what we found.'}</h2></div>
              <CheckCircle2 size={22} />
            </div>
            <div className="ai-plan-list">
              {plan.map((task, index) => <div className="ai-plan-item" key={task.id + index}><div className="ai-plan-icon">{/payment|pagamento|cobrar|receber/i.test(task.title) ? '💰' : '✓'}</div><div><strong>{task.title}</strong><span>{task.client} · {formatDate(task.dueDate, task.dueDateProvided !== false)}</span></div></div>)}
            </div>
            <button className="primary-button onboarding-submit" onClick={onAddPlan}>
              {user ? (pt ? 'Guardar no LifeDue' : 'Save to LifeDue') : (pt ? 'Guardar meu trabalho' : 'Save my work')} <ArrowRight size={17} />
            </button>
            {showDetails && (() => {
              const undatedTasks = plan.filter(task => task.dueDateProvided === false)
              const incompletePayments = planPayments.map((payment, index) => ({ payment, index })).filter(({ payment }) => payment.amount == null || payment.currency == null)
              if (!undatedTasks.length && !incompletePayments.length) return null
              return <div className="onboarding-details-card">
                <div className="onboarding-details-head">
                  <div>
                    <strong>{pt ? 'Completar detalhes (opcional)' : 'Complete details (optional)'}</strong>
                    <span>{pt ? 'O plano já está pronto. Você pode preencher o que faltou agora ou deixar para depois.' : 'Your plan is already ready. Complete anything missing now or leave it for later.'}</span>
                  </div>
                  <button type="button" className="text-button" onClick={() => setShowDetails(false)}>{pt ? 'Agora não' : 'Not now'}</button>
                </div>
                <div className="onboarding-details-list">
                  {undatedTasks.map(task => <div className="onboarding-detail-row" key={task.id}>
                    <div className="onboarding-detail-copy"><strong>{task.title}</strong><span>{pt ? 'Prazo ainda não definido' : 'No deadline set yet'}</span></div>
                    {editingTaskDate === task.id ? <div className="onboarding-detail-control">
                      <input type="date" min={currentTodayKey()} onChange={e => { if (!e.target.value) return; onUpdatePlanTask(task.id, { dueDate: e.target.value, dueDateProvided: true }); setEditingTaskDate(null) }} autoFocus />
                      <button type="button" className="text-button" onClick={() => setEditingTaskDate(null)}>{pt ? 'Cancelar' : 'Cancel'}</button>
                    </div> : <button type="button" className="secondary-button compact-button" onClick={() => setEditingTaskDate(task.id)}>{pt ? 'Definir prazo' : 'Set deadline'}</button>}
                  </div>)}
                  {incompletePayments.map(({ payment, index }) => <div className="onboarding-detail-row" key={index}>
                    <div className="onboarding-detail-copy">
                      <strong>{payment.client ? (pt ? 'Pagamento de ' : 'Payment from ') + payment.client : (pt ? 'Pagamento' : 'Payment')}</strong>
                      <span>{payment.amount == null ? (pt ? 'Valor ainda não definido' : 'Amount not set yet') : (pt ? 'Moeda ainda não definida' : 'Currency not set yet')}</span>
                    </div>
                    {editingPayment === index ? <div className="onboarding-detail-payment-control">
                      {payment.amount == null && <input type="text" inputMode="decimal" placeholder={pt ? 'Valor' : 'Amount'} value={paymentAmountDraft} onChange={e => setPaymentAmountDraft(e.target.value)} />}
                      {((payment.amount != null) || paymentAmountDraft.trim()) && <select value={payment.currency ?? ''} onChange={e => { const value = e.target.value as QuickAddItem['currency']; onUpdatePlanPayment(index, { currency: value || undefined }); if (payment.amount != null) setEditingPayment(null) }}>
                        <option value="">{pt ? 'Escolher moeda' : 'Choose currency'}</option><option value="AOA">AOA · Kz</option><option value="USD">USD · US$</option><option value="EUR">EUR · €</option><option value="BRL">BRL · R$</option><option value="GBP">GBP · £</option><option value="Other">{pt ? 'Outra' : 'Other'}</option>
                      </select>}
                      {payment.amount == null && <button type="button" className="text-button" onClick={() => { const value = Number(paymentAmountDraft.replace(',', '.')); if (!Number.isFinite(value) || value <= 0) return; onUpdatePlanPayment(index, { amount: value }); setPaymentAmountDraft(''); setEditingPayment(null) }}>{pt ? 'Guardar' : 'Save'}</button>}
                      <button type="button" className="text-button" onClick={() => { setEditingPayment(null); setPaymentAmountDraft('') }}>{pt ? 'Cancelar' : 'Cancel'}</button>
                    </div> : <button type="button" className="secondary-button compact-button" onClick={() => { setEditingPayment(index); setPaymentAmountDraft(payment.amount == null ? '' : String(payment.amount)) }}>{payment.amount == null ? (pt ? 'Adicionar valor' : 'Add amount') : (pt ? 'Definir moeda' : 'Set currency')}</button>}
                  </div>)}
                </div>
              </div>
            })()}

            {!user && <p className="onboarding-save-note">{pt ? 'Você só cria uma conta quando quiser guardar seu trabalho. Google ou email — sem cartão.' : 'You only create an account when you want to save your work. Google or email — no card.'}</p>}
            {planPayments.length === 0 && showPaymentSuggestion && (
              <div className="onboarding-payment-option">
                <div className="onboarding-payment-copy">
                  <div className="onboarding-payment-icon"><CircleDollarSign size={18} /></div>
                  <div>
                    <strong>{pt ? 'Quer acompanhar um pagamento também?' : 'Want to track a payment too?'}</strong>
                    <span>{pt ? 'Opcional. Você pode adicionar valor, moeda e data depois.' : 'Optional. You can add the amount, currency, and due date later.'}</span>
                  </div>
                </div>
                <div className="onboarding-payment-actions">
                  <button type="button" className="secondary-button" onClick={onAddPayment}>{pt ? 'Adicionar pagamento' : 'Add payment'}</button>
                  <button type="button" className="text-button" onClick={() => setShowPaymentSuggestion(false)}>{pt ? 'Agora não' : 'Not now'}</button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

function PreviewTask({ title, client, kind, urgent = false }: { title: string; client: string; kind: string; urgent?: boolean }) {
  return <div className="preview-task"><span className={urgent ? 'preview-check urgent' : 'preview-check'}></span><div className="preview-task-content"><strong>{title}</strong><small>{client}</small></div><span className={kind === 'Payment' || kind === 'Pagamento' ? 'preview-badge payment' : 'preview-badge'}>{kind}</span></div>
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

function TodayView({ tasks, overdue, todayTasks, pendingPayments, quickText, aiError, onQuickTextChange, onToggle, plan, planSource, onCreatePlan, onAddPlan, onPlanner, onMarkPaid, onViewTasks, onViewPayments, onAddTask, onAddPayment, busyTaskId, aiLoading, user, aiUsage, onUpgrade }: {
  tasks: Task[]
  overdue: Task[]
  todayTasks: Task[]
  pendingPayments: Payment[]
  quickText: string
  aiError: string
  onQuickTextChange: (value: string) => void
  onToggle: (id: string) => void
  plan: Task[]
  planSource: 'quick-add' | 'planner' | null
  onCreatePlan: () => void
  onAddPlan: () => void
  onPlanner: () => void
  onMarkPaid: (id: string) => void
  onViewTasks: () => void
  onViewPayments: () => void
  onAddTask: () => void
  onAddPayment: () => void
  busyTaskId: string | null
  aiLoading: boolean
  user: User | null
  aiUsage: AiUsage
  onUpgrade: () => void
}) {
  const resultRef = useRef<HTMLElement>(null)
  const todayKey = iso(new Date())
  const openTasks = tasks.filter(t => t.status === 'open')
  const upcomingTasks = openTasks
    .filter(t => t.dueDateProvided !== false && t.dueDate > todayKey)
    .sort((a, b) => (a.dueDateProvided === false ? '9999-12-31' : a.dueDate).localeCompare(b.dueDateProvided === false ? '9999-12-31' : b.dueDate))
    .slice(0, 4)
  const urgentCount = overdue.length + todayTasks.filter(t => t.priority === 'high').length
  const paymentAttention = pendingPayments
    .filter(payment => payment.dueDateProvided !== false && payment.dueDate <= todayKey)
    .sort((a, b) => (a.dueDateProvided === false ? '9999-12-31' : a.dueDate).localeCompare(b.dueDateProvided === false ? '9999-12-31' : b.dueDate))
  const totalPending = pendingMoneyLabel(pendingPayments)
  const hasAttention = overdue.length > 0 || todayTasks.length > 0 || paymentAttention.length > 0

  useEffect(() => {
    if (plan.length > 0 && !aiLoading) {
      const timer = window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
      return () => window.clearTimeout(timer)
    }
  }, [plan.length, aiLoading])

  return (
    <div className="content-stack">
      <section className="today-hero">
        <div className="today-hero-copy">
          <p className="section-kicker">{new Intl.DateTimeFormat(currentLanguage==='pt'?'pt-PT':'en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase()}</p>
          <h2>{getTodayGreeting()}</h2>
          <p>{tr('todayFocus')}</p>
        </div>
        <div className="today-hero-actions">
          <button className="secondary-button" onClick={onAddTask}><Plus size={16} /> {tr('addTaskToday')}</button>
          <button className="secondary-button" onClick={onViewPayments}><CircleDollarSign size={16} /> {tr('toCollect')}</button>
        </div>
      </section>

      <section className="today-metrics" aria-label={tr('focusTitle')}>
        <button type="button" className="today-metric today-metric-action" onClick={onViewTasks} aria-label={currentLanguage === 'pt' ? 'Abrir tarefas abertas' : 'Open tasks'}>
          <span>{tr('openWork')}</span><strong>{openTasks.length}</strong><small>{currentLanguage === 'pt' ? 'tarefas abertas' : 'open tasks'}</small><ArrowRight size={14} aria-hidden="true" />
        </button>
        <button type="button" className={todayTasks.length ? 'today-metric today-metric-action attention' : 'today-metric today-metric-action'} onClick={onViewTasks} aria-label={currentLanguage === 'pt' ? 'Abrir tarefas que vencem hoje' : 'Open tasks due today'}>
          <span>{tr('dueToday')}</span><strong>{todayTasks.length}</strong><small>{currentLanguage === 'pt' ? 'para entregar' : 'to deliver'}</small><ArrowRight size={14} aria-hidden="true" />
        </button>
        <button type="button" className={overdue.length ? 'today-metric today-metric-action danger' : 'today-metric today-metric-action'} onClick={onViewTasks} aria-label={currentLanguage === 'pt' ? 'Abrir tarefas atrasadas' : 'Open overdue tasks'}>
          <span>{tr('overdue')}</span><strong>{overdue.length}</strong><small>{currentLanguage === 'pt' ? 'precisam de ação' : 'need action'}</small><ArrowRight size={14} aria-hidden="true" />
        </button>
        <button type="button" className="today-metric today-metric-action money" onClick={onViewPayments} aria-label={currentLanguage === 'pt' ? 'Abrir pagamentos pendentes' : 'Open pending payments'}>
          <span>{tr('toCollect')}</span><strong>{totalPending}</strong><small>{currentLanguage === 'pt' ? 'pagamentos pendentes' : 'pending payments'}</small><ArrowRight size={14} aria-hidden="true" />
        </button>
      </section>

      <section className="quick-card today-quick-card">
        <div className="quick-icon"><Sparkles size={19} /></div>
        <div className="quick-main">
          <div className="quick-label">{tr('aiQuick')}</div>
          <h3>{tr('quickQuestion')}</h3>
          <textarea value={quickText} onChange={e => onQuickTextChange(e.target.value)} placeholder={currentLanguage === 'pt' ? 'ex.: Entregar o site da Maria sexta, cobrar 200 USD amanhã e enviar a proposta ao Carlos segunda.' : "e.g. Deliver Maria's website Friday, collect $200 tomorrow, and send Carlos the proposal Monday."} />
          <div className="quick-actions">
            <button className="primary-button" onClick={onCreatePlan} disabled={aiLoading}>{aiLoading ? (currentLanguage==='pt' ? 'A analisar…' : 'Analyzing…') : tr('createPlan')} {!aiLoading && <ArrowRight size={17} />}</button>
            <span>{tr('aiUsesRemaining').replace('{n}', String(aiUsage.remaining))}</span>
          </div>
          {aiError && <div className="quick-error" role="alert">{aiError}</div>}
        </div>
      </section>

      {plan.length > 0 && (
        <section ref={resultRef} className="ai-result-card">
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
                <div><strong>{task.title}</strong><span>{task.client} · {formatDate(task.dueDate, task.dueDateProvided !== false)}</span></div>
              </div>
            ))}
          </div>
          <button className="primary-button" onClick={planSource === 'planner' ? onViewTasks : onAddPlan}>{planSource === 'planner' ? tr('viewTasks') : user ? tr('addAll') : tr('saveToLifeDue')} <ArrowRight size={17} /></button>
        </section>
      )}

      <section className="today-focus-section">
        <div className="section-heading today-section-heading">
          <div><p className="section-kicker">{tr('focusTitle')}</p><h2>{hasAttention ? (currentLanguage === 'pt' ? 'Resolva primeiro o que está pendente.' : 'Handle the important things first.') : tr('allClearToday')}</h2></div>
          <span className="today-urgent-count">{urgentCount > 0 ? `${urgentCount} ${tr('urgent').toLowerCase()}` : '✓'}</span>
        </div>

        {overdue.length > 0 && <TaskSection title={tr('overdue')} tone="danger" tasks={overdue} onToggle={onToggle} />}
        {todayTasks.length > 0 ? <TaskSection title={tr('today').toUpperCase()} tasks={todayTasks} onToggle={onToggle} /> : !overdue.length ? (
          <div className="empty-card"><CheckCircle2 size={23} /><div><strong>{tr('allClearToday')}</strong><p>{tr('allClearDesc')}</p></div></div>
        ) : null}
      </section>

      <section className="today-two-column">
        <div className="today-panel">
          <div className="today-panel-head">
            <div><p className="section-kicker">{tr('paymentAttention')}</p><h3>{tr('paymentAttentionDesc')}</h3></div>
            <button className="text-button" onClick={onViewPayments}>{tr('viewPayments')}</button>
          </div>
          {paymentAttention.length > 0 ? <div className="today-payment-list">
            {paymentAttention.slice(0, 4).map(payment => (
              <div className="today-payment-row" key={payment.id}>
                <div className={payment.dueDateProvided !== false && payment.dueDate < todayKey ? 'today-payment-icon overdue' : 'today-payment-icon'}><CircleDollarSign size={17} /></div>
                <div className="today-payment-info"><strong>{payment.client}</strong><span>{formatMoney(payment.amount, payment.currency)} · {payment.dueDateProvided !== false && payment.dueDate < currentTodayKey() ? (currentLanguage === 'pt' ? 'Atrasado' : 'Overdue') : (currentLanguage === 'pt' ? 'Vence hoje' : 'Due today')}</span></div>
                <button className="secondary-button compact" onClick={() => onMarkPaid(payment.id)}>{tr('markPaidToday')}</button>
              </div>
            ))}
          </div> : <div className="today-panel-empty"><CheckCircle2 size={19} /><span>{tr('noPaymentAttention')}</span></div>}
        </div>

        <div className="today-panel">
          <div className="today-panel-head">
            <div><p className="section-kicker">{tr('upcomingWork')}</p><h3>{tr('upcomingDesc')}</h3></div>
            <button className="text-button" onClick={onViewTasks}>{tr('viewAllTasks')}</button>
          </div>
          {upcomingTasks.length > 0 ? <div className="today-upcoming-list">
            {upcomingTasks.map(task => <TaskRow key={task.id} task={task} onToggle={onToggle} disabled={busyTaskId === task.id} />)}
          </div> : <div className="today-panel-empty"><Clock3 size={19} /><span>{tr('noUpcoming')}</span></div>}
        </div>
      </section>

      <div className="today-footer-actions">
        <button className="secondary-button" onClick={onAddTask}><Plus size={16} /> {tr('addTaskToday')}</button>
        <button className="secondary-button" onClick={onPlanner}><Bot size={16} /> {tr('organize')}</button>
      </div>

      <div className="summary-line">{openTasks.length} {tr('open').toLowerCase()} · {pendingMoneyLabel(pendingPayments)} {tr('pending')}</div>
    </div>
  )
}

function TaskSection({ title, tone, tasks, onToggle }: { title: string; tone?: 'danger'; tasks: Task[]; onToggle: (id: string) => void }) {
  return <section className="task-section"><div className={tone === 'danger' ? 'task-section-title danger' : 'task-section-title'}>{tone === 'danger' && '● '}{title}</div>{tasks.map(task => <TaskRow key={task.id} task={task} onToggle={onToggle} />)}</section>
}

function TaskRow({ task, onToggle, disabled }: { task: Task; onToggle: (id: string) => void; disabled?: boolean }) {
  return (
    <div className="task-row">
      <button type="button" disabled={disabled} className={task.status === 'completed' ? 'check-box checked' : 'check-box'} onClick={() => onToggle(task.id)} aria-label={task.status === 'completed' ? (currentLanguage === 'pt' ? 'Reabrir tarefa' : 'Reopen task') : (currentLanguage === 'pt' ? 'Concluir tarefa' : 'Complete task')} aria-busy={disabled}>
        {task.status === 'completed' && <Check size={14} />}
      </button>
      <div className="task-info"><strong>{task.title}</strong><span>{task.client} · {formatDate(task.dueDate, task.dueDateProvided !== false)}</span></div>
      <PriorityBadge priority={task.priority} />
    </div>
  )
}

function TasksView({ tasks, onToggle, onAdd, busyTaskId }: { tasks: Task[]; onToggle: (id: string) => void; onAdd: () => void; busyTaskId: string | null }) {
  const [filter, setFilter] = useState<'all' | 'open' | 'completed'>('open')
  const [priority, setPriority] = useState<'all' | Priority>('all')
  const [search, setSearch] = useState('')
  const todayKey = currentTodayKey()
  const openTasks = tasks.filter(t => t.status === 'open')
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const overdueCount = openTasks.filter(t => t.dueDateProvided !== false && t.dueDate < todayKey).length
  const todayCount = openTasks.filter(t => t.dueDateProvided !== false && t.dueDate === todayKey).length
  const completionRate = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0
  const progressLabel = tasks.length ? `${completedTasks.length} ${currentLanguage === 'pt' ? 'de' : 'of'} ${tasks.length} ${currentLanguage === 'pt' ? 'tarefas concluídas' : 'tasks completed'}` : (currentLanguage === 'pt' ? 'Nenhuma tarefa criada ainda' : 'No tasks created yet')

  const filtered = tasks
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => priority === 'all' || t.priority === priority)
    .filter(t => {
      const q = search.trim().toLowerCase()
      return !q || t.title.toLowerCase().includes(q) || t.client.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'open' ? -1 : 1
      if (a.dueDate !== b.dueDate) return (a.dueDateProvided === false ? '9999-12-31' : a.dueDate).localeCompare(b.dueDateProvided === false ? '9999-12-31' : b.dueDate)
      const rank = { high: 0, medium: 1, low: 2 }
      return rank[a.priority] - rank[b.priority]
    })

  const groups = [
    { key: 'overdue', label: tr('overdueTasks'), items: filtered.filter(t => t.status === 'open' && t.dueDateProvided !== false && t.dueDate < todayKey), tone: 'danger' as const },
    { key: 'today', label: tr('todayTasks'), items: filtered.filter(t => t.status === 'open' && t.dueDateProvided !== false && t.dueDate === todayKey), tone: 'today' as const },
    { key: 'upcoming', label: tr('upcomingTasks'), items: filtered.filter(t => t.status === 'open' && t.dueDateProvided !== false && t.dueDate > todayKey), tone: 'upcoming' as const },
    { key: 'no-deadline', label: tr('noDueDate'), items: filtered.filter(t => t.status === 'open' && t.dueDateProvided === false), tone: 'upcoming' as const },
    { key: 'completed', label: tr('completedTasks'), items: filtered.filter(t => t.status === 'completed'), tone: 'completed' as const },
  ].filter(group => group.items.length)

  return <div className="content-stack tasks-page">
    <div className="page-intro tasks-page-intro">
      <div><p className="section-kicker">{tr('workQueue')}</p><h2>{tr('tasksHeadline')}</h2><p className="page-description">{tr('tasksDescription')}</p></div>
      <button className="primary-button" onClick={onAdd}><Plus size={17} /> {tr('addTask')}</button>
    </div>

    <section className="tasks-overview">
      <div className="tasks-overview-main">
        <div><span>{currentLanguage === 'pt' ? 'Progresso geral' : 'Overall progress'}</span><strong>{completionRate}%</strong></div>
        <div className="tasks-progress-track"><span style={{width: completionRate + '%'}} /></div>
        <small>{progressLabel}</small>
      </div>
      <div className="task-stat"><span>{tr('open')}</span><strong>{openTasks.length}</strong></div>
      <div className={overdueCount ? 'task-stat danger' : 'task-stat'}><span>{tr('overdueTasks')}</span><strong>{overdueCount}</strong></div>
      <div className={todayCount ? 'task-stat attention' : 'task-stat'}><span>{tr('todayTasks')}</span><strong>{todayCount}</strong></div>
    </section>

    <div className="tasks-toolbar">
      <div className="task-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder={tr('taskSearch')} aria-label={tr('taskSearch')} />{search && <button type="button" onClick={() => setSearch('')} aria-label={tr('clearSearch')}>×</button>}</div>
      <select value={priority} onChange={e => setPriority(e.target.value as 'all' | Priority)} aria-label={tr('priorityFilter')}>
        <option value="all">{tr('allPriorities')}</option><option value="high">{tr('high')}</option><option value="medium">{tr('medium')}</option><option value="low">{tr('low')}</option>
      </select>
    </div>

    <div className="filter-tabs">{(['open', 'completed', 'all'] as const).map(item => <button key={item} className={filter === item ? 'filter-tab active' : 'filter-tab'} onClick={() => setFilter(item)}>{item === 'open' ? tr('open') : item === 'completed' ? tr('completed') : tr('all')} <span>{tasks.filter(t => item === 'all' || t.status === item).length}</span></button>)}</div>

    {groups.length ? <div className="tasks-groups">
      {groups.map(group => <section className="tasks-group" key={group.key}>
        <div className={"tasks-group-head " + group.tone}><div><span className="section-kicker">{group.label}</span><strong>{group.items.length}</strong></div></div>
        <div className="card-list">{group.items.map(task => <TaskRow key={task.id} task={task} onToggle={onToggle} disabled={busyTaskId === task.id} />)}</div>
      </section>)}
    </div> : <div className="empty-card tasks-empty"><ListTodo size={23} /><div><strong>{tr('noTasks')}</strong><p>{tr('noTasksDesc')}</p><button className="secondary-button" onClick={onAdd}><Plus size={15} /> {tr('addTask')}</button></div></div>}
  </div>
}

function ClientsView({ clients, tasks, payments }: { clients: Client[]; tasks: Task[]; payments: Payment[] }) {
  const [search, setSearch] = useState('')
  const todayKey = currentTodayKey()
  const query = search.trim().toLowerCase()

  const rows = clients.map(client => {
    const name = client.name.trim().toLowerCase()
    const clientTasks = tasks.filter(task => task.client.trim().toLowerCase() === name)
    const openTasks = clientTasks.filter(task => task.status === 'open')
    const overdueTasks = openTasks.filter(task => task.dueDateProvided !== false && task.dueDate < todayKey)
    const paidTasks = clientTasks.filter(task => task.status === 'completed')
    const pendingPayments = payments.filter(payment => payment.client.trim().toLowerCase() === name && payment.status === 'pending')
    const pendingByCurrency = [...new Set(pendingPayments.map(payment => payment.currency))].map(currency => ({
      currency,
      amount: pendingPayments.filter(payment => payment.currency === currency).reduce((sum, payment) => sum + payment.amount, 0),
    }))
    return {
      client,
      clientTasks,
      openTasks,
      overdueTasks,
      pendingPayments,
      pendingByCurrency,
      completion: clientTasks.length ? Math.round((paidTasks.length / clientTasks.length) * 100) : 0,
    }
  }).filter(row => !query || row.client.name.toLowerCase().includes(query))
    .sort((a, b) => b.overdueTasks.length - a.overdueTasks.length || b.pendingPayments.length - a.pendingPayments.length || a.client.name.localeCompare(b.client.name))

  const totalOpen = clients.reduce((sum, client) => sum + tasks.filter(t => t.client.trim().toLowerCase() === client.name.trim().toLowerCase() && t.status === 'open').length, 0)
  const totalOverdue = clients.reduce((sum, client) => sum + tasks.filter(t => t.client.trim().toLowerCase() === client.name.trim().toLowerCase() && t.status === 'open' && t.dueDateProvided !== false && t.dueDate < todayKey).length, 0)
  const clientsWithMoney = clients.filter(client => payments.some(p => p.client.trim().toLowerCase() === client.name.trim().toLowerCase() && p.status === 'pending')).length

  return <div className="content-stack clients-page">
    <div className="page-intro clients-page-intro">
      <div><p className="section-kicker">{tr('clients')}</p><h2>{tr('clientsHeadline')}</h2><p className="page-description">{tr('clientsDescription')}</p></div>
    </div>

    <section className="clients-overview">
      <div><span>{tr('clients')}</span><strong>{clients.length}</strong><small>{currentLanguage === 'pt' ? 'clientes ativos' : 'active clients'}</small></div>
      <div><span>{tr('openWork')}</span><strong>{totalOpen}</strong><small>{currentLanguage === 'pt' ? 'tarefas abertas' : 'open tasks'}</small></div>
      <div className={totalOverdue ? 'danger' : ''}><span>{tr('overdueTasks')}</span><strong>{totalOverdue}</strong><small>{currentLanguage === 'pt' ? 'precisam de atenção' : 'need attention'}</small></div>
      <div className={clientsWithMoney ? 'money' : ''}><span>{currentLanguage === 'pt' ? 'Pagamentos pendentes' : 'Pending payments'}</span><strong>{clientsWithMoney}</strong><small>{currentLanguage === 'pt' ? 'clientes com valores a receber' : 'clients with money due'}</small></div>
    </section>

    {clients.length > 0 && <div className="clients-toolbar">
      <div className="client-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder={currentLanguage === 'pt' ? 'Pesquisar clientes' : 'Search clients'} aria-label={currentLanguage === 'pt' ? 'Pesquisar clientes' : 'Search clients'} />{search && <button type="button" onClick={() => setSearch('')} aria-label={currentLanguage === 'pt' ? 'Limpar pesquisa' : 'Clear search'}>×</button>}</div>
      <span className="client-count">{rows.length} / {clients.length}</span>
    </div>}

    {clients.length === 0 ? (
      <div className="empty-card clients-empty"><Users size={23} /><div><strong>{currentLanguage === 'pt' ? 'Nenhum cliente ainda' : 'No clients yet'}</strong><p>{currentLanguage === 'pt' ? 'Os clientes aparecem aqui quando você os associa a uma tarefa ou pagamento.' : 'Clients appear here when you associate them with a task or payment.'}</p></div></div>
    ) : rows.length === 0 ? (
      <div className="empty-card clients-empty"><Users size={23} /><div><strong>{currentLanguage === 'pt' ? 'Nenhum cliente encontrado' : 'No clients found'}</strong><p>{currentLanguage === 'pt' ? 'Tente outro nome de cliente.' : 'Try a different client name.'}</p></div></div>
    ) : (
      <div className="client-grid">{rows.map(row => {
        const initials = row.client.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
        return <article className="client-card enriched" key={row.client.id}>
          <div className="client-card-head"><div className="avatar">{initials}</div><div className="client-heading"><strong>{row.client.name}</strong><span>{row.clientTasks.length} {row.clientTasks.length === 1 ? tr('task').toLowerCase() : tr('tasks').toLowerCase()}</span></div></div>
          <div className="client-metrics">
            <div><span>{tr('open')}</span><strong>{row.openTasks.length}</strong></div>
            <div><span>{tr('overdueTasks')}</span><strong className={row.overdueTasks.length ? 'danger-text' : ''}>{row.overdueTasks.length}</strong></div>
            <div><span>{tr('completed')}</span><strong>{row.completion}%</strong><small>{row.clientTasks.length ? (row.clientTasks.filter(task => task.status === 'completed').length + '/' + row.clientTasks.length) : (currentLanguage === 'pt' ? 'Sem tarefas' : 'No tasks')}</small></div>
          </div>
          <div className="client-progress"><span style={{ width: row.completion + '%' }} /></div>
          <div className="client-card-footer">
            <span className={row.pendingPayments.length ? 'client-money pending' : 'client-money'}><CircleDollarSign size={14} />{row.pendingPayments.length ? row.pendingByCurrency.map(item => formatMoney(item.amount, item.currency)).join(' · ') : (currentLanguage === 'pt' ? 'Sem pagamentos pendentes' : 'No pending payments')}</span>
            {row.overdueTasks.length > 0 && <span className="client-alert">{currentLanguage === 'pt' ? 'Atenção' : 'Needs attention'}</span>}
          </div>
        </article>
      })}</div>
    )}
  </div>
}

function AddClientModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string) => Promise<void> }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    const normalized = name.trim()
    if (!normalized) {
      setError(tr('noClientName'))
      return
    }
    setSaving(true)
    setError('')
    try {
      await onAdd(normalized)
      onClose()
    } catch (err) {
      console.error('LifeDue client creation failed:', err)
      setError(currentLanguage === 'pt' ? 'Não foi possível adicionar este cliente.' : 'Could not add this client.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e => e.stopPropagation()}>
    <div className="modal-head"><div><p className="section-kicker">{tr('addClient')}</p><h2>{tr('addClientTitle')}</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div>
    <label>{tr('clientName')}<input value={name} onChange={e => { setName(e.target.value); setError('') }} placeholder={tr('clientNamePlaceholder')} autoFocus onKeyDown={e => { if (e.key === 'Enter') void submit() }} /></label>
    {error && <div className="auth-error">{error}</div>}
    <div className="modal-actions"><button className="secondary-button" onClick={onClose} disabled={saving}>{tr('cancel')}</button><button className="primary-button" onClick={() => void submit()} disabled={saving || !name.trim()}>{saving ? (currentLanguage === 'pt' ? 'A guardar…' : 'Saving…') : tr('addClient')}</button></div>
  </div></div>
}

function PaymentsView({ payments, onMarkPaid, onAdd }: { payments: Payment[]; onMarkPaid: (id: string) => void; onAdd: () => void }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('pending')
  const [search, setSearch] = useState('')
  const todayKey = currentTodayKey()
  const pending = payments.filter(p => p.status === 'pending')
  const paid = payments.filter(p => p.status === 'paid')
  const overdue = pending.filter(p => p.dueDateProvided !== false && p.dueDate < todayKey)
  const query = search.trim().toLowerCase()
  const filtered = payments.filter(payment => {
    const isOverdue = payment.status === 'pending' && payment.dueDateProvided !== false && payment.dueDate < todayKey
    const matchesFilter = filter === 'all' ? true : filter === 'paid' ? payment.status === 'paid' : filter === 'overdue' ? isOverdue : payment.status === 'pending'
    const matchesSearch = !query || payment.client.toLowerCase().includes(query)
    return matchesFilter && matchesSearch
  }).sort((a, b) => {
    const aOverdue = a.status === 'pending' && a.dueDateProvided !== false && a.dueDate < todayKey
    const bOverdue = b.status === 'pending' && b.dueDateProvided !== false && b.dueDate < todayKey
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1
    if (a.dueDate !== b.dueDate) return (a.dueDateProvided === false ? '9999-12-31' : a.dueDate).localeCompare(b.dueDateProvided === false ? '9999-12-31' : b.dueDate)
    return a.client.localeCompare(b.client)
  })

  const pendingByCurrency = [...new Set(pending.map(p => p.currency))].map(currency => ({
    currency,
    amount: pending.filter(p => p.currency === currency).reduce((sum, p) => sum + p.amount, 0),
  }))
  const paidByCurrency = [...new Set(paid.map(p => p.currency))].map(currency => ({
    currency,
    amount: paid.filter(p => p.currency === currency).reduce((sum, p) => sum + p.amount, 0),
  }))

  return <div className="content-stack payments-page">
    <div className="page-intro payments-page-intro">
      <div><p className="section-kicker">{tr('moneyDue')}</p><h2>{tr('paymentsHeadline')}</h2><p className="page-description">{tr('paymentsDescription')}</p></div>
      <button className="primary-button" onClick={onAdd}><Plus size={17} /> {tr('addPayment')}</button>
    </div>

    <section className="payments-overview">
      <div className="payment-overview-main"><span>{tr('paymentPendingAmount')}</span><strong>{pendingByCurrency.length ? pendingByCurrency.map(item => formatMoney(item.amount, item.currency)).join(' · ') : formatMoney(0, 'USD')}</strong><small>{pending.length} {currentLanguage === 'pt' ? (pending.length === 1 ? 'pendente' : 'pendentes') : (pending.length === 1 ? 'pending' : 'pending')}</small></div>
      <div><span>{tr('paymentPendingCount')}</span><strong>{pending.length}</strong><small>{currentLanguage === 'pt' ? (pending.length === 1 ? 'pagamento em aberto' : 'pagamentos em aberto') : (pending.length === 1 ? 'open payment' : 'open payments')}</small></div>
      <div className={overdue.length ? 'danger' : ''}><span>{tr('paymentOverdueCount')}</span><strong>{overdue.length}</strong><small>{currentLanguage === 'pt' ? 'precisam de atenção' : 'need attention'}</small></div>
      <div><span>{tr('paymentPaidCount')}</span><strong>{paid.length}</strong><small>{currentLanguage === 'pt' ? 'já recebidos' : 'already received'}</small></div>
    </section>

    <div className="payments-toolbar">
      <div className="payment-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder={tr('paymentSearch')} aria-label={tr('paymentSearch')} />{search && <button type="button" onClick={() => setSearch('')} aria-label={tr('clearSearch')}>×</button>}</div>
          </div>

    <div className="filter-tabs payment-tabs">{(['pending', 'overdue', 'paid', 'all'] as const).map(item => <button key={item} className={filter === item ? 'filter-tab active' : 'filter-tab'} onClick={() => setFilter(item)}>{item === 'pending' ? tr('paymentPending') : item === 'overdue' ? tr('paymentOverdue') : item === 'paid' ? tr('paymentPaid') : tr('paymentAll')} <span>{item === 'pending' ? pending.length : item === 'overdue' ? overdue.length : item === 'paid' ? paid.length : payments.length}</span></button>)}</div>

    {filtered.length ? <div className="payment-list">{filtered.map(payment => <PaymentRow key={payment.id} payment={payment} onMarkPaid={onMarkPaid} />)}</div> : <div className="empty-card payment-empty"><CheckCircle2 size={23} /><div><strong>{payments.length ? tr('paymentNoResults') : tr('clear')}</strong><p>{payments.length ? tr('paymentNoResultsDesc') : tr('noPending')}</p>{!payments.length && <button className="secondary-button" onClick={onAdd}><Plus size={15} /> {tr('addPayment')}</button>}</div></div>}

    {payments.length > 0 && <section className="payment-currency-summary">
      <div><strong>{currentLanguage === 'pt' ? 'Resumo financeiro' : 'Financial summary'}</strong>{pendingByCurrency.map(item => <span key={item.currency}>{currentLanguage === 'pt' ? 'A receber' : 'To collect'}: {formatMoney(item.amount, item.currency)}</span>)}{paidByCurrency.map(item => <span key={'paid-'+item.currency}>{currentLanguage === 'pt' ? 'Já recebidos' : 'Already received'}: {formatMoney(item.amount, item.currency)}</span>)}</div>
    </section>}
  </div>
}


function PaymentRow({ payment, onMarkPaid }: { payment: Payment; onMarkPaid: (id: string) => void }) {
  const isOverdue = payment.status === 'pending' && payment.dueDateProvided !== false && payment.dueDate < currentTodayKey()
  return <div className={isOverdue ? 'payment-row overdue-row' : 'payment-row'}><div className={isOverdue ? 'payment-icon overdue' : 'payment-icon'}><CircleDollarSign size={19} /></div><div className="payment-info"><strong>{formatMoney(payment.amount, payment.currency)} · {payment.client}</strong><span>{payment.status === 'paid' ? tr('paid') : isOverdue ? tr('paymentOverdueLabel') + ' · ' + tr('paymentDue').toLowerCase() + ' ' + formatDate(payment.dueDate, payment.dueDateProvided !== false) : tr('paymentDue') + ' ' + formatDate(payment.dueDate, payment.dueDateProvided !== false)}</span></div>{payment.status === 'pending' ? <button className="secondary-button" onClick={() => onMarkPaid(payment.id)}>{tr('markPaid')}</button> : <span className="paid-label"><Check size={15} /> {tr('paid')}</span>}</div>
}


function PlannerView({ plan, openTasks, aiLoading, isAuthenticated, plannerError, plannerSource, aiUsage, onGenerate, onAddTask, onViewTasks }: { plan: Task[]; openTasks: Task[]; aiLoading: boolean; isAuthenticated: boolean; plannerError: string; plannerSource: 'ai' | 'local' | null; aiUsage: AiUsage; onGenerate: () => void; onAddTask: () => void; onViewTasks: () => void }) {
  const todayKey = currentTodayKey()
  const overdueCount = openTasks.filter(task => task.dueDateProvided !== false && task.dueDate < todayKey).length
  const todayCount = openTasks.filter(task => task.dueDateProvided !== false && task.dueDate === todayKey).length
  const upcomingCount = openTasks.filter(task => task.dueDateProvided !== false && task.dueDate > todayKey).length
  const readyTitle = plannerSource === 'ai' ? tr('plannerAiReady') : tr('plannerLocalReady')
  const readyDesc = plannerSource === 'ai' ? tr('plannerAiDesc') : tr('plannerLocalDesc')

  return <div className="content-stack planner-page">
    <div className="page-intro"><div><p className="section-kicker">{tr('aiPlanner')}</p><h2>{tr('calmer')}</h2><p className="page-description">{tr('plannerDesc')}</p><div className="planner-how-it-works"><span className="planner-how-icon">i</span><div><strong>{tr('plannerHowItWorks')}</strong><p>{tr('plannerHowItWorksDesc')}</p></div><span className="planner-info-tooltip" tabIndex={0} title={tr('plannerPlannerInfo')} aria-label={tr('plannerPlannerInfo')}>i</span></div></div><button className="primary-button" onClick={onGenerate} disabled={aiLoading || !openTasks.length}><Sparkles size={16} className={aiLoading ? 'spin' : ''} /> {aiLoading ? (currentLanguage === 'pt' ? 'A organizar…' : 'Organizing…') : tr('generatePlan')}</button></div>
    <div className="planner-credit-note" role="status"><Sparkles size={14} /><div><strong>{aiUsage.remaining > 0 ? tr('aiUsesRemaining').replace('{n}', String(aiUsage.remaining)) : tr('aiUsageExhausted')}</strong><span>{tr('aiUsageShared')} · {tr('aiUsageReset')}</span></div></div>
    <div className="planner-overview"><div><span>{tr('plannerOpen')}</span><strong>{openTasks.length}</strong></div><div className={overdueCount ? 'danger' : ''}><span>{tr('plannerOverdue')}</span><strong>{overdueCount}</strong></div><div className={todayCount ? 'attention' : ''}><span>{tr('plannerToday')}</span><strong>{todayCount}</strong></div><div><span>{tr('plannerUpcoming')}</span><strong>{upcomingCount}</strong></div></div>
    {plannerError && <div className="planner-error" role="alert"><Bot size={16} /><span>{plannerError}</span></div>}
    <div className="planner-card">
      <div className="planner-hero"><div className="planner-bot"><Bot size={26} /></div><div><strong>{plan.length ? readyTitle : tr('openItems')}</strong><p>{plan.length ? readyDesc : tr('generateOrder')}</p></div></div>
      {!plan.length ? <div className="planner-empty"><Sparkles size={22} /><div><strong>{tr('plannerEmptyTitle')}</strong><p>{tr('plannerEmptyDesc')}</p><button className="secondary-button" onClick={onAddTask}><Plus size={15} /> {tr('addTaskToPlan')}</button></div></div> : <div className="plan-list">{plan.map((task,index) => <div className="plan-item" key={task.id}><span className="plan-number">{index + 1}</span><div className="plan-date">{formatDate(task.dueDate, task.dueDateProvided !== false)}</div><div className="plan-main"><strong>{task.title}</strong><small>{task.client}</small></div><span className={task.priority === 'high' ? 'plan-priority high' : task.priority === 'medium' ? 'plan-priority medium' : 'plan-priority low'}>{task.priority}</span></div>)}</div>}
      {plan.length > 0 && <div className="planner-actions"><button className="secondary-button" onClick={onViewTasks}><ListTodo size={16} /> {tr('viewTasks')}</button></div>}
      {!isAuthenticated && plan.length > 0 && <div className="planner-note"><Bot size={14} /> {tr('plannerFallback')}</div>}
    </div>
  </div>
}

function NextStepCard({ type, client, onAction, onDismiss }: { type: 'payment' | 'task'; client: string; onAction: () => void; onDismiss: () => void }) {
  const isPayment = type === 'payment'
  const title = isPayment ? (currentLanguage === 'pt' ? `Próximo passo para ${client}` : `A useful next step for ${client}`) : (currentLanguage === 'pt' ? `Continue a organizar ${client}` : `Keep ${client} organized`)
  const message = isPayment ? (currentLanguage === 'pt' ? `Resta adicionar um pagamento para ${client}?` : `Does ${client} also have a payment to track?`) : (currentLanguage === 'pt' ? `Quer adicionar uma tarefa para ${client}?` : `Would you like to add a task for ${client}?`)
  return <div className="next-step-card" role="status">
    <div className="next-step-icon">{isPayment ? <CircleDollarSign size={18} /> : <ListTodo size={18} />}</div>
    <div className="next-step-copy"><strong>{title}</strong><span>{message}</span></div>
    <div className="next-step-actions"><button className="primary-button" onClick={onAction}>{isPayment ? (currentLanguage === 'pt' ? 'Adicionar pagamento' : 'Add payment') : (currentLanguage === 'pt' ? 'Adicionar tarefa' : 'Add task')}</button><button className="text-button" onClick={onDismiss}>{currentLanguage === 'pt' ? 'Agora não' : 'Not now'}</button></div>
    <button className="icon-button next-step-close" onClick={onDismiss} aria-label={currentLanguage === 'pt' ? 'Fechar sugestão' : 'Dismiss suggestion'}><X size={16} /></button>
  </div>
}
function AddPaymentModal({ onClose, onAdd, clients, initialClient = '' }: { onClose: () => void; onAdd: (payment: Omit<Payment, 'id' | 'status'>) => void; clients: Client[]; initialClient?: string }) {
  const [client, setClient] = useState(initialClient)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [dueDate, setDueDate] = useState(currentTodayKey())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = () => {
    if (saving) return
    const cleanClient = client.trim()
    const normalizedAmount = amount.trim().replace(',', '.')
    const value = Number(normalizedAmount)
    const matchedClient = clients.find(item => item.name.trim().toLocaleLowerCase() === cleanClient.toLocaleLowerCase())
    const clientName = matchedClient?.name ?? cleanClient

    if (!cleanClient) return setError(currentLanguage === 'pt' ? 'Digite o nome do cliente.' : 'Enter the client name.')
    if (!normalizedAmount || !Number.isFinite(value) || value <= 0 || !/^\d+(?:\.\d{1,2})?$/.test(normalizedAmount)) {
      return setError(currentLanguage === 'pt' ? 'Digite um valor positivo com no máximo 2 casas decimais.' : 'Enter a positive amount with up to 2 decimal places.')
    }
    if (value > 999999999) return setError(currentLanguage === 'pt' ? 'O valor é demasiado alto.' : 'The amount is too large.')
    if (!isValidDueDate(dueDate)) {
      return setError(currentLanguage === 'pt' ? 'Escolha uma data de vencimento válida a partir de hoje.' : 'Choose a valid payment due date from today onward.')
    }

    setError('')
    setSaving(true)
    try {
      onAdd({ client: clientName, amount: value, currency, dueDate })
    } catch (submitError) {
      console.error('LifeDue add payment modal failed:', submitError)
      setError(currentLanguage === 'pt' ? 'Não foi possível adicionar o pagamento. Tente novamente.' : 'Could not add the payment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className="modal" onMouseDown={e => e.stopPropagation()}>
      <div className="modal-head">
        <div><p className="section-kicker">{tr('newPayment')}</p><h2>{tr('addPaymentTitle')}</h2></div>
        <button type="button" className="icon-button" onClick={onClose} disabled={saving} aria-label={currentLanguage === 'pt' ? 'Fechar' : 'Close'}><X size={20} /></button>
      </div>
      <label>{tr('client')}<input list="lifedue-client-suggestions" value={client} onChange={e => { setClient(e.target.value); setError('') }} placeholder={currentLanguage==='pt'?'ex.: Maria':'e.g. Maria'} autoFocus disabled={saving} /><datalist id="lifedue-client-suggestions">{clients.map(item => <option key={item.id} value={item.name} />)}</datalist></label>
      <div className="form-grid">
        <label>{tr('amount')}<input type="text" inputMode="decimal" value={amount} onChange={e => { setAmount(e.target.value); setError('') }} placeholder={currentLanguage === 'pt' ? 'ex.: 200,00' : 'e.g. 200.00'} disabled={saving} aria-describedby="lifedue-payment-amount-help" /><small id="lifedue-payment-amount-help" className="field-help">{currentLanguage === 'pt' ? 'Use um valor positivo, até 2 casas decimais.' : 'Use a positive amount, up to 2 decimal places.'}</small></label>
        <label>{tr('currency')}<select value={currency} onChange={e => setCurrency(e.target.value)} disabled={saving}><option value="USD">{tr('usd')} · US$</option><option value="EUR">{tr('eur')} · €</option><option value="AOA">{tr('aoa')} · Kz</option></select></label>
      </div>
      <label>{tr('dueDate')}<input type="date" value={dueDate} min={currentTodayKey()} onChange={e => { setDueDate(e.target.value); setError('') }} disabled={saving} aria-describedby="lifedue-payment-date-help" /><small id="lifedue-payment-date-help" className="field-help">{currentLanguage === 'pt' ? 'Hoje ou uma data futura.' : 'Today or a future date.'}</small></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>{tr('cancel')}</button>
        <button type="button" className="primary-button" onClick={submit} disabled={saving || !client.trim() || !amount.trim()}>{saving ? (currentLanguage === 'pt' ? 'A guardar…' : 'Saving…') : tr('addPayment')}</button>
      </div>
    </div>
  </div>
}

function AddTaskModal({ onClose, onAdd, clients, initialClient = '' }: { onClose: () => void; onAdd: (task: Omit<Task, 'id' | 'status'>) => Promise<void> | void; clients: Client[]; initialClient?: string }) {
  const [title, setTitle] = useState('')
  const [client, setClient] = useState(initialClient)
  const [dueDate, setDueDate] = useState(addDays(0))
  const [priority, setPriority] = useState<Priority>('medium')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const cleanTitle = title.trim()
    const cleanClient = client.trim()
    const matchedClient = clients.find(item => item.name.trim().toLocaleLowerCase() === cleanClient.toLocaleLowerCase())
    const canonicalClient = matchedClient?.name ?? cleanClient
    if (!cleanTitle) {
      setError(currentLanguage === 'pt' ? 'Digite o que precisa ser feito.' : 'Enter the task you need to complete.')
      return
    }
    if (!cleanClient) {
      setError(currentLanguage === 'pt' ? 'Digite o nome do cliente.' : 'Enter the client name.')
      return
    }
    if (!isValidDueDate(dueDate)) {
      setError(currentLanguage === 'pt' ? 'Escolha uma data de entrega válida a partir de hoje.' : 'Choose a valid due date from today onward.')
      return
    }
    if (saving) return

    setError('')
    setSaving(true)
    try {
      await onAdd({ title: cleanTitle, client: canonicalClient, dueDate, priority })
    } catch (error) {
      console.error('LifeDue add task modal failed:', error)
      setError(currentLanguage === 'pt' ? 'Não foi possível adicionar a tarefa. Tente novamente.' : 'Could not add the task. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className="modal task-modal" onMouseDown={e => e.stopPropagation()}>
      <div className="modal-head">
        <div><p className="section-kicker">{tr('newTask')}</p><h2>{tr('addTaskTitle')}</h2></div>
        <button type="button" className="icon-button" onClick={onClose} disabled={saving} aria-label={currentLanguage === 'pt' ? 'Fechar' : 'Close'}><X size={20} /></button>
      </div>
      <label>{tr('task')}<input value={title} onChange={e => { setTitle(e.target.value); setError('') }} placeholder={tr('finishHomepage')} autoFocus disabled={saving} /></label>
      <label>{tr('client')}<input list="lifedue-task-client-suggestions" value={client} onChange={e => { setClient(e.target.value); setError('') }} placeholder={tr('john')} disabled={saving} /><datalist id="lifedue-task-client-suggestions">{clients.map(item => <option key={item.id} value={item.name} />)}</datalist></label>
      <div className="form-grid">
        <label>{tr('dueDate')}<input type="date" value={dueDate} onChange={e => { setDueDate(e.target.value); setError('') }} min={currentTodayKey()} disabled={saving} /></label>
        <label>{tr('priority')}<select value={priority} onChange={e => setPriority(e.target.value as Priority)} disabled={saving}><option value="low">{tr('low')}</option><option value="medium">{tr('medium')}</option><option value="high">{tr('high')}</option></select></label>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>{tr('cancel')}</button>
        <button type="button" className="primary-button" onClick={() => void submit()} disabled={saving}>
          {saving ? (currentLanguage === 'pt' ? 'A guardar…' : 'Saving…') : tr('addTask')}
        </button>
      </div>
    </div>
  </div>
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const label = priority === 'low' ? tr('low') : priority === 'medium' ? tr('medium') : tr('high')
  return <span className={'priority ' + priority}>{label}</span>
}

function getTodayGreeting() {
  const hour = new Date().getHours()
  if (currentLanguage === 'pt') {
    if (hour < 12) return tr('todayGreetingMorning')
    if (hour < 18) return tr('todayGreetingAfternoon')
    return tr('todayGreetingEvening')
  }
  if (hour < 12) return tr('todayGreetingMorning')
  if (hour < 18) return tr('todayGreetingAfternoon')
  return tr('todayGreetingEvening')
}

function isValidDueDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return false
  return value >= currentTodayKey()
}

function formatDate(value: string, provided = true) {
  if (!provided) return tr('noDueDate')
  const date = new Date(value + 'T00:00:00')
  if (value === currentTodayKey()) return tr('today')
  if (value === addDays(1)) return tr('tomorrow')
  return date.toLocaleDateString(currentLanguage === 'pt' ? 'pt-PT' : 'en-US', { month: 'short', day: 'numeric' })
}

export default App
