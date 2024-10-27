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
import { Transaction } from '@/types'
import { format } from 'date-fns'
import { api } from '@/lib/api'

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
  is_fixed: boolean
  frequency?: 'monthly' | 'quarterly' | 'yearly'
}

export function TransactionDialog({ transaction, onSave, children }: TransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    date: transaction?.date || format(new Date(), 'yyyy-MM-dd'),
    description: transaction?.description || '',
    amount: transaction?.amount?.toString() || '',
    category: transaction?.category || '',
    type: transaction?.type || 'expense',
    is_fixed: transaction?.is_fixed || false,
    frequency: transaction?.frequency
  })

  const handleDescriptionChange = async (newDescription: string) => {
    setFormData(prev => ({ ...prev, description: newDescription }))
    
    if (newDescription.length > 3 && !transaction) {
      try {
        const response = await api.post('/test-categorize', null, {
          params: { description: newDescription }
        })
        if (response.data.success) {
          setFormData(prev => ({ ...prev, category: response.data.category }))
        }
      } catch (error) {
        console.error('Error auto-categorizing:', error)
      }
    }
  }

  const validateForm = () => {
    if (!formData.date) return "Date is required"
    if (!formData.description.trim()) return "Description is required"
    if (!formData.amount || parseFloat(formData.amount) <= 0) return "Amount must be greater than 0"
    if (!formData.category.trim()) return "Category is required"
    if (formData.is_fixed && !formData.frequency) return "Frequency is required for fixed transactions"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // Validate form
      const validationError = validateForm()
      if (validationError) {
        throw new Error(validationError)
      }

      // Format data for submission
      const submissionData: Partial<Transaction> = {
        date: formData.date,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category.trim(),
        type: formData.type,
        is_fixed: formData.is_fixed,
        ...(formData.is_fixed && { frequency: formData.frequency })
      }

      console.log('Submitting data:', submissionData)
      await onSave(submissionData)
      setOpen(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error saving transaction:', err)
    } finally {
      setLoading(false)
    }
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
              onChange={(e) => handleDescriptionChange(e.target.value)}
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
          <div className="flex items-center space-x-2">
          <Checkbox
            id="is_fixed"
            checked={formData.is_fixed}
            onCheckedChange={(checked) =>
              setFormData(prev => ({
                ...prev,
                is_fixed: checked as boolean,
              }))
            }
          />
          <Label htmlFor="is_fixed">Fixed Transaction</Label>
          </div>
          {formData.is_fixed && (
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') =>
                  setFormData(prev => ({
                    ...prev,
                    frequency: value
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {error && (
            <div className="text-sm text-red-500 mt-2">
              {error}
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>   
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}