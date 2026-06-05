import { api } from './client'
import type { Company } from '@/types'

export const companiesApi = {
  list: (status?: string) =>
    api.get<Company[]>(`/companies${status ? `?status=${status}` : ''}`),
  get: (id: string) => api.get<Company>(`/companies/${id}`),
  create: (data: { name: string; website?: string }) =>
    api.post<Company>('/companies', data),
  update: (id: string, data: Partial<Company>) =>
    api.patch<Company>(`/companies/${id}`, data),
  intelligence: (id: string) =>
    api.post(`/companies/${id}/intelligence`),
}
