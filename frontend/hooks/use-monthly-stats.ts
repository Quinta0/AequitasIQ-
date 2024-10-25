import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface MonthlyStats {
  total_income: number
  total_expenses: number
  net_savings: number
  saving_rate: number
}

export function useMonthlyStats(year: number, month?: number) {
  return useQuery({
    queryKey: ['monthly-stats', year, month],
    queryFn: async () => {
      const { data } = await api.get<MonthlyStats>('/statistics/monthly', {
        params: {
          year,
          month,
        },
      })
      return data
    },
  })
}