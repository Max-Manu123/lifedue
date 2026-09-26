export type TaskStatus = 'open' | 'completed'
export type Priority = 'low' | 'medium' | 'high'
export type PaymentCurrency = 'USD' | 'EUR' | 'BRL' | 'AOA' | 'GBP' | 'Other'

export interface QuickAddItem {
  kind: 'task' | 'payment'
  title: string
  client: string
  dueDate: string
  dueDateProvided?: boolean
  priority: Priority
  priorityProvided?: boolean
  amount?: number
  currency?: PaymentCurrency
}

export interface Task {
  id: string
  title: string
  client: string
  dueDate: string
  dueDateProvided?: boolean
  priority: Priority
  priorityProvided?: boolean
  sourceKey?: string
  status: TaskStatus
}

export interface Client {
  id: string
  name: string
}

export interface Payment {
  id: string
  client: string
  amount: number
  currency: string | null
  dueDate: string
  dueDateProvided?: boolean
  status: 'pending' | 'paid'
}
