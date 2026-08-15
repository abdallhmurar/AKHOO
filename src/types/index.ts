export type ServiceType = 'battery' | 'tire' | 'fuel' | 'locked_car' | 'other'
export type RequestStatus = 'open' | 'accepted' | 'on_the_way' | 'arrived' | 'completed' | 'cancelled'

export type HelpRequest = {
  id: string
  requester_id: string
  service_type: ServiceType
  note: string | null
  latitude: number
  longitude: number
  status: RequestStatus
  volunteer_id: string | null
  created_at: string
  accepted_at: string | null
  completed_at: string | null
}

export type Profile = {
  id: string
  full_name: string
  phone: string | null
}
