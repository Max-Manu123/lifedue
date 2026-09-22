import type { SupabaseClient, User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Client, Payment, Task } from '../types'

type RemoteTask = {
  id: string
  title: string
  due_date: string
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
  return (data ?? []) as Client[]
}

export async function fetchPayments(user: User): Promise<Payment[]> {
  requireSupabaseUser(user)
  const { data, error } = await supabase!
    .from('payments')
    .select('id, amount, currency, due_date, status, client_id, clients(name)')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })
  if (error) throw error
  return ((data ?? []) as Array<{
    id: string
    amount: number
    currency: string
    due_date: string
    status: Payment['status']
    clients: { name: string } | { name: string }[] | null
  }>).map(payment => ({
    id: payment.id,
    client: clientName(payment.clients, 'No client'),
    amount: Number(payment.amount),
    currency: payment.currency,
    dueDate: payment.due_date,
    status: payment.status,
  }))
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
      status: 'pending',
    })
    .select('id, amount, currency, due_date, status, client_id, clients(name)')
    .single()
  if (error) throw error
  const row = data as {
    id: string
    amount: number
    currency: string
    due_date: string
    status: Payment['status']
    clients: { name: string } | { name: string }[] | null
  }
  return {
    id: row.id,
    client: clientName(row.clients, payment.client),
    amount: Number(row.amount),
    currency: row.currency,
    dueDate: row.due_date,
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

export async function fetchTasks(user: User): Promise<Task[]> {
  requireSupabaseUser(user)
  const { data, error } = await supabase!
    .from('tasks')
    .select('id, title, due_date, priority, status, client_id, clients(name)')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return ((data ?? []) as RemoteTask[]).map(task => ({
    id: task.id,
    title: task.title,
    client: clientName(task.clients, 'No client'),
    dueDate: task.due_date,
    priority: task.priority,
    status: task.status,
  }))
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

export async function createTasks(user: User, tasks: Omit<Task, 'id'>[]): Promise<Task[]> {
  requireSupabaseUser(user)
  const rows = []
  for (const task of tasks) {
    const clientId = await getOrCreateClient(user, task.client)
    rows.push({
      user_id: user.id,
      client_id: clientId,
      title: task.title.trim(),
      due_date: task.dueDate,
      priority: task.priority,
      status: task.status,
    })
  }
  if (!rows.length) return []

  const { data, error } = await supabase!
    .from('tasks')
    .insert(rows)
    .select('id, title, due_date, priority, status, client_id, clients(name)')
  if (error) throw error

  return (data as RemoteTask[]).map(task => ({
    id: task.id,
    title: task.title,
    client: clientName(task.clients, 'No client'),
    dueDate: task.due_date,
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
