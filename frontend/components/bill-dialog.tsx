'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bill } from '@/types'
import { format } from 'date-fns'

interface BillDialogProps {
  children?: React.ReactNode
  bill?: Bill
  onSave: (data: Partial<Bill>) => void
  onClose?: () => void
}

interface FormData {
  name: string
  amount: string
  due_date: string
  category: string
  is_recurring: boolean
  frequency: 'monthly' | 'quarterly' | 'yearly'
}

export function BillDialog({ children, bill, onSave, onClose }: BillDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: bill?.name || '',
    amount: bill?.amount?.toString() || '',
    due_date: bill?.due_date || format(new Date(), 'yyyy-MM-dd'),
    category: bill?.category || '',
    is_recurring: bill?.is_recurring || false,
    frequency: bill?.frequency || 'monthly'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convert form data to match Bill type
    const submissionData: Partial<Bill> = {
      ...formData,
      amount: parseFloat(formData.amount) // Convert string to number
    }

    onSave(submissionData)
    setOpen(false)
    onClose?.()
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen && onClose) {
      onClose()
    }
  }

  const handleFrequencyChange = (value: 'monthly' | 'quarterly' | 'yearly') => {
    setFormData(prev => ({
      ...prev,
      frequency: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || <Button variant={bill ? 'ghost' : 'default'}>
          {bill ? 'Edit' : 'Add Bill'}
        </Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {bill ? 'Edit Bill' : 'Add Bill'}
          </DialogTitle>
          <DialogDescription>
            {bill
              ? 'Edit the bill details below'
              : 'Add a new bill by filling out the form below'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Bill Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, amount: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, due_date: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, category: e.target.value }))
              }
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_recurring"
              checked={formData.is_recurring}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  is_recurring: checked as boolean,
                }))
              }
            />
            <Label htmlFor="is_recurring">Recurring Bill</Label>
          </div>
          {formData.is_recurring && (
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={handleFrequencyChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}