'use client'

import type { ColumnDef } from '@tanstack/react-table'
import {
  createPaginatedRowModel,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable } from '@/registry/ikui/data-table'
import { DataTableCellText } from '@/registry/ikui/data-table-cell-text'
import type { DataTableFeatures } from '@/registry/ikui/data-table-utils'
import { dataTableFeatures } from '@/registry/ikui/data-table-utils'

interface Member {
  id: string
  name: string
  email: string
  role: string
}

const data: Member[] = [
  { id: '1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'Owner' },
  { id: '2', name: 'Alan Turing', email: 'alan@example.com', role: 'Admin' },
  { id: '3', name: 'Grace Hopper', email: 'grace@example.com', role: 'Member' },
  {
    id: '4',
    name: 'Linus Pauling',
    email: 'linus@example.com',
    role: 'Member',
  },
  {
    id: '5',
    name: 'Katherine Johnson',
    email: 'kj@example.com',
    role: 'Admin',
  },
]

const columns: ColumnDef<DataTableFeatures, Member>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(checked) =>
          table.toggleAllPageRowsSelected(!!checked)
        }
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    size: 32,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('name')}</span>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <DataTableCellText value={row.getValue('email')} />,
  },
  { accessorKey: 'role', header: 'Role' },
]

export function Demo() {
  const table = useTable({
    data,
    columns,
    features: tableFeatures({
      ...dataTableFeatures,
      paginatedRowModel: createPaginatedRowModel(),
    }),
  })

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <div className="w-full">
      <DataTable
        table={table}
        actionBar={
          <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-2 text-sm">
            <span className="text-muted-foreground">
              {selectedCount} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.resetRowSelection()}
              >
                <X />
                Clear
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 />
                Delete
              </Button>
            </div>
          </div>
        }
      />
    </div>
  )
}
