import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface Task {
  id: number
  title: string
  category: string
  priority: string
  assignee: string
  status: string
  equipment: string
  due_date: string | null
  notes: string
  is_recurring: boolean
  recurring_interval: string
  recurring_day_of_week: number | null
  recurring_day_of_month: number | null
  is_major_task: boolean
  parent_task_id: number | null
  display_order: number
  created_at: string
  completed_at: string | null
  updated_at: string
  remarks?: TaskRemark[]
  subtasks?: Task[]
}

export interface TaskRemark {
  id: number
  task_id: number
  text: string
  timestamp: string
}

export interface TeamMember {
  id: number
  name: string
  created_at: string
}

export interface Equipment {
  id: number
  name: string
  equipment_type: string
  year: number | null
  make: string | null
  model: string | null
  vin: string | null
  license_plate: string | null
  acquisition_date: string | null
  mileage_hours: number | null
  registration_date: string | null
  registration_renewal_date: string | null
  insurance_expiration: string | null
  status: string
  notes: string | null
  description: string | null
  ownership: string | null
  created_at: string
}
