'use client'

import type { ColumnDef } from '@tanstack/react-table'
import {
  createPaginatedRowModel,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { RefreshCw } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/registry/ikui/data-table'
import { DataTableSkeleton } from '@/registry/ikui/data-table-skeleton'
import type { DataTableFeatures } from '@/registry/ikui/data-table-utils'
import { dataTableFeatures } from '@/registry/ikui/data-table-utils'

interface Invoice {
  id: string
  customer: string
  amount: string
  status: string
}

const data: Invoice[] = [
  { id: 'INV-001', customer: 'Acme Inc', amount: '$1,200', status: 'Paid' },
  { id: 'INV-002', customer: 'Globex', amount: '$860', status: 'Pending' },
  { id: 'INV-003', customer: 'Initech', amount: '$4,300', status: 'Paid' },
  { id: 'INV-004', customer: 'Umbrella', amount: '$120', status: 'Overdue' },
]

const columns: ColumnDef<DataTableFeatures, Invoice>[] = [
  { accessorKey: 'id', header: 'Invoice' },
  { accessorKey: 'customer', header: 'Customer' },
  { accessorKey: 'amount', header: 'Amount' },
  { accessorKey: 'status', header: 'Status' },
]

export function Demo() {
  const [isLoading, setIsLoading] = React.useState(true)

  const table = useTable({
    data,
    columns,
    features: tableFeatures({
      ...dataTableFeatures,
      paginatedRowModel: createPaginatedRowModel(),
    }),
  })

  return (
    <div className="flex w-full flex-col gap-3">
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setIsLoading((v) => !v)}
      >
        <RefreshCw />
        {isLoading ? 'Show data' : 'Show skeleton'}
      </Button>
      {isLoading ? (
        <DataTableSkeleton columnCount={columns.length} rowCount={4} />
      ) : (
        <DataTable table={table} />
      )}
    </div>
  )
}
