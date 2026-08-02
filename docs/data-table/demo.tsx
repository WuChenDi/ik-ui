'use client'

import type { ColumnDef } from '@tanstack/react-table'
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { DataTable } from '@/registry/ikui/data-table'
import { DataTableCellBadge } from '@/registry/ikui/data-table-cell-badge'
import { DataTableCellBar } from '@/registry/ikui/data-table-cell-bar'
import { DataTableCellGauge } from '@/registry/ikui/data-table-cell-gauge'
import { DataTableCellStar } from '@/registry/ikui/data-table-cell-star'
import { DataTableCellText } from '@/registry/ikui/data-table-cell-text'
import { DataTableCellTimestamp } from '@/registry/ikui/data-table-cell-timestamp'
import { DataTableColumnHeader } from '@/registry/ikui/data-table-column-header'
import { DataTableToolbar } from '@/registry/ikui/data-table-toolbar'

interface Task {
  id: string
  title: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  estimatedHours: number
  progress: number
  favorite: boolean
  createdAt: Date
}

const data: Task[] = [
  {
    id: 'TASK-1',
    title: 'Wire up the auth flow',
    status: 'in-progress',
    priority: 'high',
    estimatedHours: 8,
    progress: 60,
    favorite: true,
    createdAt: new Date('2026-07-20T09:15:00'),
  },
  {
    id: 'TASK-2',
    title: 'Design the settings page',
    status: 'todo',
    priority: 'medium',
    estimatedHours: 5,
    progress: 0,
    favorite: false,
    createdAt: new Date('2026-07-22T14:30:00'),
  },
  {
    id: 'TASK-3',
    title: 'Fix the pagination bug',
    status: 'done',
    priority: 'high',
    estimatedHours: 2,
    progress: 100,
    favorite: false,
    createdAt: new Date('2026-07-18T11:05:00'),
  },
  {
    id: 'TASK-4',
    title: 'Write the API docs',
    status: 'todo',
    priority: 'low',
    estimatedHours: 4,
    progress: 10,
    favorite: true,
    createdAt: new Date('2026-07-25T16:45:00'),
  },
  {
    id: 'TASK-5',
    title: 'Add dark mode tokens',
    status: 'in-progress',
    priority: 'medium',
    estimatedHours: 6,
    progress: 45,
    favorite: false,
    createdAt: new Date('2026-07-19T08:20:00'),
  },
  {
    id: 'TASK-6',
    title: 'Optimize the image loader',
    status: 'todo',
    priority: 'high',
    estimatedHours: 3,
    progress: 0,
    favorite: true,
    createdAt: new Date('2026-07-28T13:10:00'),
  },
  {
    id: 'TASK-7',
    title: 'Refactor the table state',
    status: 'done',
    priority: 'low',
    estimatedHours: 7,
    progress: 100,
    favorite: false,
    createdAt: new Date('2026-07-15T10:00:00'),
  },
  {
    id: 'TASK-8',
    title: 'Set up CI caching',
    status: 'in-progress',
    priority: 'medium',
    estimatedHours: 5,
    progress: 75,
    favorite: true,
    createdAt: new Date('2026-07-30T17:55:00'),
  },
]

const statusColors: Record<Task['status'], string> = {
  todo: '#64748b',
  'in-progress': '#3b82f6',
  done: '#22c55e',
}

const columns: ColumnDef<Task>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => <DataTableCellText value={row.getValue('title')} />,
    meta: { label: 'Title', variant: 'text', placeholder: 'Filter titles...' },
    enableColumnFilter: true,
    filterFn: 'includesString',
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as Task['status']
      return <DataTableCellBadge value={status} color={statusColors[status]} />
    },
    meta: {
      label: 'Status',
      variant: 'select',
      options: [
        { label: 'Todo', value: 'todo' },
        { label: 'In progress', value: 'in-progress' },
        { label: 'Done', value: 'done' },
      ],
    },
    enableColumnFilter: true,
    filterFn: 'arrIncludesSome',
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => (
      <span className="capitalize">{row.getValue('priority')}</span>
    ),
    meta: {
      label: 'Priority',
      variant: 'multiSelect',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
    },
    enableColumnFilter: true,
    filterFn: 'arrIncludesSome',
  },
  {
    accessorKey: 'estimatedHours',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Est. hours" />
    ),
    cell: ({ row }) => (
      <DataTableCellBar
        value={row.getValue('estimatedHours')}
        min={0}
        max={12}
        unit="h"
      />
    ),
    meta: { label: 'Est. hours', variant: 'range', range: [0, 12], unit: 'h' },
    enableColumnFilter: true,
    filterFn: (row, id, value: [number, number]) => {
      const v = row.getValue<number>(id)
      return v >= value[0] && v <= value[1]
    },
  },
  {
    accessorKey: 'progress',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Progress" />
    ),
    cell: ({ row }) => (
      <DataTableCellGauge
        value={row.getValue('progress')}
        min={0}
        max={100}
        unit="%"
      />
    ),
    meta: { label: 'Progress', variant: 'range', range: [0, 100], unit: '%' },
    enableColumnFilter: true,
    filterFn: (row, id, value: [number, number]) => {
      const v = row.getValue<number>(id)
      return v >= value[0] && v <= value[1]
    },
  },
  {
    accessorKey: 'favorite',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Favorite" />
    ),
    cell: ({ row }) => <DataTableCellStar value={row.getValue('favorite')} />,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <DataTableCellTimestamp date={row.getValue('createdAt')} />
    ),
  },
]

export function Demo() {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize: 5 } },
  })

  return (
    <div className="w-full">
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  )
}
