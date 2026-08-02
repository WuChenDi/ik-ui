'use client'

import type { ColumnDef } from '@tanstack/react-table'
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { RefreshCw } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/registry/ikui/data-table'
import { DataTableSkeleton } from '@/registry/ikui/data-table-skeleton'

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

const columns: ColumnDef<Invoice>[] = [
  { accessorKey: 'id', header: 'Invoice' },
  { accessorKey: 'customer', header: 'Customer' },
  { accessorKey: 'amount', header: 'Amount' },
  { accessorKey: 'status', header: 'Status' },
]

export function Demo() {
  const [isLoading, setIsLoading] = React.useState(true)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
