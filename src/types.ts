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
  amount?: number
  currency?: PaymentCurrency
}

export interface Task {
  id: string
  title: string
  client: string
  dueDate: string
  priority: Priority
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
  status: 'pending' | 'paid'
}
