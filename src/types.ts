export type TaskStatus = 'open' | 'completed'
export type Priority = 'low' | 'medium' | 'high'

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
  currency: string
  dueDate: string
  status: 'pending' | 'paid'
}
