"use client";
import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';
import { api } from '@/lib/api';

export default function ExportDialog() {
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState('transactions');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        ...(category && { category }),
      });

      const response = await api.get(`/export/${exportType}?${params}`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${exportType}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Choose the type of data and date range to export
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Export Type</Label>
            <Select
              value={exportType}
              onValueChange={setExportType}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transactions">Transactions</SelectItem>
                <SelectItem value="bills">Bills</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-sm">Start Date</Label>
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  className="rounded-md border"
                />
              </div>
              <div>
                <Label className="text-sm">End Date</Label>
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  className="rounded-md border"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={loading}
            >
              {loading ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
