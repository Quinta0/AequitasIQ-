import { BillsCalendarView } from '@/components/bills-calendar-view'

export default function BillsPage() {
  return (
    <div className="container py-8 min-w-full">
      <h1 className="text-3xl font-bold mb-8">Bills & Recurring Payments</h1>
      <BillsCalendarView />
    </div>
  )
}