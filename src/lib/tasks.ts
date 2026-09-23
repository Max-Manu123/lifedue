import type { SupabaseClient, User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Client, Payment, Task } from '../types'

type RemoteTask = {
  id: string
  title: string
  due_date: string
  due_date_is_explicit: boolean
  priority: Task['priority']
  status: Task['status']
  client_id: string | null
  clients: { name: string } | { name: string }[] | null
}

function requireSupabaseUser(user: User | null): SupabaseClient {
  if (!supabase || !user) throw new Error('Authentication is required for cloud tasks.')
  return supabase!
}

function clientName(value: { name: string } | { name: string }[] | null | undefined, fallback: string) {
  if (Array.isArray(value)) return value[0]?.name ?? fallback
  return value?.name ?? fallback
}

export async function fetchClients(user: User): Promise<Client[]> {
  requireSupabaseUser(user)
  const { data, error } = await supabase!
    .from('clients')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name', { ascending: true })
  if (error) throw error
  const seen = new Set<string>()
  return ((data ?? []) as Client[]).filter(client => {
    const key = client.name.trim().toLocaleLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function fetchPayments(user: User): Promise<Payment[]> {
  requireSupabaseUser(user)
  const { data, error } = await supabase!
    .from('payments')
    .select('id, amount, currency, due_date, due_date_is_explicit, status, client_id, clients(name)')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })
  if (error) throw error
  const seen = new Set<string>()
  return ((data ?? []) as Array<{
    id: string
    amount: number
    currency: string | null
    due_date: string
    due_date_is_explicit: boolean
    status: Payment['status']
    clients: { name: string } | { name: string }[] | null
  }>).map(payment => ({
    id: payment.id,
    client: clientName(payment.clients, 'No client'),
    amount: Number(payment.amount),
    currency: payment.currency,
    dueDate: payment.due_date,
    dueDateProvided: payment.due_date_is_explicit,
    status: payment.status,
  })).filter(payment => {
    const key = `${payment.client.trim().toLowerCase()}|${payment.amount}|${payment.currency}|${payment.dueDate}|${payment.status}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function createPayment(user: User, payment: Omit<Payment, 'id' | 'status'>): Promise<Payment> {
  requireSupabaseUser(user)
  const clientId = await getOrCreateClient(user, payment.client)
  const { data, error } = await supabase!
    .from('payments')
    .insert({
      user_id: user.id,
      client_id: clientId,
      amount: payment.amount,
      currency: payment.currency,
      due_date: payment.dueDate,
      due_date_is_explicit: payment.dueDateProvided !== false,
      status: 'pending',
    })
    .select('id, amount, currency, due_date, due_date_is_explicit, status, client_id, clients(name)')
    .single()
  if (error) throw error
  const row = data as {
    id: string
    amount: number
    currency: string | null
    due_date: string
    due_date_is_explicit: boolean
    status: Payment['status']
    clients: { name: string } | { name: string }[] | null
  }
  return {
    id: row.id,
    client: clientName(row.clients, payment.client),
    amount: Number(row.amount),
    currency: row.currency,
    dueDate: row.due_date,
    dueDateProvided: row.due_date_is_explicit,
    status: row.status,
  }
}

export async function updatePaymentStatus(user: User, id: string, status: Payment['status']) {
  requireSupabaseUser(user)
  const { error } = await supabase!
    .from('payments')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}

export async function removeLegacyDemoTasks(user: User) {
  requireSupabaseUser(user)

  const { data: legacyTasks, error: taskFetchError } = await supabase!
    .from('tasks')
    .select('id,title,due_date')
    .eq('user_id', user.id)
    .or('title.eq.Deliver website,title.eq.Send proposal')

  if (taskFetchError) throw taskFetchError

  const demoTaskIds = ((legacyTasks ?? []) as Array<{ id: string; title: string; due_date: string }>)
    .filter(task =>
      (task.title === 'Deliver website' && task.due_date === '2026-09-24') ||
      (task.title === 'Send proposal' && task.due_date === '2026-09-27')
    )
    .map(task => task.id)

  if (demoTaskIds.length) {
    const { error } = await supabase!
      .from('tasks')
      .delete()
      .eq('user_id', user.id)
      .in('id', demoTaskIds)
    if (error) throw error
  }

  // Remove only the original seeded demo payments from the MVP.
  // These exact records are not part of user-created test data.
  const { data: legacyPayments, error: paymentFetchError } = await supabase!
    .from('payments')
    .select('id,amount,currency,due_date,clients(name)')
    .eq('user_id', user.id)

  if (paymentFetchError) throw paymentFetchError

  const demoPaymentIds = ((legacyPayments ?? []) as Array<{
    id: string
    amount: number
    currency: string
    due_date: string
    clients: { name: string } | { name: string }[] | null
  }>).filter(payment => {
    const name = Array.isArray(payment.clients) ? payment.clients[0]?.name : payment.clients?.name
    return (
      (name === 'Maria' && Number(payment.amount) === 200 && payment.currency === 'USD' && payment.due_date === '2026-09-21') ||
      (name === 'John' && Number(payment.amount) === 500 && payment.currency === 'USD' && payment.due_date === '2026-09-22')
    )
  }).map(payment => payment.id)

  if (demoPaymentIds.length) {
    const { error } = await supabase!
      .from('payments')
      .delete()
      .eq('user_id', user.id)
      .in('id', demoPaymentIds)
    if (error) throw error
  }

  // Remove the original empty demo clients. Foreign keys use ON DELETE SET NULL,
  // so this is safe after the exact demo records above are removed.
  const { error: clientDeleteError } = await supabase!
    .from('clients')
    .delete()
    .eq('user_id', user.id)
    .in('name', ['John', 'Pedro'])
  if (clientDeleteError) throw clientDeleteError
}
export async function fetchTasks(user: User): Promise<Task[]> {
  requireSupabaseUser(user)
  const { data, error } = await supabase!
    .from('tasks')
    .select('id, title, due_date, due_date_is_explicit, priority, status, client_id, clients(name)')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  const seen = new Set<string>()
  return ((data ?? []) as RemoteTask[]).map(task => ({
    id: task.id,
    title: task.title,
    client: clientName(task.clients, 'No client'),
    dueDate: task.due_date,
    dueDateProvided: task.due_date_is_explicit,
    priority: task.priority,
    status: task.status,
  })).filter(task => {
    const key = `${task.title.trim().toLowerCase()}|${task.client.trim().toLowerCase()}|${task.dueDate}|${task.status}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function getOrCreateClient(user: User, name: string): Promise<string> {
  requireSupabaseUser(user)
  const normalized = name.trim()
  const { data: existing, error: lookupError } = await supabase!
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', normalized)
    .limit(1)
    .maybeSingle()
  if (lookupError) throw lookupError
  if (existing) return existing.id

  const { data: created, error: createError } = await supabase!
    .from('clients')
    .insert({ user_id: user.id, name: normalized })
    .select('id')
    .single()
  if (createError) throw createError
  return created.id
}

export async function createClient(user: User, name: string): Promise<Client> {
  requireSupabaseUser(user)
  const normalized = name.trim()
  if (!normalized) throw new Error('Client name is required.')

  const { data: existing, error: lookupError } = await supabase!
    .from('clients')
    .select('id, name')
    .eq('user_id', user.id)
    .ilike('name', normalized)
    .limit(1)
    .maybeSingle()
  if (lookupError) throw lookupError
  if (existing) return existing as Client

  const { data, error } = await supabase!
    .from('clients')
    .insert({ user_id: user.id, name: normalized })
    .select('id, name')
    .single()
  if (error) throw error
  return data as Client
}

export async function createTasks(user: User, tasks: Omit<Task, 'id'>[]): Promise<Task[]> {
  requireSupabaseUser(user)
  const rows = []
  for (const task of tasks) {
    const clientId = task.client.trim() ? await getOrCreateClient(user, task.client) : null
    rows.push({
      user_id: user.id,
      client_id: clientId,
      title: task.title.trim(),
      due_date: task.dueDate,
      due_date_is_explicit: task.dueDateProvided !== false,
      priority: task.priority,
      status: task.status,
    })
  }
  if (!rows.length) return []

  const { data, error } = await supabase!
    .from('tasks')
    .insert(rows)
    .select('id, title, due_date, due_date_is_explicit, priority, status, client_id, clients(name)')
  if (error) throw error

  return (data as RemoteTask[]).map(task => ({
    id: task.id,
    title: task.title,
    client: clientName(task.clients, 'No client'),
    dueDate: task.due_date,
    dueDateProvided: task.due_date_is_explicit,
    priority: task.priority,
    status: task.status,
  }))
}

export async function updateTaskStatus(user: User, id: string, status: Task['status']) {
  requireSupabaseUser(user)
  const { data, error } = await supabase!
    .from('tasks')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, status')
    .single()
  if (error) throw error
  if (!data || data.status !== status) {
    throw new Error('Task status was not persisted.')
  }
  return data as { id: string; status: Task['status'] }
}
