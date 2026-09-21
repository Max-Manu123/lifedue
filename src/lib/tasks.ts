import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Client, Task } from '../types'

type RemoteTask = {
  id: string
  title: string
  due_date: string
  priority: Task['priority']
  status: Task['status']
  client_id: string | null
  clients: { name: string } | null
}

function requireSupabaseUser(user: User | null) {
  if (!supabase || !user) throw new Error('Authentication is required for cloud tasks.')
  return user
}

export async function fetchClients(user: User): Promise<Client[]> {
  requireSupabaseUser(user)
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as Client[]
}

export async function fetchTasks(user: User): Promise<Task[]> {
  requireSupabaseUser(user)
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, due_date, priority, status, client_id, clients(name)')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return ((data ?? []) as RemoteTask[]).map(task => ({
    id: task.id,
    title: task.title,
    client: task.clients?.name ?? 'No client',
    dueDate: task.due_date,
    priority: task.priority,
    status: task.status,
  }))
}

async function getOrCreateClient(user: User, name: string): Promise<string> {
  requireSupabaseUser(user)
  const normalized = name.trim()
  const { data: existing, error: lookupError } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', normalized)
    .limit(1)
    .maybeSingle()
  if (lookupError) throw lookupError
  if (existing) return existing.id

  const { data: created, error: createError } = await supabase
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

  const { data, error } = await supabase
    .from('tasks')
    .insert(rows)
    .select('id, title, due_date, priority, status, client_id, clients(name)')
  if (error) throw error

  return (data as RemoteTask[]).map(task => ({
    id: task.id,
    title: task.title,
    client: task.clients?.name ?? 'No client',
    dueDate: task.due_date,
    priority: task.priority,
    status: task.status,
  }))
}

export async function updateTaskStatus(user: User, id: string, status: Task['status']) {
  requireSupabaseUser(user)
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}
