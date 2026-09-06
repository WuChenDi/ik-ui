'use client'

import type { Column, RowData } from '@tanstack/react-table'
import { PlusCircle, XCircle } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import type { DataTableFeatures } from '@/lib/data-table-utils'

interface Range {
  min: number
  max: number
}

type RangeValue = [number, number]

function getIsValidRange(value: unknown): value is RangeValue {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  )
}

interface DataTableSliderFilterProps<TData extends RowData> {
  column: Column<DataTableFeatures, TData, unknown>
  title?: string
}

export function DataTableSliderFilter<TData extends RowData>({
  column,
  title,
}: DataTableSliderFilterProps<TData>) {
  const id = React.useId()

  const columnFilterValue = getIsValidRange(column.getFilterValue())
    ? (column.getFilterValue() as RangeValue)
    : undefined

  const defaultRange = column.columnDef.meta?.range
  const unit = column.columnDef.meta?.unit

  // Read the facets outside the memo: they change with the other columns'
  // filters, so they have to be a dependency rather than a value captured once.
  const facetedMinMaxValues = column.getFacetedMinMaxValues()

  const { min, max, step } = React.useMemo<Range & { step: number }>(() => {
    let minValue = 0
    let maxValue = 100

    if (defaultRange && getIsValidRange(defaultRange)) {
      ;[minValue, maxValue] = defaultRange
    } else {
      const values = facetedMinMaxValues
      if (values && Array.isArray(values) && values.length === 2) {
        const [facetMinValue, facetMaxValue] = values
        if (
          typeof facetMinValue === 'number' &&
          typeof facetMaxValue === 'number'
        ) {
          minValue = facetMinValue
          maxValue = facetMaxValue
        }
      }
    }

    const rangeSize = maxValue - minValue
    const step =
      rangeSize <= 20
        ? 1
        : rangeSize <= 100
          ? Math.ceil(rangeSize / 20)
          : Math.ceil(rangeSize / 50)

    return { min: minValue, max: maxValue, step }
  }, [defaultRange, facetedMinMaxValues])

  const range = React.useMemo((): RangeValue => {
    return columnFilterValue ?? [min, max]
  }, [columnFilterValue, min, max])

  const formatValue = React.useCallback((value: number) => {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }, [])

  const onFromInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = Number(event.target.value)
      if (!Number.isNaN(numValue) && numValue >= min && numValue <= range[1]) {
        column.setFilterValue([numValue, range[1]])
      }
    },
    [column, min, range],
  )

  const onToInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = Number(event.target.value)
      if (!Number.isNaN(numValue) && numValue <= max && numValue >= range[0]) {
        column.setFilterValue([range[0], numValue])
      }
    },
    [column, max, range],
  )

  const onSliderValueChange = React.useCallback(
    (value: number | readonly number[]) => {
      if (Array.isArray(value) && value.length === 2) {
        column.setFilterValue([value[0], value[1]])
      }
    },
    [column],
  )

  const onReset = React.useCallback(
    (event: React.MouseEvent) => {
      if (event.target instanceof HTMLDivElement) {
        event.stopPropagation()
      }
      column.setFilterValue(undefined)
    },
    [column],
  )

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="border-dashed">
            {columnFilterValue ? (
              <div
                role="button"
                aria-label={`Clear ${title} filter`}
                tabIndex={0}
                className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                onClick={onReset}
              >
                <XCircle />
              </div>
            ) : (
              <PlusCircle />
            )}
            <span>{title}</span>
            {columnFilterValue ? (
              <>
                <Separator orientation="vertical" className="mx-0.5" />
                {formatValue(columnFilterValue[0])} -{' '}
                {formatValue(columnFilterValue[1])}
                {unit ? ` ${unit}` : ''}
              </>
            ) : null}
          </Button>
        }
      />
      <PopoverContent align="start" className="flex w-auto flex-col gap-4">
        <div className="flex flex-col gap-3">
          <p className="leading-none font-medium">{title}</p>
          <div className="flex items-center gap-4">
            <Label htmlFor={`${id}-from`} className="sr-only">
              From
            </Label>
            <InputGroup className="w-24">
              <InputGroupInput
                id={`${id}-from`}
                type="number"
                aria-valuemin={min}
                aria-valuemax={max}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={min.toString()}
                min={min}
                max={max}
                value={range[0]?.toString()}
                onChange={onFromInputChange}
                className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              {unit && (
                <InputGroupAddon align="inline-end">
                  <InputGroupText>{unit}</InputGroupText>
                </InputGroupAddon>
              )}
            </InputGroup>
            <Label htmlFor={`${id}-to`} className="sr-only">
              to
            </Label>
            <InputGroup className="w-24">
              <InputGroupInput
                id={`${id}-to`}
                type="number"
                aria-valuemin={min}
                aria-valuemax={max}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={max.toString()}
                min={min}
                max={max}
                value={range[1]?.toString()}
                onChange={onToInputChange}
                className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              {unit && (
                <InputGroupAddon align="inline-end">
                  <InputGroupText>{unit}</InputGroupText>
                </InputGroupAddon>
              )}
            </InputGroup>
          </div>
          <Label htmlFor={`${id}-slider`} className="sr-only">
            {title} slider
          </Label>
          <Slider
            id={`${id}-slider`}
            min={min}
            max={max}
            step={step}
            value={range}
            onValueChange={onSliderValueChange}
          />
        </div>
        <Button
          aria-label={`Clear ${title} filter`}
          variant="outline"
          size="sm"
          onClick={onReset}
        >
          Clear
        </Button>
      </PopoverContent>
    </Popover>
  )
}
