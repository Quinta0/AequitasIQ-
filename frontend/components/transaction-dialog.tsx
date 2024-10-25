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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Transaction } from '@/types'
import { format } from 'date-fns'

interface TransactionDialogProps {
  transaction?: Transaction
  onSave: (data: Partial<Transaction>) => void
  children?: React.ReactNode
}

interface FormData {
  date: string
  description: string
  amount: string
  category: string
  type: 'income' | 'expense'
}

export function TransactionDialog({ transaction, onSave, children }: TransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    date: transaction?.date || format(new Date(), 'yyyy-MM-dd'),
    description: transaction?.description || '',
    amount: transaction?.amount?.toString() || '',
    category: transaction?.category || '',
    type: transaction?.type || 'expense'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convert form data to match Transaction type
    const submissionData: Partial<Transaction> = {
      ...formData,
      amount: parseFloat(formData.amount) // Convert string to number
    }

    onSave(submissionData)
    setOpen(false)
  }

  const handleTypeChange = (value: 'income' | 'expense') => {
    setFormData(prev => ({
      ...prev,
      type: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button variant={transaction ? 'ghost' : 'default'}>
          {transaction ? 'Edit' : 'Add Transaction'}
        </Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </DialogTitle>
          <DialogDescription>
            {transaction
              ? 'Edit the transaction details below'
              : 'Add a new transaction by filling out the form below'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, date: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
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
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, category: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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