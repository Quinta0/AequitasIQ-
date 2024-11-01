import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface PeriodSelectionProps {
  selectedYear: number;
  selectedMonth: number | undefined;
  periodType: 'monthly' | 'yearly';
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onPeriodTypeChange: (type: 'monthly' | 'yearly') => void;
}

export function PeriodSelection({
  selectedYear,
  selectedMonth,
  periodType,
  onYearChange,
  onMonthChange,
  onPeriodTypeChange,
}: PeriodSelectionProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle>Period Selection</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-center gap-4">
            <Toggle
              pressed={periodType === 'monthly'}
              onPressedChange={() => onPeriodTypeChange('monthly')}
            >
              Monthly
            </Toggle>
            <Toggle
              pressed={periodType === 'yearly'}
              onPressedChange={() => onPeriodTypeChange('yearly')}
            >
              Yearly
            </Toggle>
          </div>

          <div className="flex gap-4 justify-center">
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => onYearChange(parseInt(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {periodType === 'monthly' && (
              <Select
                value={selectedMonth?.toString()}
                onValueChange={(value) => onMonthChange(parseInt(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}