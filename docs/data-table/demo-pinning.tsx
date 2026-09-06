'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { useTable } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/registry/ikui/data-table'
import { DataTableCellText } from '@/registry/ikui/data-table-cell-text'
import type { DataTableFeatures } from '@/registry/ikui/data-table-utils'
import { dataTableFeatures } from '@/registry/ikui/data-table-utils'

interface Employee {
  id: string
  name: string
  email: string
  department: string
  location: string
  phone: string
  title: string
}

const data: Employee[] = [
  {
    id: 'EMP-01',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    department: 'Engineering',
    location: 'London',
    phone: '+44 20 7946 0958',
    title: 'Principal Engineer',
  },
  {
    id: 'EMP-02',
    name: 'Grace Hopper',
    email: 'grace@example.com',
    department: 'Platform',
    location: 'New York',
    phone: '+1 212 555 0142',
    title: 'Staff Engineer',
  },
  {
    id: 'EMP-03',
    name: 'Alan Turing',
    email: 'alan@example.com',
    department: 'Research',
    location: 'Manchester',
    phone: '+44 161 496 0311',
    title: 'Research Lead',
  },
  {
    id: 'EMP-04',
    name: 'Katherine Johnson',
    email: 'kj@example.com',
    department: 'Data',
    location: 'Hampton',
    phone: '+1 757 555 0173',
    title: 'Data Scientist',
  },
]

const columns: ColumnDef<DataTableFeatures, Employee>[] = [
  { accessorKey: 'id', header: 'ID', size: 90 },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 180,
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('name')}</span>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    size: 220,
    cell: ({ row }) => <DataTableCellText value={row.getValue('email')} />,
  },
  { accessorKey: 'title', header: 'Title', size: 200 },
  { accessorKey: 'department', header: 'Department', size: 160 },
  { accessorKey: 'location', header: 'Location', size: 140 },
  { accessorKey: 'phone', header: 'Phone', size: 180 },
  {
    id: 'actions',
    header: '',
    size: 56,
    cell: () => (
      <Button variant="ghost" size="icon" className="size-7">
        <MoreHorizontal />
        <span className="sr-only">Open menu</span>
      </Button>
    ),
  },
]

export function Demo() {
  const table = useTable({
    data,
    columns,
    features: dataTableFeatures,
    initialState: {
      columnPinning: { start: ['id'], end: ['actions'] },
    },
  })

  return (
    <div className="w-full">
      {/* The table is wider than the viewport, so the pinned `id` (left) and
          `actions` (right) columns stay put while the rest scrolls sideways. */}
      <DataTable table={table} className="min-w-[1100px]" />
    </div>
  )
}
